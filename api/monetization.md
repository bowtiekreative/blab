# Monetization — Hustle Zone

## Economy Model

```
User deposits $ → Wallet balance (in cents)
                            │
          ┌─────────────────┼───────────────────────┐
          ▼                 ▼                       ▼
     Send Gifts        Tip Hosts              Sub to Creator
          │                 │                       │
          ▼                 ▼                       ▼
     Recipient      Recipient                 Creator receives
     Wallet (+)     Wallet (+)                70% monthly
          │                 │
          ▼                 ▼
     Hustle Zone takes 15% platform fee
```

## Gift Catalog

| Gift | Icon | Cost | Animation |
|------|------|------|-----------|
| Fire | 🔥 | $0.50 | Small flame on screen |
| Heart | ❤️ | $1.00 | Floating hearts |
| Crown | 👑 | $5.00 | Crown appears over slot |
| Rocket | 🚀 | $10.00 | Rocket animation across screen |
| Diamond | 💎 | $25.00 | Full screen diamond burst |
| Hustle Zone | 🏆 | $50.00 | Custom trophy animation + sound |
| Spotlight | ⭐ | $100.00 | Pin their slot fullscreen for 5s |
| Private Room (5min) | 🔒 | $0.99 | Password-protected room for 5 min |
| Private Room Extend | 🔄 | $0.50 | Extend private room 5 more min |

## Subscription Tiers

| Tier | Price | Perks |
|------|-------|-------|
| **Basic** | $4.99/mo | Sub badge, ad-free, exclusive emoji |
| **Premium** | $9.99/mo | Basic perks + priority slot queue + sub-only chat |
| **Ultra** | $24.99/mo | Premium perks + custom badge + host shoutout |

### Revenue Split (Subscriptions)

| Role | Share |
|------|-------|
| **Creator** | 70% |
| **Platform** | 20% |
| **Creator Fund** | 5% (bonus pool for top creators weekly) |
| **Processing** | 5% (Stripe fees) |

## Payouts

Users can withdraw earnings to their bank account via Stripe Connect:

- **Minimum payout:** $10.00
- **Platform fee:** 15% on gifts, 10% on tips, 20% on subscriptions
- **Payout schedule:** Weekly automatic, or manual request
- **Processing time:** 3-5 business days

## Stripe Integration

```sql
-- Each user gets a Stripe Connect account
users.stripe_account_id = "acct_xxx"

-- Deposits use Stripe PaymentIntent
-- Payouts use Stripe Transfer
-- Subscriptions use Stripe Subscriptions API
-- Platform fee via application_fee_amount
```

## Reputation & Badges XP

Users earn XP for platform engagement:

| Action | XP |
|--------|----|
| Host a room | +10 |
| Participate (slot) | +5 |
| Send a gift | +2 per $1 |
| Receive a gift | +1 per $1 |
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
