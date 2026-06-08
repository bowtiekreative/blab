# Squad Battles — Hustle Zone

> **Squad Battles** are head-to-head live competitions between two squads. Viewers tip ⏣ tokens to support their chosen squad. The winning squad splits the pot. Inspired by TikTok Live Battles.

---

## How Squad Battles Work

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SQUAD BATTLE: LIVE                            │
│                                                                     │
│  ┌────────────────────────┐      ┌────────────────────────┐        │
│  │    SQUAD A: THE BEATS  │      │   SQUAD B: CREATIVE    │        │
│  │                        │      │      ARMY              │        │
│  │  🔴 @djkeen           │      │  🔴 @beatmaker         │        │
│  │  ⏣ 12,450 raised      │  VS  │  ⏣ 8,230 raised       │        │
│  │  🏆 WINNING           │      │                        │        │
│  │                        │      │                        │        │
│  │  Top tippers:          │      │  Top tippers:          │        │
│  │  @fan1 — 2,000 ⏣     │      │  @fan3 — 1,500 ⏣     │        │
│  │  @fan2 — 1,500 ⏣     │      │  @fan4 — 800 ⏣       │        │
│  └────────────────────────┘      └────────────────────────┘        │
│                                                                     │
│  ⏱ Time remaining: 3:24                                            │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  💎 TIP TO SUPPORT                                     [SEND]  ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Battle Flow

| Step | What Happens |
|------|-------------|
| **1. Challenge** | Squad Super Admin challenges another squad to a battle |
| **2. Accept** | The challenged squad has 5 minutes to accept or decline |
| **3. Setup** | Both squads designate a **champion** (1 person representing the squad on screen) |
| **4. Go Live** | A special **Battle Room** opens — both champions on the carousel |
| **5. Battle** | Runs for **5 minutes** (configurable: 3-10 min) |
| **6. Tipping** | Viewers tip ⏣ tokens. Tips go to the **squad they're supporting** |
| **7. Winner** | The squad with the most ⏣ raised at the end **wins** |
| **8. Payout** | Winner takes **70%** of the total pot. Loser gets **30%** |
| **9. Recognition** | Winner gets a trophy badge, loser gets a participation badge |

---

## Battle Rules

| Rule | Detail |
|------|--------|
| **Min squads** | Both squads must have 10+ members |
| **Cost to challenge** | **100 ⏣** (paid by challenger — prevents spam) |
| **Cost to accept** | **50 ⏣** (paid by the challenged squad) |
| **Duration** | Default 5 minutes (3-10 min configurable) |
| **Max per day** | 3 battles per squad (prevents battle fatigue) |
| **Platform fee** | 15% of total pot (on top of the 70/30 split) |
| **Champion** | Each squad picks 1 member to represent them on screen |
| **Viewer limit** | Unlimited viewers can tip |
| **Squad members** | Squad members' tips are **doubled** (1 ⏣ = 2 ⏣ for their own squad) |
| **Cooldown** | 30 minutes between battles for the same two squads |

---

## Battle Pot Split

```
Total Pot: 20,000 ⏣
         │
    ┌────┴────┐
    ▼         ▼
Platform    Net Pot: 17,000 ⏣
  15%
(3,000 ⏣)    │
         ┌────┴────┐
         ▼         ▼
     Winner      Loser
       70%         30%
   (11,900 ⏣)  (5,100 ⏣)
         │
    ┌────┴────┐
    ▼         ▼
  Squad      Top 3
  Treasury   Tippers
    60%       40%
           (split among top 3)
```

### Split Details

| Recipient | Share of Winning Pot | Example (20K pot) |
|-----------|---------------------|-------------------|
| **Squad Treasury** (winner) | 60% of winner's share | 7,140 ⏣ |
| **Top 3 Tippers** (winner) | 40% of winner's share split by contribution | 4,760 ⏣ |
| **Squad Treasury** (loser) | 60% of loser's share | 3,060 ⏣ |
| **Top 3 Tippers** (loser) | 40% of loser's share | 2,040 ⏣ |
| **Platform** | 15% of total pot | 3,000 ⏣ |

### Squad Treasury

Each squad gets a **treasury** — a shared pot of ⏣ tokens that the Super Admin can:
- Use to sponsor future battles
- Distribute to members as rewards
- Pool for squad events

---

## Battle Streaks & Rankings

| Streak | Bonus |
|--------|-------|
| 3 wins in a row | 2x XP for squad members for 24 hours |
| 5 wins in a row | Squad gets a custom emote, 1 free battle challenge |
| 10 wins in a row | "Undefeated" squad badge + 500 ⏣ bonus to treasury |

### Leaderboards

```
GET /v1/battles/leaderboard                 # Top squads by total wins
GET /v1/battles/leaderboard/monthly         # This month's ranking
GET /v1/battles/leaderboard/all-time        # All-time champions
GET /v1/squads/:id/battle-stats             # Squad battle record
```

---

## Gift Reward System (Post-Battle)

> After a battle, the **Top 3 Tippers** on the winning squad get a special **Gift Reward** — not an NFT, just real platform value.

| Rank | Gift Reward |
|------|-------------|
| 🥇 **Top Tipper** | Custom emote usable anywhere on platform + shoutout in squad chat |
| 🥈 **2nd Place** | 24-hour "Battle Champion" badge on profile + 50 ⏣ bonus |
| 🥉 **3rd Place** | "Battle Supporter" badge + 25 ⏣ bonus |

All tippers (any amount) get a participation badge: "🛡️ Battle Contributor"

---

## Squad Treasury API

```
GET    /v1/squads/:id/treasury              # Treasury balance
POST   /v1/squads/:id/treasury/distribute   # Distribute to members (Super Admin only)
GET    /v1/squads/:id/treasury/transactions # Treasury history
```

## Battle API

```
POST   /v1/battles/challenge                # Challenge another squad (100 ⏣)
POST   /v1/battles/:id/accept               # Accept challenge (50 ⏣)
POST   /v1/battles/:id/decline              # Decline challenge
POST   /v1/battles/:id/start                # Start battle (host opens room)
GET    /v1/battles/active                   # Active battles right now
GET    /v1/battles/scheduled                # Upcoming battles
POST   /v1/battles/:id/tip                  # Tip ⏣ to support a squad
GET    /v1/battles/:id/status               # Live battle stats
GET    /v1/battles/:id/results              # Battle results after end
GET    /v1/battles/history                  # My battle history
```

## Gift Rewards API

```
GET    /v1/battles/rewards                  # My gift rewards
GET    /v1/battles/:id/rewards              # Rewards for a specific battle
```

## Database Tables

### squad_battles

```sql
CREATE TABLE squad_battles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id   UUID NOT NULL REFERENCES squads(id),
  defender_id     UUID NOT NULL REFERENCES squads(id),
  champion_a_id   UUID REFERENCES users(id),
  champion_b_id   UUID REFERENCES users(id),
  room_id         UUID REFERENCES rooms(id),
  status          VARCHAR(20) DEFAULT 'pending',
    -- statuses: pending, accepted, declined, active, completed, cancelled
  duration_seconds INTEGER DEFAULT 300,
  challenger_tips INTEGER DEFAULT 0,  -- ⏣ raised by challenger
  defender_tips   INTEGER DEFAULT 0,  -- ⏣ raised by defender
  total_pot       INTEGER DEFAULT 0,
  platform_fee    INTEGER DEFAULT 0,
  winner_id       UUID REFERENCES squads(id),
  challenger_cost_paid BOOLEAN DEFAULT false,
  defender_cost_paid   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  UNIQUE(challenger_id, defender_id, status)
);

CREATE INDEX idx_battles_active ON squad_battles (status) WHERE status = 'active';
CREATE INDEX idx_battles_squad ON squad_battles (challenger_id);
```

### battle_tips

```sql
CREATE TABLE battle_tips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id       UUID NOT NULL REFERENCES squad_battles(id),
  tipper_id       UUID NOT NULL REFERENCES users(id),
  squad_id        UUID NOT NULL REFERENCES squads(id),  -- which squad they tipped for
  amount          INTEGER NOT NULL,                      -- ⏣ tokens
  is_doubled      BOOLEAN DEFAULT false,                 -- true if tipper is squad member
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_battle_tips ON battle_tips (battle_id, squad_id);
```

### battle_rewards

```sql
CREATE TABLE battle_rewards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id       UUID NOT NULL REFERENCES squad_battles(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  rank            INTEGER,  -- 1, 2, 3 or null for participation
  reward_type     VARCHAR(30) NOT NULL,
    -- types: custom_emote, champion_badge, supporter_badge, contributor_badge, token_bonus, squad_shoutout
  reward_meta     JSONB,     -- emote URL, badge ID, token amount, etc.
  claimed         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### squad_treasury

```sql
CREATE TABLE squad_treasuries (
  squad_id        UUID PRIMARY KEY REFERENCES squads(id),
  balance         INTEGER DEFAULT 0,
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_spent  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### squad_treasury_transactions

```sql
CREATE TABLE squad_treasury_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id        UUID NOT NULL REFERENCES squads(id),
  amount          INTEGER NOT NULL,
  type            VARCHAR(30) NOT NULL,
    -- types: battle_win, battle_loss, distribution, challenge_fee, accept_fee
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_treasury_squad ON squad_treasury_transactions (squad_id, created_at DESC);
```

---

## Redis Usage (Battles)

| Key Pattern | Type | Purpose | TTL |
|-------------|------|---------|-----|
| `battle:{id}:tips:{squadId}` | Counter | Live tip total during battle | Battle duration |
| `battle:{id}:top_tippers:{squadId}` | Sorted Set | Top tippers by amount | Battle duration |
| `battle:{id}:timer` | String | Countdown (seconds remaining) | Battle duration |
| `battles:active` | Set | Currently active battle IDs | Updated every 10s |
| `squad:{id}:streak` | Counter | Current win streak | Persistent |
