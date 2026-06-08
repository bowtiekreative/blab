# Promo Rooms (Brands) — Hustle Zone

> The core of Hustle Zone is **fun, community, jamming out** — not selling. If you're a **brand** (a company, a label, a store) and you want to promote, you pay for a Promo Room. If you're an individual trying to coach or sell, this isn't the platform for that.

---

## Philosophy

| Type | Allowed? | Why |
|------|----------|-----|
| **Community member jamming out** | ✅ Free | This is what the platform is built for |
| **Brand selling products** | ✅ 999 ⏣ ($9.99) via Promo Room | Brands have budgets — they pay to reach the audience |
| **Coach / webinar / teacher** | ❌ Not welcome | The platform is for fun and connection, not courses. Use a webinar tool. |
| **Influencer doing a Q&A** | ✅ Free (Standard Room) | Q&A is native to standard rooms — organic, not a promo |
| **Record label showcasing artists** | ✅ 999 ⏣ Promo Room or Free Standard | Listening parties are community. Straight promo = pay. |

**Clear line:** If you're selling something or teaching something, you need a Promo Room. If you're just hanging out and jamming, you're free.

---

## Room Types

| Type | Cost | Audience | Purpose |
|------|------|----------|---------|
| **Standard Room** | 🆓 Free | All users | Hang out, jam, communicate, have fun |
| **Promo Room** (Brand) | **999 ⏣ / session** ($9.99) | Anyone who joins | Brand presentations, product launches, store promos |
| **Anonymous Room** | **49 ⏣ / session** ($0.49) | All users | Squad badges hidden, anonymous display names |
| **Private Room** | **99 ⏣ / 5 min** ($0.99) | Invite only | Quick side conversations |

---

## Promo Room Rules

| Rule | Detail |
|------|--------|
| **Cost** | 999 ⏣ per session (≈ $9.99) |
| **Duration** | Up to 2 hours per session |
| **Label** | Clearly marked as 🏷️ **Promo** in the room list with brand name |
| **Who can open** | Any verified user representing a **brand** (company, label, store) |
| **Content** | Product launches, brand presentations, store promos, showcases |
| **Chat** | Promo rooms can turn off chat (presentation mode) |
| **Recording** | Always RECORDED by default (for compliance and brand review) |
| **Refund** | No refunds — you paid, you present |
| **Rating** | Attendees can rate the promo (1-5 stars) — low ratings affect future availability |

### What Happens If You Sell/Coach Without a Promo Room

- First offense: Warning + room temporarily paused
- Second offense: 24-hour room creation ban
- Third offense: Room creation suspended for 7 days
- Repeated: Platform strike

> **The rule is simple:** If you're selling, pay up. The platform is for jamming out.

---

## Features Available in Promo Rooms

| Feature | Standard Room | Promo Room |
|---------|--------------|------------|
| 4-person carousel | ✅ | ✅ |
| Voice notes | ✅ | ✅ |
| Chat | ✅ | ✅ (can disable for presentation mode) |
| Q&A | ❌ | ✅ (built-in Q&A) |
| Screen share | ❌ | ✅ (brand can share slides/product demos) |
| Raise hand | ❌ | ✅ (attendee queue) |
| Record | Majority vote consent | Always on |
| Tips/gifts | ✅ | ✅ |
| Ratings | ❌ | ✅ (post-session, affects future pricing) |
| Attendee limit | No limit | 500 max |

---

## Q&A Mode (Promo Rooms)

Promo rooms get a **native Q&A system** for audience interaction:

```json
{
  "promoFeatures": {
    "qaEnabled": true,
    "screenShareEnabled": true,
    "raiseHandEnabled": true,
    "maxAttendees": 500,
    "ratingEnabled": true
  }
}
```

### Q&A Flow
1. Attendee submits a question (text or voice note)
2. Brand host sees questions in a queue
3. Host can:
   - Answer live (unmute attendee or speak)
   - Answer via voice note
   - Mark as answered
   - Skip/dismiss
4. Answered questions appear in the session transcript

---

## GIFs/Reels for Going Live

> Any room — standard or promo — can generate **teaser GIFs and reels** that users can share on social media to promote their live session.

**See full spec:** [Teaser System in media.md](./media.md)

| Type | Format | Duration |
|------|--------|----------|
| **Quick Clip** | MP4 (16:9) | 10-15s |
| **Vertical Reel** | MP4 (9:16) | 15-30s |
| **Looping GIF** | GIF (1:1 or 16:9) | 5-10s |
| **Sticker/Story** | PNG (9:16) | Static |

---

## API Endpoints

```
POST   /v1/rooms/promo                    # Create a promo room (charged 999 ⏣)
GET    /v1/rooms/promo/schedule           # Upcoming promo rooms
GET    /v1/rooms/promo/:id/qa             # Q&A for promo room
POST   /v1/rooms/promo/:id/qa             # Submit Q&A question
POST   /v1/rooms/promo/:id/qa/:qid/answer # Answer Q&A (host only)
POST   /v1/rooms/promo/:id/rate           # Rate promo room (1-5)
POST   /v1/rooms/promo/:id/screenshare    # Start screen share (host only)
```

---

## Price Summary

| Feature | Standard (Free) | Promo (Brand, Paid) |
|---------|----------------|---------------------|
| Create room | ✅ Free | ❌ N/A |
| Create promo room | ❌ N/A | ✅ 999 ⏣ ($9.99) |
| Prevent lurkers | ❌ Paid | ✅ 199 ⏣ ($1.99) |
| Ban screenshots | ❌ Paid | ✅ 149 ⏣ ($1.49) |
| Anonymous room | ❌ 49 ⏣ | ❌ 49 ⏣ |
| Private room (5 min) | ❌ 99 ⏣ | ❌ 99 ⏣ |
| Recording | ✅ Majority vote | ✅ Always on |
| Teaser GIF/reel | ✅ Free | ✅ Free |
