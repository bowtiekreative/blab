# Monetization — Hustle Zone

## Economy Model

```
User deposits $ → Wallet balance (in cents)
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                  ▼
     Send Gifts        Tip Hosts         Tip Participants
          │                 │                  │
          ▼                 ▼                  ▼
     Recipient      Recipient            Recipient
     Wallet (+)     Wallet (+)           Wallet (+)
          │                 │                  │
          ▼                 ▼                  ▼
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

## Payouts

Users can withdraw earnings to their bank account via Stripe Connect:

- **Minimum payout:** $10.00
- **Platform fee:** 15% on gifts, 10% on tips
- **Payout schedule:** Weekly automatic, or manual request
- **Processing time:** 3-5 business days

## Stripe Integration

```sql
-- Each user gets a Stripe Connect account
users.stripe_account_id = "acct_xxx"

-- Deposits use Stripe PaymentIntent
-- Payouts use Stripe Transfer
-- Platform fee via application_fee_amount
```

## Revenue Share

| Role | Share of gift value |
|------|-------------------|
| **Sender** | N/A (gift is consumed) |
| **Recipient** | 70% of gift value |
| **Host** | 10% of room gift value (bonus) |
| **Platform** | 15-20% |
| **Creator Fund** | 5% (distributed to top creators weekly) |
