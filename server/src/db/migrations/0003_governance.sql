-- Phase 6: community & safety (api/squads.md, api/governance.md, api/moderation.md)
-- Three-tier governance: Room (Tier 1), Squad (Tier 2), Platform (Tier 3) + Jail.

-- Platform staff flag (Tier 3 enforcement).
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
-- Ban metadata (referenced by strike escalation + global ban).
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
-- Temporary chat mute (1st strike → 72h); suspension end (2nd strike → 7d).
ALTER TABLE users ADD COLUMN IF NOT EXISTS chat_muted_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;

-- ===========================================================================
-- Tier 2 — Squads
-- ===========================================================================
CREATE TABLE IF NOT EXISTS squads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(30) UNIQUE NOT NULL,
  description     TEXT,
  avatar_url      TEXT,
  cover_url       TEXT,
  brand_color     VARCHAR(7) DEFAULT '#6366f1',
  tagline         VARCHAR(100),
  conduct_rules   TEXT,
  member_count    INTEGER NOT NULL DEFAULT 1,
  total_go_live_alerts INTEGER NOT NULL DEFAULT 0,
  created_by      UUID NOT NULL REFERENCES users(id),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_squads_name ON squads USING gin (name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS squad_members (
  squad_id        UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  role            VARCHAR(20) NOT NULL DEFAULT 'member', -- super_admin, admin, moderator, member
  invited_by      UUID REFERENCES users(id),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (squad_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_squad_members_user ON squad_members (user_id);

CREATE TABLE IF NOT EXISTS squad_invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id        UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  invite_code     VARCHAR(36) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  invited_by      UUID NOT NULL REFERENCES users(id),
  invitee_id      UUID REFERENCES users(id),
  status          VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, expired
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_squad_invites_code ON squad_invites (invite_code);
CREATE INDEX IF NOT EXISTS idx_squad_invites_invitee ON squad_invites (invitee_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS squad_muted_words (
  squad_id        UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  word            VARCHAR(100) NOT NULL,
  added_by        UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (squad_id, word)
);

-- ===========================================================================
-- Tier 1 — Room governance
-- ===========================================================================
CREATE TABLE IF NOT EXISTS room_co_hosts (
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  promoted_by     UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS room_moderators (
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  added_by        UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS room_bans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  banned_by       UUID NOT NULL REFERENCES users(id),
  reason          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS room_muted_words (
  room_id         UUID NOT NULL REFERENCES rooms(id),
  word            VARCHAR(100) NOT NULL,
  scope           VARCHAR(20) NOT NULL DEFAULT 'all',  -- chat, transcript, all
  action          VARCHAR(10) NOT NULL DEFAULT 'hide', -- hide, delete, flag
  added_by        UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, word)
);

-- ===========================================================================
-- Tier 0 — Self moderation
-- ===========================================================================
CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id      UUID NOT NULL REFERENCES users(id),
  blocked_id      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- ===========================================================================
-- Reports → Tier 3 pipeline
-- ===========================================================================
CREATE TABLE IF NOT EXISTS reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID NOT NULL REFERENCES users(id),
  target_type     VARCHAR(10) NOT NULL,  -- user, room, message
  target_id       UUID NOT NULL,
  reason          VARCHAR(50) NOT NULL,
  description     TEXT,
  is_resolved     BOOLEAN DEFAULT false,
  resolved_by     UUID REFERENCES users(id),
  resolution      VARCHAR(20),           -- dismissed, jailed, banned, warned
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_unresolved ON reports (is_resolved) WHERE is_resolved = false;

CREATE TABLE IF NOT EXISTS strikes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  issued_by       UUID NOT NULL REFERENCES users(id),
  reason          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_strikes_user ON strikes (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS jail (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  reason          TEXT NOT NULL,
  sentenced_by    UUID NOT NULL REFERENCES users(id),
  report_id       UUID REFERENCES reports(id),
  entered_at      TIMESTAMPTZ DEFAULT NOW(),
  released_at     TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jail_active ON jail (user_id) WHERE released_at IS NULL;

CREATE TABLE IF NOT EXISTS jail_appeals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  reason          TEXT NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending', -- pending, approved, denied
  reviewed_by     UUID REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ,
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jail_appeals_user ON jail_appeals (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ip_bans (
  ip_address      INET PRIMARY KEY,
  admin_id        UUID NOT NULL REFERENCES users(id),
  reason          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
