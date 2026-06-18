-- Phase 7: growth & ops (api/README.md notifications, api/media.md, api/admin-dashboard.md)

-- ===========================================================================
-- Follows (social graph; powers follower notifications + discovery)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS follows (
  follower_id     UUID NOT NULL REFERENCES users(id),
  followee_id     UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> followee_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows (followee_id);

-- ===========================================================================
-- Notifications
-- ===========================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  type            VARCHAR(40) NOT NULL,
  title           VARCHAR(200),
  body            TEXT,
  data            JSONB,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id) WHERE is_read = false;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  platform        VARCHAR(10) NOT NULL DEFAULT 'web',  -- web, ios, android
  endpoint        TEXT NOT NULL,
  p256dh_key      TEXT,
  auth_key        TEXT,
  fcm_token       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, platform, endpoint)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id             UUID PRIMARY KEY REFERENCES users(id),
  mention_push        BOOLEAN DEFAULT true,
  gift_push           BOOLEAN DEFAULT true,
  follower_push       BOOLEAN DEFAULT true,
  room_invite_push    BOOLEAN DEFAULT true,
  scheduled_room_push BOOLEAN DEFAULT true,
  squad_go_live_email BOOLEAN DEFAULT true,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================================================
-- Recordings & clips (media metadata; files produced by Egress/FFmpeg in prod)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS recordings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  started_by      UUID NOT NULL REFERENCES users(id),
  egress_id       VARCHAR(255),
  s3_key          TEXT,
  duration_seconds INTEGER,
  thumbnail_keys  TEXT[],
  status          VARCHAR(20) DEFAULT 'recording',  -- recording, processing, ready, simulated, failed
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_recordings_room ON recordings (room_id, started_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_recordings_active ON recordings (room_id) WHERE status = 'recording';

CREATE TABLE IF NOT EXISTS clips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  recording_id    UUID REFERENCES recordings(id),
  title           VARCHAR(200),
  kind            VARCHAR(10) NOT NULL DEFAULT 'clip',  -- clip, gif, teaser
  s3_key          TEXT,
  thumbnail_key   TEXT,
  start_time_ms   INTEGER,
  end_time_ms     INTEGER,
  duration_ms     INTEGER,
  status          VARCHAR(20) DEFAULT 'processing',     -- processing, ready, simulated, failed
  view_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clips_room ON clips (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clips_trending ON clips (view_count DESC, created_at DESC);
