# Database Schema — Hustle Zone

## Technology
- **PostgreSQL** — Primary database (relational state)
- **Redis** — Caching, rate limiting, presence, live viewer counts

## Entity Relationship Diagram (Text)

```
users ──1:N── rooms (as host)
users ──N:N── rooms (as participant via room_participants)
users ──N:N── rooms (as viewer via room_viewers)
users ──N:N── users (follows)
users ──N:N── users (blocks)
rooms ──1:N── messages
rooms ──1:N── recordings
rooms ──1:N── gifts
users ──1:N── messages
users ──1:N── notifications
users ──1:N── wallets
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

  -- Stats
  follower_count  INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  total_claps     INTEGER DEFAULT 0,
  total_gifts_received INTEGER DEFAULT 0,

  -- Status
  is_banned       BOOLEAN DEFAULT false,
  ban_reason      TEXT,
  banned_at       TIMESTAMPTZ,
  is_globally_blocked BOOLEAN DEFAULT false,

  -- Meta
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users USING gin (username gin_trgm_ops);
CREATE INDEX idx_users_is_banned ON users (is_banned);
```

### rooms

```sql
CREATE TABLE rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id         UUID NOT NULL REFERENCES users(id),
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  category        VARCHAR(50),
  hashtags        TEXT[],  -- postgres array

  -- State
  is_live         BOOLEAN DEFAULT false,
  is_recorded     BOOLEAN DEFAULT false,
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

  -- LiveKit
  livekit_room    VARCHAR(100),

  -- Meta
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ
);

CREATE INDEX idx_rooms_host ON rooms (host_id);
CREATE INDEX idx_rooms_live ON rooms (is_live) WHERE is_live = true;
CREATE INDEX idx_rooms_hashtags ON rooms USING gin (hashtags);
CREATE INDEX idx_rooms_category ON rooms (category);
CREATE INDEX idx_rooms_name ON rooms USING gin (name gin_trgm_ops);
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
  duration_seconds INTEGER  -- calculated on leave
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

### messages

```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  type            VARCHAR(10) NOT NULL DEFAULT 'text',
    -- types: text, gif, gift, system
  content         TEXT,
  gif_url         TEXT,
  mentions        UUID[],     -- array of user IDs
  hashtags        TEXT[],

  -- Gift metadata (when type = 'gift')
  gift_type       VARCHAR(30),
  gift_value      INTEGER,
  gift_recipient_id UUID REFERENCES users(id),

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_room ON messages (room_id, created_at DESC);
CREATE INDEX idx_messages_mentions ON messages USING gin (mentions);
```

### notifications

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  type            VARCHAR(30) NOT NULL,
    -- types: mention, room_invite, gift_received, follower, clap

  title           VARCHAR(200),
  body            TEXT,
  data            JSONB,  -- { roomId, messageId, userId, etc. }
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (user_id, is_read) WHERE is_read = false;
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
  to_wallet_id    UUID REFERENCES wallets(id),  -- null for deposits
  amount          INTEGER NOT NULL,  -- in cents
  type            VARCHAR(20) NOT NULL,
    -- types: deposit, gift, withdrawal, refund
  stripe_payment_id VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW()
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
    -- statuses: processing, ready, failed
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
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

### push_subscriptions

```sql
CREATE TABLE push_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  endpoint        TEXT NOT NULL,
  p256dh_key      TEXT NOT NULL,
  auth_key        TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

## Redis Usage

| Key Pattern | Type | Purpose | TTL |
|-------------|------|---------|-----|
| `room:{id}:viewer_count` | Counter | Live viewer count | Room lifetime |
| `room:{id}:lurker_count` | Counter | Hidden viewer count | Room lifetime |
| `room:{id}:presence` | Set | User IDs currently in room | Room lifetime |
| `user:{id}:online` | Boolean | Is user online? | 5 min (heartbeat) |
| `rate_limit:{user}:{action}` | Counter | Rate limiting | Window |
| `trending:rooms` | Sorted Set | Trending rooms by activity | 1 hour |
