import { query } from '../db/index.js';
import { ok, fail } from '../lib/respond.js';
import { withTx, credit, debit, getBalance, InsufficientFunds } from '../lib/wallet.js';
import { CASH_OUT, TOKENS_PER_DOLLAR, tokensToCents } from '../lib/economy.js';
import { stripeEnabled, getStripe } from '../lib/stripe.js';

const EARNING_TYPES = ['gift_earning', 'clap_earning', 'host_earning', 'referral', 'purchase'];

export default async function tokenRoutes(fastify) {
  /** GET /v1/tokens/exchange-rate */
  fastify.get('/tokens/exchange-rate', async () =>
    ok({ tokensPerDollar: TOKENS_PER_DOLLAR, centsPerToken: 100 / TOKENS_PER_DOLLAR }),
  );

  /** GET /v1/tokens/balance */
  fastify.get('/tokens/balance', { preHandler: fastify.authenticate }, async (request) => {
    const { rows } = await query(
      `SELECT token_balance, token_lifetime_earned, token_lifetime_spent
         FROM wallets WHERE user_id = $1`,
      [request.user.sub],
    );
    const w = rows[0] || { token_balance: 0, token_lifetime_earned: 0, token_lifetime_spent: 0 };
    return ok({
      balance: w.token_balance,
      lifetimeEarned: w.token_lifetime_earned,
      lifetimeSpent: w.token_lifetime_spent,
      valueUsdCents: tokensToCents(w.token_balance),
    });
  });

  /** GET /v1/tokens/transactions */
  fastify.get('/tokens/transactions', { preHandler: fastify.authenticate }, async (request) => {
    const { rows } = await query(
      `SELECT id, from_user_id, to_user_id, amount, token_type, room_id, description, created_at
         FROM token_transactions
        WHERE from_user_id = $1 OR to_user_id = $1
        ORDER BY created_at DESC LIMIT 100`,
      [request.user.sub],
    );
    // Signed amount from the caller's perspective.
    return ok(
      rows.map((t) => ({
        ...t,
        direction: t.to_user_id === request.user.sub ? 'credit' : 'debit',
        signedAmount: t.to_user_id === request.user.sub ? t.amount : -t.amount,
      })),
    );
  });

  /** GET /v1/tokens/earnings-history — breakdown of how the user earned ⏣. */
  fastify.get('/tokens/earnings-history', { preHandler: fastify.authenticate }, async (request) => {
    const { rows } = await query(
      `SELECT token_type, COUNT(*)::int AS count, COALESCE(SUM(amount), 0)::int AS total
         FROM token_transactions
        WHERE to_user_id = $1 AND token_type = ANY($2)
        GROUP BY token_type ORDER BY total DESC`,
      [request.user.sub, EARNING_TYPES],
    );
    return ok(rows);
  });

  /**
   * POST /v1/tokens/purchase — buy ⏣ with USD.
   * Dev/simulated mode (no Stripe key): credits tokens instantly.
   * Live mode: creates a Stripe PaymentIntent; tokens are credited on webhook
   * confirmation (webhook handling is a later pass).
   */
  fastify.post('/tokens/purchase', { preHandler: fastify.authenticate }, async (request, reply) => {
    const tokens = Number(request.body?.tokens);
    if (!Number.isInteger(tokens) || tokens < 100) {
      return fail(reply, 400, 'VALIDATION_ERROR', 'tokens must be an integer ≥ 100');
    }
    const amountCents = tokensToCents(tokens);

    if (!stripeEnabled()) {
      await withTx((client) =>
        credit(client, request.user.sub, tokens, {
          type: 'purchase',
          description: `Simulated purchase of ${tokens} ⏣`,
        }),
      );
      const balance = await getBalance(request.user.sub);
      return ok({ simulated: true, tokens, amountCents, balance });
    }

    const stripe = await getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: { userId: request.user.sub, tokens: String(tokens) },
    });
    return ok({ simulated: false, clientSecret: intent.client_secret, tokens, amountCents });
  });

  /**
   * POST /v1/tokens/convert-to-cash — cash out ⏣ → USD (15% platform fee).
   */
  fastify.post('/tokens/convert-to-cash', { preHandler: fastify.authenticate }, async (request, reply) => {
    const tokens = Number(request.body?.tokens);
    if (!Number.isInteger(tokens) || tokens < CASH_OUT.minTokens) {
      return fail(reply, 400, 'VALIDATION_ERROR', `Minimum cash-out is ${CASH_OUT.minTokens} ⏣`);
    }

    const grossCents = tokensToCents(tokens);
    const feeCents = Math.round(grossCents * CASH_OUT.platformFeeRate);
    const netCents = grossCents - feeCents;

    // Enforce the monthly cap (rolling 30 days).
    const { rows: capRows } = await query(
      `SELECT COALESCE(SUM(net_cents), 0)::int AS used
         FROM payouts
        WHERE user_id = $1 AND status <> 'failed' AND created_at > NOW() - INTERVAL '30 days'`,
      [request.user.sub],
    );
    if (capRows[0].used + netCents > CASH_OUT.maxCentsPerMonth) {
      return fail(reply, 422, 'CASH_OUT_LIMIT', 'Monthly cash-out limit exceeded');
    }

    try {
      const payout = await withTx(async (client) => {
        await debit(client, request.user.sub, tokens, {
          type: 'cash_out',
          description: `Cash out ${tokens} ⏣ → $${(netCents / 100).toFixed(2)} (15% fee)`,
        });
        await client.query(
          `UPDATE wallets SET lifetime_cashed_out_cents = lifetime_cashed_out_cents + $2 WHERE user_id = $1`,
          [request.user.sub, netCents],
        );
        const { rows } = await client.query(
          `INSERT INTO payouts (user_id, tokens, gross_cents, fee_cents, net_cents, status)
                VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, status`,
          [request.user.sub, tokens, grossCents, feeCents, netCents, stripeEnabled() ? 'pending' : 'paid'],
        );
        return rows[0];
      });

      // Live mode would initiate a Stripe Connect transfer here; in simulated
      // mode the payout is marked 'paid' immediately (no real money moves).
      return ok({
        simulated: !stripeEnabled(),
        payoutId: payout.id,
        status: payout.status,
        tokens,
        grossCents,
        feeCents,
        netCents,
      });
    } catch (err) {
      if (err instanceof InsufficientFunds) {
        return fail(reply, 422, 'INSUFFICIENT_FUNDS', 'Not enough tokens', {
          needed: err.needed,
          have: err.have,
        });
      }
      throw err;
    }
  });
}
