# Monetization — Hustle Zone

## Economy Model

Hustle Zone uses a **dual-currency economy**:
- **⏣ Tokens** (in-app currency) — buy, earn, spend, cash out
- **$ USD** (Stripe) — direct deposits, payouts, subscriptions

```
User deposits $ → Token balance (100 ⏣ = $1.00)
                         │
        ┌────────────────┼─────────────────────────┐
        ▼                ▼                         ▼
   Send Claps        Send Gifts              Sub to Creator
   (1 ⏣ = 1 clap)   (various values)        (tiered monthly)
        │                │                         │
        ▼                ▼                         ▼
   Recipient gets    Recipient gets           Creator receives
   ⏣ tokens         ⏣ tokens (after         70% monthly
   (1 ⏣ per clap)   15% platform fee)
        │                │
        ▼                ▼
   Can cash out ⏣ → $USD (15% platform fee on conversion)
```

---

## Token Economy (⏣)

**See full spec:** [Token Economy System](./tokens.md)

| Property | Value |
|----------|-------|
| **Exchange rate** | 100 ⏣ = $1.00 USD |
| **Purchase** | $1 = 100 ⏣ |
| **Cash out min** | 1,000 ⏣ ($10 worth) |
| **Platform fee on cash out** | 15% |
| **Max cash out/month** | $500 |

### Earning Tokens

| Action | Tokens Earned |
|--------|--------------|
| Receive a clap | 1 ⏣ |
| Receive a gift | 10% of value in ⏣ |
| Host a room (per hour) | 10 ⏣ |
| Participate in carousel (per 30 min) | 5 ⏣ |
| Hit trending (per hour) | 25 ⏣ |
| Top clap-getter in a room | 15 ⏣ |
| Refer a friend | 50 ⏣ |

### Spending Tokens

| Action | Cost |
|--------|------|
| Free clap | Free (20/room/user cap) |
| Token clap (unlimited) | 1 ⏣ = 1 clap |
| Gift: Fire 🔥 | 50 ⏣ ($0.50) |
| Gift: Heart ❤️ | 100 ⏣ ($1.00) |
| Gift: Crown 👑 | 500 ⏣ ($5.00) |
| Gift: Rocket 🚀 | 1,000 ⏣ ($10.00) |
| Gift: Diamond 💎 | 2,500 ⏣ ($25.00) |
| Gift: Hustle Zone 🏆 | 5,000 ⏣ ($50.00) |
| Gift: Spotlight ⭐ | 10,000 ⏣ ($100.00) |
| Subscribe: Basic | 499 ⏣/mo ($4.99) |
| Subscribe: Premium | 999 ⏣/mo ($9.99) |
| Subscribe: Ultra | 2,499 ⏣/mo ($24.99) |
| Private Room (5 min) | 99 ⏣ ($0.99) |
| Extend Private Room (+5 min) | 50 ⏣ ($0.50) |
| **Promo Room (coach/webinar)** | **999 ⏣ per session ($9.99)** |
| **Prevent Lurkers** | **199 ⏣ per session ($1.99)** |
| **Ban Screenshots** | **149 ⏣ per session ($1.49)** |

---

## Gift Catalog

| Gift | Icon | Cost | Animation |
|------|------|------|-----------|
| Fire | 🔥 | 50 ⏣ ($0.50) | Small flame on screen |
| Heart | ❤️ | 100 ⏣ ($1.00) | Floating hearts |
| Crown | 👑 | 500 ⏣ ($5.00) | Crown appears over slot |
| Rocket | 🚀 | 1,000 ⏣ ($10.00) | Rocket animation across screen |
| Diamond | 💎 | 2,500 ⏣ ($25.00) | Full screen diamond burst |
| Hustle Zone | 🏆 | 5,000 ⏣ ($50.00) | Custom trophy animation + sound |
| Spotlight | ⭐ | 10,000 ⏣ ($100.00) | Pin their slot fullscreen for 5s |

---

## Subscription Tiers

| Tier | Price | Perks |
|------|-------|-------|
| **Basic** | 499 ⏣/mo ($4.99) | Sub badge, ad-free, exclusive emoji |
| **Premium** | 999 ⏣/mo ($9.99) | Basic perks + priority slot queue + sub-only chat |
| **Ultra** | 2,499 ⏣/mo ($24.99) | Premium perks + custom badge + host shoutout |

### Revenue Split (Subscriptions)

| Role | Share |
|------|-------|
| **Creator** | 70% |
| **Platform** | 20% |
| **Creator Fund** | 5% (bonus pool for top creators weekly) |
| **Processing** | 5% (Stripe fees) |

---

## Paid Room Features

### Private Rooms (99 ⏣ / 5 min)
- Password-protected, time-limited (5 min)
- Prevents private rooms from dominating the community
- Extendable for 50 ⏣ per additional 5 min

### Promo Rooms (999 ⏣ / session)
- For coaches, webinars, teaching, selling
- Includes Q&A mode, screen share, raise hand, ratings
- Always recorded for compliance
- Max 2 hours per session, 500 attendees max

### Lurker Prevention (199 ⏣ / session)
- Host can enable: only visible viewers allowed
- Lurkers (hidden mode) cannot enter the room
- Affects current room session only

### Screenshot Ban (149 ⏣ / session)
- Prevents screenshotting within the room
- Technical: overlay + browser-level protection
- Affects current room session only

---

## Payouts

Users can withdraw earnings to their bank account via Stripe Connect:

| Dimension | Detail |
|-----------|--------|
| **Minimum payout** | 1,000 ⏣ ($10.00) |
| **Platform fee** | 15% on token-to-cash conversion |
| **Payout schedule** | Weekly automatic, or manual request |
| **Processing time** | 3-5 business days |
| **Max per month** | $500 |
| **Tax info** | Stripe collects W-9/W-8BEN |

---

## Stripe Integration

```sql
-- Each user gets a Stripe Connect account
users.stripe_account_id = "acct_xxx"

-- Token purchases use Stripe PaymentIntent
-- Token cash-outs use Stripe Transfer
-- Subscriptions use Stripe Subscriptions API
-- Platform fee via application_fee_amount
```

---

## Reputation & Badges XP

Users earn XP for platform engagement:

| Action | XP |
|--------|----|
| Host a room | +10 |
| Participate (slot) | +5 |
| Send a gift | +2 per ⏣1 |
| Receive a gift | +1 per ⏣1 |
| Receive a clap | +1 |
| Follow someone | +1 |
| Get a follower | +3 |
| Get a subscriber | +50 |

### Badge Catalog

| Badge | Requirement |
|-------|-------------|
| 🎤 Early Adopter | Joined in first 3 months |
| 🔥 Trending | Room hit trending |
| 💎 Gifter | Sent $100+ in gifts |
| 👑 Top Host | Hosted 50+ rooms |
| ⭐ Superstar | Reached 1,000 followers |
| 🏆 Champion | Won Creator of the Month |
| 🤝 Community Builder | Built 5+ rooms with 10+ attendees |
| ⏣ Token King | Earned 10,000+ ⏣ tokens |
| 🏷️ Squad Leader | Lead a squad with 50+ members |
