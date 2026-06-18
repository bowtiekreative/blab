# Token Economy — Hustle Zone

> Tokens are the platform's **in-app currency**. Users earn them through engagement and can **exchange them for real cash**. This makes the platform addictive — everyone is building value while having fun.

---

## Token Model

| Property | Value |
|----------|-------|
| **Name** | HZ Tokens (⏣) |
| **Exchange rate** | 100 tokens = $1.00 USD |
| **Purchase** | Users buy tokens with real money ($1 = 100 tokens) |
| **Earn** | Users earn tokens through engagement (claps, gifts, hosting) |
| **Cash out** | Users can exchange tokens for cash (minimum: 1,000 tokens = $10) |
| **Platform cut** | 15% on token-to-cash conversion |

---

## How Tokens Flow

```
                    ┌──────────────────────┐
                    │   User Deposits $     │
                    │   ($1 = 100 tokens)   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Token Wallet        │
                    │   ⏣ Balance          │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                 ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  Send as      │ │  Tip a Host  │ │  Cash Out    │
     │  Gift/Clap    │ │              │ │  (to bank)   │
     └──────────────┘ └──────────────┘ └──────────────┘
              │                │                 │
              ▼                ▼                 ▼
     Recipient gets     Recipient gets     Platform takes
     ⏣ tokens (after   ⏣ tokens (after    15% fee
     15% platform fee) 15% platform fee)  User gets 85%
```

---

## Earning Tokens

| Action | Tokens Earned |
|--------|--------------|
| Receive a clap | 1 ⏣ |
| Receive a gift | 10% of gift value in ⏣ |
| Host a room (per hour) | 10 ⏣ |
| Participate in carousel (per 30 min) | 5 ⏣ |
| Hit trending (per hour) | 25 ⏣ |
| Top clap-getter in a room | 15 ⏣ |
| 1,000 total claps badge | 100 ⏣ (one-time) |
| Refer a friend | 50 ⏣ |
| Win a squad battle | 2x squad boost + share of pot |

---

## Gift Rewards System

Gift rewards are **earned through Squad Battles** — the top tippers get exclusive rewards. No NFTs, just real platform value.

### Battle Reward Tiers

| Rank | Reward | Value |
|------|--------|-------|
| 🥇 **Top Tipper** (Winning Squad) | Custom emote (usable platform-wide) + squad chat shoutout | **500 ⏣** equivalent |
| 🥈 **2nd Place** (Winning Squad) | 24h "Battle Champion" profile badge + 50 ⏣ bonus | **50 ⏣** |
| 🥉 **3rd Place** (Winning Squad) | "Battle Supporter" badge + 25 ⏣ bonus | **25 ⏣** |
| 🛡️ **Any Tipper** (All) | "Battle Contributor" badge | Recognition only |

### Gift Reward API

```
GET    /v1/battles/rewards                  # My gift rewards
GET    /v1/battles/:id/rewards              # Rewards for a specific battle
POST   /v1/rewards/:id/claim                # Claim a reward
GET    /v1/rewards/catalog                  # All available gift rewards
```

### Custom Emote System

Top tippers get a **custom emote** — a small image they can use in any room chat:

- Upload: 64×64 PNG, animated GIF supported
- Usage: Any room, any squad, any time
- Duration: Permanent (but can be replaced if they earn a new one)
- Rarity: Only 1 per battle winner → emotes are scarce and valuable

---

## Spending Tokens

| Action | Cost |
|--------|------|
| Send clap | Free (but limited per room) |
| Send small gift (🔥) | 50 ⏣ ($0.50) |
| Send medium gift (❤️👑) | 100-500 ⏣ ($1-$5) |
| Send large gift (🚀💎) | 1,000-2,500 ⏣ ($10-$25) |
| Send mega gift (🏆⭐) | 5,000-10,000 ⏣ ($50-$100) |
| Subscribe to creator (basic) | 499 ⏣/mo ($4.99) |
| Subscribe to creator (premium) | 999 ⏣/mo ($9.99) |
| Subscribe to creator (ultra) | 2,499 ⏣/mo ($24.99) |
| Create private room (5 min) | 99 ⏣ ($0.99) |
| Extend private room (+5 min) | 50 ⏣ ($0.50) |
| Open promo room (coach/webinar) | 999 ⏣ per session ($9.99) |
| Prevent lurkers (per room session) | 199 ⏣ ($1.99) |
| Ban screenshots (per room session) | 149 ⏣ ($1.49) |
| Anonymous room (per session) | 49 ⏣ ($0.49) |
| Squad battle challenge | 100 ⏣ |
| Squad battle accept | 50 ⏣ |

---

## Ongoing Clap System

The clap system is **continuous and cumulative**:

- Users can clap for **specific participants** on the carousel
- Claps are **ongoing** — you can keep clapping while someone is talking
- A user who receives a surge of claps gets a **notification**: "🔥 Your claps are blowing up!"
- The participant with the most claps in the room appears as "🔥 Top Clapped"
- Total claps contribute to **token earnings** (1 ⏣ per clap received)

### Clap Mechanics

```
Room with 4 participants:

┌──────────────────────────────────────────────────────┐
│    [P1] @djkeen         [P2] @vocalqueen             │
│     ⏣ 1,234 claps       ⏣ 892 claps                  │
│     🔥 TOP CLAPPED                                   │
│                                                       │
│    [P3] @beatmaker      [P4] @lyricist               │
│     ⏣ 567 claps         ⏣ 3,210 claps                │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │  👏 Clap for @lyricist   ────  [100 claps]   │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

- Users can clap **multiple times** for the same person (continuous)
- Free claps are limited: 20 per room per user
- Token claps are unlimited: 1 ⏣ = 1 clap
- When claps spike: visual effect on the carousel slot

---

## Cash Out

| Requirement | Detail |
|-------------|--------|
| Minimum balance | 1,000 ⏣ ($10 worth) |
| Platform fee | 15% on cash out |
| Max per month | $500 (prevents abuse) |
| Payout method | Stripe Connect → bank account |
| Processing | 3-5 business days |
| Frequency | Weekly automatic or manual |
| Tax info | Stripe collects W-9/W-8BEN |

---

## API Endpoints

### Token Operations

```
GET    /v1/tokens/balance                # Token balance
GET    /v1/tokens/transactions           # Token transaction history
GET    /v1/tokens/earnings-history       # How you earned tokens (breakdown)
POST   /v1/tokens/purchase               # Buy tokens (Stripe)
POST   /v1/tokens/convert-to-cash        # Cash out tokens
GET    /v1/tokens/exchange-rate          # Current exchange rate
```

### Clap System

```
POST   /v1/rooms/:id/clap                # Clap for a participant (free)
POST   /v1/rooms/:id/clap-tokens         # Clap using tokens
GET    /v1/rooms/:id/clap-leaderboard    # Top clapped in room
GET    /v1/rooms/:id/claps/:userId       # User's claps in this room
```

---

## Anti-Abuse

| Abuse | Countermeasure |
|-------|---------------|
| Clap farming (bots) | Free claps limited per room; token claps cost real money |
| Self-clapping (alt accounts) | IP/device fingerprint → flagged |
| Token inflation | Fixed exchange rate, 15% burn on cash out |
| Bulk account signups | Phone + photo verification |
| Wash trading (send tokens to self) | Transaction graph analysis |
