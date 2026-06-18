-- Phase 5: token economy (api/tokens.md, api/monetization.md)
-- Dual currency: ⏣ tokens (in-app) and USD cents (Stripe). 100 ⏣ = $1.00.

-- Stripe Connect account for payouts.
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);

-- ---------------------------------------------------------------------------
-- wallets — one per user, holds the ⏣ balance and lifetime counters.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
  user_id               UUID PRIMARY KEY REFERENCES users(id),
  token_balance         INTEGER NOT NULL DEFAULT 0,
  token_lifetime_earned INTEGER NOT NULL DEFAULT 0,
  token_lifetime_spent  INTEGER NOT NULL DEFAULT 0,
  lifetime_cashed_out_cents INTEGER NOT NULL DEFAULT 0,  -- USD cents paid out
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT token_balance_non_negative CHECK (token_balance >= 0)
);

-- ---------------------------------------------------------------------------
-- token_transactions — append-only ledger of every ⏣ movement.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS token_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id      UUID REFERENCES users(id),   -- null for purchases / platform credits
  to_user_id        UUID REFERENCES users(id),   -- null for cash-out / platform debits
  amount            INTEGER NOT NULL,            -- always positive ⏣
  token_type        VARCHAR(30) NOT NULL,
    -- clap, gift, gift_earning, clap_earning, purchase, cash_out, platform_fee,
    -- host_earning, referral, room_feature
  room_id           UUID REFERENCES rooms(id),
  description       TEXT,
  stripe_payment_id VARCHAR(255),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_tx_from ON token_transactions (from_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_tx_to   ON token_transactions (to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_tx_type ON token_transactions (token_type);

-- ---------------------------------------------------------------------------
-- gifts — record of gifts sent in rooms (animation + economics).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gifts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  sender_id       UUID NOT NULL REFERENCES users(id),
  recipient_id    UUID NOT NULL REFERENCES users(id),
  gift_type       VARCHAR(30) NOT NULL,
  cost            INTEGER NOT NULL,            -- ⏣ paid by sender
  recipient_earned INTEGER NOT NULL,           -- ⏣ credited to recipient
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gifts_room ON gifts (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gifts_recipient ON gifts (recipient_id);

-- ---------------------------------------------------------------------------
-- payouts — cash-out requests (⏣ → USD via Stripe Connect).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  tokens          INTEGER NOT NULL,            -- ⏣ converted
  gross_cents     INTEGER NOT NULL,            -- USD value before fee
  fee_cents       INTEGER NOT NULL,            -- 15% platform fee
  net_cents       INTEGER NOT NULL,            -- paid to user
  status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, failed
  stripe_transfer_id VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_user ON payouts (user_id, created_at DESC);
