# Promo Rooms (Coaches & Webinars) — Hustle Zone

> The core of Hustle Zone is **fun, community, jamming out** — not coaching or selling. But we allow promotional content as a **paid feature** to keep the main feed clean.

---

## Room Types

| Type | Cost | Audience | Purpose |
|------|------|----------|---------|
| **Standard Room** | 🆓 Free | All users | Hang out, jam, communicate, have fun |
| **Promo Room** (Coach/Webinar) | **999 ⏣ / session** ($9.99) | Anyone who joins | Coaching, teaching, selling, presentations |
| **Private Room** | **99 ⏣ / 5 min** ($0.99) | Invite only | Quick side conversations |

---

## Promo Room Rules

| Rule | Detail |
|------|--------|
| **Cost** | 999 ⏣ per session (≈ $9.99) |
| **Duration** | Up to 2 hours per session |
| **Label** | Clearly marked as 🏷️ **Promo** in the room list |
| **Who can open** | Any verified user with sufficient tokens |
| **Content** | Coaching, webinars, teaching, presentations, selling |
| **Chat** | Promo rooms can turn off chat (lecture mode) |
| **Recording** | Always RECORDED by default (for compliance) |
| **Refund** | No refunds — you paid, you present |
| **Rating** | Attendees can rate the promo (1-5 stars) |

### What Happens If You Promote Without a Promo Room

- First offense: Warning + room temporarily paused
- Second offense: 24-hour room creation ban
- Third offense: Room creation suspended for 7 days
- Repeated: Platform strike

> **The philosophy:** If you want to sell or teach, pay for a Promo Room. The platform is for jamming out.

---

## Features Available in Promo Rooms

| Feature | Standard Room | Promo Room |
|---------|--------------|------------|
| 4-person carousel | ✅ | ✅ |
| Voice notes | ✅ | ✅ |
| Chat | ✅ | ✅ (can disable) |
| Q&A | ❌ | ✅ (built-in Q&A) |
| Screen share | ❌ | ✅ (coach can share slides) |
| Raise hand | ❌ | ✅ (attendee queue) |
| Record | Consent-based | Always on |
| Tips/gifts | ✅ | ✅ |
| Ratings | ❌ | ✅ (post-session) |
| Attendee limit | No limit | 500 max |

---

## Q&A Mode (Promo Rooms)

Promo rooms get a **native Q&A system**:

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
2. Coach sees questions in a queue
3. Coach can:
   - Answer live (unmute attendee or speak)
   - Answer via voice note
   - Mark as answered
   - Skip/dismiss
4. Answered questions appear in the session transcript

---

## API Endpoints

```
POST   /v1/rooms/promo                    # Create a promo room (charged 999 ⏣)
GET    /v1/rooms/promo/schedule           # Upcoming promo rooms
GET    /v1/rooms/promo/:id/qa             # Q&A for promo room
POST   /v1/rooms/promo/:id/qa             # Submit Q&A question
POST   /v1/rooms/promo/:id/qa/:qid/answer # Answer Q&A (host only)
POST   /v1/rooms/promo/:id/rate           # Rate promo room (1-5)
```

---

## Create GIFs/Reels for Going Live

> Any room — standard or promo — can generate **teaser GIFs and reels** that users can share on social media to promote their live session.

### How It Works

1. Host clicks **"Create Teaser"** during or before a room
2. They select a **10-30 second clip** from the room (or record a quick promo)
3. System generates:
   - **GIF** (looping, no audio — for Twitter, Instagram)
   - **Reel** (vertical video with audio — for TikTok, Instagram Reels, YouTube Shorts)
4. Teaser is auto-branded with:
   - Room name
   - Host username
   - "🔴 LIVE NOW" overlay
   - Hustle Zone watermark
5. Host gets a **downloadable link + shareable URL**
6. Optional: "Go Live" button embedded in the teaser URL

### Teaser Types

| Type | Format | Platform | Duration |
|------|--------|----------|----------|
| **Quick Clip** | MP4 (16:9) | X/Twitter, Facebook | 10-15s |
| **Vertical Reel** | MP4 (9:16) | TikTok, Instagram Reels, YouTube Shorts | 15-30s |
| **Looping GIF** | GIF (1:1 or 16:9) | Twitter, Discord, SMS | 5-10s |
| **Sticker/Story** | PNG (9:16) | Instagram Story | Static image with overlay |

### API

```
POST   /v1/rooms/:id/teaser              # Generate teaser GIF/reel
GET    /v1/rooms/:id/teasers             # Existing teasers
DELETE /v1/rooms/:id/teasers/:teaserId   # Delete teaser
```

---

## Price Summary

| Feature | Standard (Free) | Promo (Paid) |
|---------|----------------|--------------|
| Create room | ✅ Free | ❌ N/A |
| Create promo room | ❌ N/A | ✅ 999 ⏣ ($9.99) |
| Prevent lurkers | ❌ Paid feature | ✅ 199 ⏣ ($1.99) |
| Ban screenshots | ❌ Paid feature | ✅ 149 ⏣ ($1.49) |
| Private room (5 min) | ❌ 99 ⏣ | ❌ 99 ⏣ |
| Recording | ✅ Consent-based | ✅ Always on |
| Teaser GIF/reel | ✅ Free | ✅ Free |
