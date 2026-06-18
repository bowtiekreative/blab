-- Hustle Zone schema (clean-room, derived from api/database.md)
-- Phase 1–2 core tables. Later phases (wallets, squads, governance, etc.)
-- will be added as additional migration files.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username            VARCHAR(30) UNIQUE NOT NULL,
  display_name        VARCHAR(60),
  bio                 TEXT,
  avatar_url          TEXT,
  email               VARCHAR(255) UNIQUE,

  google_id           VARCHAR(255) UNIQUE,
  facebook_id         VARCHAR(255) UNIQUE,
  x_id                VARCHAR(255) UNIQUE,

  verification_level  VARCHAR(20) DEFAULT 'basic',   -- basic, verified, id_verified
  verification_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected

  follower_count      INTEGER DEFAULT 0,
  following_count     INTEGER DEFAULT 0,
  total_claps         INTEGER DEFAULT 0,
  xp                  INTEGER DEFAULT 0,
  level               INTEGER DEFAULT 1,

  is_banned           BOOLEAN DEFAULT false,
  is_in_jail          BOOLEAN DEFAULT false,
  is_globally_blocked BOOLEAN DEFAULT false,
  strikes             INTEGER DEFAULT 0,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  last_seen_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users (is_banned);

-- ---------------------------------------------------------------------------
-- rooms (with the 4-slot carousel)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id         UUID NOT NULL REFERENCES users(id),
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  cover_image_url TEXT,
  category        VARCHAR(50),
  hashtags        TEXT[],

  is_live         BOOLEAN DEFAULT false,
  is_private      BOOLEAN DEFAULT false,
  is_recorded     BOOLEAN DEFAULT false,
  invite_code     VARCHAR(20) UNIQUE,
  is_banned       BOOLEAN DEFAULT false,

  current_topic   TEXT,

  -- 4-person carousel
  slot_0_user_id  UUID REFERENCES users(id),
  slot_1_user_id  UUID REFERENCES users(id),
  slot_2_user_id  UUID REFERENCES users(id),
  slot_3_user_id  UUID REFERENCES users(id),

  -- settings
  slow_mode       BOOLEAN DEFAULT false,
  slow_mode_delay INTEGER DEFAULT 5,
  gifts_enabled   BOOLEAN DEFAULT true,
  subs_only_mode  BOOLEAN DEFAULT false,

  livekit_room    VARCHAR(100),

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rooms_host ON rooms (host_id);
CREATE INDEX IF NOT EXISTS idx_rooms_live ON rooms (is_live) WHERE is_live = true;
CREATE INDEX IF NOT EXISTS idx_rooms_hashtags ON rooms USING gin (hashtags);
CREATE INDEX IF NOT EXISTS idx_rooms_name ON rooms USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_rooms_invite ON rooms (invite_code) WHERE invite_code IS NOT NULL;

-- ---------------------------------------------------------------------------
-- room_participants (slot history)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_participants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id          UUID NOT NULL REFERENCES rooms(id),
  user_id          UUID NOT NULL REFERENCES users(id),
  slot_index       INTEGER CHECK (slot_index >= 0 AND slot_index <= 3),
  joined_at        TIMESTAMPTZ DEFAULT NOW(),
  left_at          TIMESTAMPTZ,
  duration_seconds INTEGER
);

CREATE INDEX IF NOT EXISTS idx_room_participants_room ON room_participants (room_id, left_at);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  type            VARCHAR(20) NOT NULL DEFAULT 'text',
  content         TEXT,
  gif_url         TEXT,
  mentions        UUID[],
  hashtags        TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_room ON messages (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_mentions ON messages USING gin (mentions);

-- ---------------------------------------------------------------------------
-- claps (continuous, cumulative)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS claps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  giver_id        UUID NOT NULL REFERENCES users(id),
  receiver_id     UUID NOT NULL REFERENCES users(id),
  count           INTEGER NOT NULL DEFAULT 1,
  is_token_clap   BOOLEAN DEFAULT false,
  token_amount    INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claps_room ON claps (room_id, receiver_id);
