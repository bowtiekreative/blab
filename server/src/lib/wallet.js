import { pool } from '../db/index.js';

/**
 * Token wallet ledger. All balance changes go through credit/debit, which also
 * append an immutable row to token_transactions. Pass a pg client to enrol the
 * operation in a surrounding transaction; otherwise the pool is used.
 */

export class InsufficientFunds extends Error {
  constructor(needed, have) {
    super('Insufficient token balance');
    this.code = 'INSUFFICIENT_FUNDS';
    this.needed = needed;
    this.have = have;
  }
}

/** Run a function inside a DB transaction, passing it the client. */
export async function withTx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Ensure a wallet row exists and return the current balance. */
export async function ensureWallet(client, userId) {
  const { rows } = await client.query(
    `INSERT INTO wallets (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
     RETURNING token_balance`,
    [userId],
  );
  return rows[0].token_balance;
}

function logTx(client, { from, to, amount, type, roomId, description, stripePaymentId }) {
  return client.query(
    `INSERT INTO token_transactions
       (from_user_id, to_user_id, amount, token_type, room_id, description, stripe_payment_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [from || null, to || null, amount, type, roomId || null, description || null, stripePaymentId || null],
  );
}

/** Credit ⏣ to a user (earnings, purchases). */
export async function credit(client, userId, amount, { type, from, roomId, description, stripePaymentId } = {}) {
  if (amount <= 0) return;
  await ensureWallet(client, userId);
  await client.query(
    `UPDATE wallets
        SET token_balance = token_balance + $2,
            token_lifetime_earned = token_lifetime_earned + $2,
            updated_at = NOW()
      WHERE user_id = $1`,
    [userId, amount],
  );
  await logTx(client, { from, to: userId, amount, type, roomId, description, stripePaymentId });
}

/** Debit ⏣ from a user (spending). Throws InsufficientFunds if balance too low. */
export async function debit(client, userId, amount, { type, to, roomId, description } = {}) {
  if (amount <= 0) return;
  await ensureWallet(client, userId);
  // Conditional update enforces the non-negative balance atomically.
  const { rowCount } = await client.query(
    `UPDATE wallets
        SET token_balance = token_balance - $2,
            token_lifetime_spent = token_lifetime_spent + $2,
            updated_at = NOW()
      WHERE user_id = $1 AND token_balance >= $2`,
    [userId, amount],
  );
  if (rowCount === 0) {
    const { rows } = await client.query('SELECT token_balance FROM wallets WHERE user_id = $1', [userId]);
    throw new InsufficientFunds(amount, rows[0]?.token_balance ?? 0);
  }
  await logTx(client, { from: userId, to, amount, type, roomId, description });
}

/** Read a user's balance (creates the wallet if missing). */
export async function getBalance(userId) {
  return withTx((client) => ensureWallet(client, userId));
}
