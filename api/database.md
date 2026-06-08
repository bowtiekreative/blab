# Database Schema — Hustle Zone

## Technology
- **PostgreSQL** — Primary database (relational state)
- **Redis** — Caching, rate limiting, presence, live viewer counts

## Entity Relationship Diagram (Text)

```
users ──1:N── rooms (as host)
users ──N:N── rooms (as participant via room_participants)
users ──N:N── rooms (as viewer via room_viewers)
users ──1:N── rooms (as moderator via room_moderators)
users ──1:N── rooms (as co-host via room_co_hosts)
users ──N:N── users (follows)
users ──N:N── users (blocks)
rooms ──1:N── messages
rooms ──1:N── recordings
rooms ──1:N── clips
rooms ──1:N── gifs
rooms ──1:N── gifts
rooms ──1:N── polls
rooms ──1:N── slot_queue
users ──1:N── messages
users ──1:N── notifications
users ──1:N── wallets
users ──1:N── subscriptions
users ──1:N── badges
users ──1:N── strikes
users ──1:N── muted_words
```

## Tables

### users

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        VARCHAR(30) UNIQUE NOT NULL,
  display_name    VARCHAR(60),
  bio             TEXT,
  avatar_url      TEXT,
  email           VARCHAR(255) UNIQUE,
  password_hash   VARCHAR(255),  -- null if OAuth-only
  stripe_account_id VARCHAR(255), -- Stripe Connect for payouts

  -- OAuth links
  google_id       VARCHAR(255) UNIQUE,
  facebook_id     VARCHAR(255) UNIQUE,
  x_id            VARCHAR(255) UNIQUE,

  -- Reputation
  follower_count  INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  total_claps     INTEGER DEFAULT 0,
  total_gifts_received INTEGER DEFAULT 0,
  xp              INTEGER DEFAULT 0,
  level           INTEGER DEFAULT 1,

  -- Security
  is_banned       BOOLEAN DEFAULT false,
  ban_reason      TEXT,
  banned_at       TIMESTAMPTZ,
  is_globally_blocked BOOLEAN DEFAULT false,
  strikes         INTEGER DEFAULT 0,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),

  -- Meta
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,  -- soft delete (GDPR)
  last_seen_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users USING gin (username gin_trgm_ops);
CREATE INDEX idx_users_is_banned ON users (is_banned);
CREATE INDEX idx_users_level ON users (level DESC);
```

### rooms

```sql
CREATE TABLE rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id         UUID NOT NULL REFERENCES users(id),
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  cover_image_url TEXT,
  category        VARCHAR(50),
  category_icon   TEXT,
  hashtags        TEXT[],

  -- State
  is_live         BOOLEAN DEFAULT false,
  is_private      BOOLEAN DEFAULT false,
  password_hash   VARCHAR(255),
  private_room_expires_at TIMESTAMPTZ,  -- null if public
  private_room_paid BOOLEAN DEFAULT false,  -- was payment collected?
  is_recorded     BOOLEAN DEFAULT false,
  is_scheduled    BOOLEAN DEFAULT false,
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at   TIMESTAMPTZ,
  invite_code     VARCHAR(20) UNIQUE,
  is_banned       BOOLEAN DEFAULT false,
  ban_reason      TEXT,

  -- Slots (4-person carousel)
  slot_0_user_id  UUID REFERENCES users(id),
  slot_1_user_id  UUID REFERENCES users(id),
  slot_2_user_id  UUID REFERENCES users(id),
  slot_3_user_id  UUID REFERENCES users(id),
  slot_0_muted    BOOLEAN DEFAULT false,
  slot_1_muted    BOOLEAN DEFAULT false,
  slot_2_muted    BOOLEAN DEFAULT false,
  slot_3_muted    BOOLEAN DEFAULT false,
  slot_0_video_on BOOLEAN DEFAULT true,
  slot_1_video_on BOOLEAN DEFAULT true,
  slot_2_video_on BOOLEAN DEFAULT true,
  slot_3_video_on BOOLEAN DEFAULT true,

  -- Settings
  slow_mode       BOOLEAN DEFAULT false,
  slow_mode_delay INTEGER DEFAULT 5,
  gifts_enabled   BOOLEAN DEFAULT true,
  subs_only_mode  BOOLEAN DEFAULT false,

  -- LiveKit
  livekit_room    VARCHAR(100),

  -- Stats (denormalized)
  subscriber_count INTEGER DEFAULT 0,

  -- Meta
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ
);

CREATE INDEX idx_rooms_host ON rooms (host_id);
CREATE INDEX idx_rooms_live ON rooms (is_live) WHERE is_live = true;
CREATE INDEX idx_rooms_scheduled ON rooms (scheduled_start_at) WHERE is_scheduled = true;
CREATE INDEX idx_rooms_hashtags ON rooms USING gin (hashtags);
CREATE INDEX idx_rooms_category ON rooms (category);
CREATE INDEX idx_rooms_name ON rooms USING gin (name gin_trgm_ops);
CREATE INDEX idx_rooms_invite ON rooms (invite_code) WHERE invite_code IS NOT NULL;
```

### room_co_hosts

```sql
CREATE TABLE room_co_hosts (
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  promoted_by     UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);
```

### room_moderators

```sql
CREATE TABLE room_moderators (
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  added_by        UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);
```

### room_participants (slot history)

```sql
CREATE TABLE room_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  slot_index      INTEGER CHECK (slot_index >= 0 AND slot_index <= 3),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  left_at         TIMESTAMPTZ,
  duration_seconds INTEGER
);

CREATE INDEX idx_room_participants_room ON room_participants (room_id, left_at);
```

### room_viewers (visible viewers)

```sql
CREATE TABLE room_viewers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  entered_at      TIMESTAMPTZ DEFAULT NOW(),
  left_at         TIMESTAMPTZ
);

CREATE INDEX idx_room_viewers_active ON room_viewers (room_id) WHERE left_at IS NULL;
```

### slot_queue (waitlist for the 4 slots)

```sql
CREATE TABLE slot_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  preferred_slot  INTEGER CHECK (preferred_slot >= 0 AND preferred_slot <= 3),
  position        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_slot_queue_room ON slot_queue (room_id, position);
```

### messages

```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  type            VARCHAR(10) NOT NULL DEFAULT 'text',
    -- types: text, gif, gift, system, poll, clip, sub
  content         TEXT,
  gif_url         TEXT,
  mentions        UUID[],
  hashtags        TEXT[],

  -- Gift metadata
  gift_type       VARCHAR(30),
  gift_value      INTEGER,
  gift_recipient_id UUID REFERENCES users(id),

  -- Poll metadata
  poll_id         UUID REFERENCES polls(id),

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_room ON messages (room_id, created_at DESC);
CREATE INDEX idx_messages_mentions ON messages USING gin (mentions);
```

### message_reactions (emoji reactions)

```sql
CREATE TABLE message_reactions (
  message_id      UUID NOT NULL REFERENCES messages(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  emoji           VARCHAR(10) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id, emoji)
);
```

### polls

```sql
CREATE TABLE polls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  created_by      UUID NOT NULL REFERENCES users(id),
  question        VARCHAR(280) NOT NULL,
  options         TEXT[] NOT NULL,  -- ["Option A", "Option B", ...]
  is_closed       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  closed_at       TIMESTAMPTZ
);

CREATE TABLE poll_votes (
  poll_id         UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  option_index    INTEGER NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);
```

### notifications

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  type            VARCHAR(30) NOT NULL,
    -- types: mention, room_invite, gift_received, follower, clap,
    --        room_trending, sub_gifted, scheduled_room, poll_created
  title           VARCHAR(200),
  body            TEXT,
  data            JSONB,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (user_id, is_read) WHERE is_read = false;
```

### push_subscriptions

```sql
CREATE TABLE push_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  platform        VARCHAR(10) NOT NULL DEFAULT 'web',  -- web, ios, android
  endpoint        TEXT NOT NULL,
  p256dh_key      TEXT,
  auth_key        TEXT,
  fcm_token       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, endpoint)
);
```

### notification_preferences

```sql
CREATE TABLE notification_preferences (
  user_id         UUID PRIMARY KEY REFERENCES users(id),
  mention_push    BOOLEAN DEFAULT true,
  mention_email   BOOLEAN DEFAULT false,
  gift_push       BOOLEAN DEFAULT true,
  follower_push   BOOLEAN DEFAULT true,
  room_invite_push BOOLEAN DEFAULT true,
  scheduled_room_push BOOLEAN DEFAULT true,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### rooms_bans (room-level)

```sql
CREATE TABLE room_bans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  banned_by       UUID NOT NULL REFERENCES users(id),
  reason          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);
```

### strikes (admin)

```sql
CREATE TABLE strikes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  issued_by       UUID NOT NULL REFERENCES users(id),
  reason          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strikes_user ON strikes (user_id, created_at DESC);
```

### global_bans (admin-level)

```sql
CREATE TABLE global_bans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES users(id),
  admin_id        UUID NOT NULL REFERENCES users(id),
  reason          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### ip_bans

```sql
CREATE TABLE ip_bans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address      INET UNIQUE NOT NULL,
  admin_id        UUID NOT NULL REFERENCES users(id),
  reason          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### muted_words (room-level)

```sql
CREATE TABLE room_muted_words (
  room_id         UUID NOT NULL REFERENCES rooms(id),
  word            VARCHAR(100) NOT NULL,
  added_by        UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, word)
);
```

### user_muted_words (user-level)

```sql
CREATE TABLE user_muted_words (
  user_id         UUID NOT NULL REFERENCES users(id),
  word            VARCHAR(100) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, word)
);
```

### wallets

```sql
CREATE TABLE wallets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id),
  balance         INTEGER DEFAULT 0,  -- in cents
  lifetime_earnings INTEGER DEFAULT 0,
  lifetime_spent  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### transactions

```sql
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_wallet_id  UUID REFERENCES wallets(id),
  to_wallet_id    UUID REFERENCES wallets(id),
  amount          INTEGER NOT NULL,
  type            VARCHAR(20) NOT NULL,
    -- types: deposit, gift, withdrawal, refund, subscription, subscription_payout
  stripe_payment_id VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### subscriptions (recurring)

```sql
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id   UUID NOT NULL REFERENCES users(id),
  creator_id      UUID NOT NULL REFERENCES users(id),
  tier            VARCHAR(20) NOT NULL DEFAULT 'basic',
    -- tiers: basic ($4.99), premium ($9.99), ultra ($24.99)
  stripe_subscription_id VARCHAR(255),
  amount_cents    INTEGER NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscriber_id, creator_id)
);

CREATE INDEX idx_subscriptions_creator ON subscriptions (creator_id) WHERE is_active = true;
CREATE INDEX idx_subscriptions_subscriber ON subscriptions (subscriber_id) WHERE is_active = true;
```

### badges

```sql
CREATE TABLE badges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(50) UNIQUE NOT NULL,
  description     TEXT,
  icon_url        TEXT,
  criteria        VARCHAR(100),  -- e.g. "earn 1000 claps", "host 50 rooms"
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_badges (
  user_id         UUID NOT NULL REFERENCES users(id),
  badge_id        UUID NOT NULL REFERENCES badges(id),
  earned_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);
```

### recordings

```sql
CREATE TABLE recordings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  started_by      UUID NOT NULL REFERENCES users(id),
  s3_key          TEXT,
  duration_seconds INTEGER,
  file_size_bytes INTEGER,
  thumbnail_keys  TEXT[],
  status          VARCHAR(20) DEFAULT 'processing',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### clips

```sql
CREATE TABLE clips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  recording_id    UUID REFERENCES recordings(id),
  title           VARCHAR(200),
  s3_key          TEXT,
  thumbnail_key   TEXT,
  start_time_ms   INTEGER,
  end_time_ms     INTEGER,
  duration_ms     INTEGER,
  view_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clips_room ON clips (room_id, created_at DESC);
CREATE INDEX idx_clips_trending ON clips (view_count DESC, created_at DESC);
```

### gifs

```sql
CREATE TABLE gifs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  recording_id    UUID REFERENCES recordings(id),
  s3_key          TEXT,
  start_time_ms   INTEGER,
  end_time_ms     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### user_blocks (global user-to-user)

```sql
CREATE TABLE user_blocks (
  blocker_id      UUID NOT NULL REFERENCES users(id),
  blocked_id      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);
```

### reports

```sql
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID NOT NULL REFERENCES users(id),
  target_type     VARCHAR(10) NOT NULL,  -- user, room, message
  target_id       UUID NOT NULL,
  reason          VARCHAR(50) NOT NULL,
    -- reasons: harassment, spam, nsfw, impersonation, hate_speech, other
  description     TEXT,
  is_resolved     BOOLEAN DEFAULT false,
  resolved_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

## Redis Usage

| Key Pattern | Type | Purpose | TTL |
|-------------|------|---------|-----|
| `room:{id}:viewer_count` | Counter | Live viewer count | Room lifetime |
| `room:{id}:lurker_count` | Counter | Hidden viewer count | Room lifetime |
| `room:{id}:presence` | Set | User IDs currently in room | Room lifetime |
| `room:{id}:typing` | Set | Users currently typing | 5 seconds |
| `user:{id}:online` | Boolean | Is user online? | 5 min (heartbeat) |
| `rate_limit:{user}:{action}` | Counter | Rate limiting | Window |
| `trending:rooms` | Sorted Set | Trending rooms by activity | 1 hour |
| `trending:clips` | Sorted Set | Trending clips | 1 day |
| `global:banned_ips` | Set | Banned IPs cache | 1 hour |
