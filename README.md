# Hustle Zone — Blab API

> *The spiritual successor to Blab (2015–2016)*

A **WebRTC live streaming platform** built for community. 4-person video carousel, room discovery, real-time chat with voice notes, squads, token economy, GIFs/reels, lurkers, gifting, recordings, and browser push notifications.

Inspired by [Blab](https://techcrunch.com/2016/08/14/blab-shuts-down-but-founders-promise-new-product-on-the-way/) — the 4-column live video app that amassed 3.9M users before shutting down in 2016 because only 10% returned daily. This reimagines the concept with stronger community features, monetization, and retention mechanics.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Client (Web/Mobile)                    │
│  React + Tailwind + Headless UI + WebRTC + WebSockets    │
└─────────────────┬──────────────┬──────────────┬──────────┘
                  │ HTTP/REST     │ WebSocket    │ WebRTC
┌─────────────────▼──────────────▼──────────────▼──────────┐
│                    API Gateway (Nginx/Fastify)            │
├──────────────────────────────────────────────────────────┤
│  Auth         │ Rooms      │ Chat       │ Media          │
│  Users        │ Signaling  │ Gifting    │ Recording      │
│  Notifications│ Discovery  │ Moderation │ Analytics      │
│  Squads       │ Identity   │ Voice Note │ Tokens         │
│  Promo Rooms  │ Governance │ Jail       │ Admin Dashboard│
├──────────────────────────────────────────────────────────┤
│  PostgreSQL   │ Redis      │ S3/MinIO   │ LiveKit/WHIP  │
│  (State)      │ (Pub/Sub)  │ (Media)    │ (WebRTC SFU)  │
└──────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js + Fastify |
| **Real-time** | WebSocket (`@fastify/websocket`) + WebRTC |
| **Database** | PostgreSQL + Redis |
| **Media** | LiveKit (WebRTC SFU) + FFmpeg |
| **Storage** | S3/MinIO (recordings, GIFs, avatars, voice notes, teasers) |
| **Auth** | OAuth 2.0 (Google, Facebook, X/Twitter) |
| **Push** | Firebase Cloud Messaging / Web Push API |
| **Payments** | Stripe Connect (tokens, gifting, subscriptions) |
| **Identity** | Face detection + liveness + phone verification |
| **AI** | ASR for transcript word-filtering, face detection for verification |

## The Original Blab (2015–2016)

| Fact | Detail |
|------|--------|
| **Founders** | Shaan Puri, Monkey Inferno (Bebo founders) |
| **Users** | 3.9M in <1 year |
| **Daily active** | ~400K (10% retention) |
| **Core layout** | **4-column video carousel** — the signature feature |
| **Avg session** | 65+ minutes/day for active users |
| **Why it died** | Most live streams weren't compelling → low daily retention. Creators (ESPN, UFC) used it weekly, friends used it daily but didn't grow. Founders killed it rather than pivoting to a niche tool. |
| **Legacy** | Tech was repurposed into Bebo for gamers on Twitch |

## Why Hustle Zone Will Be Different

| Blab's Problem | Hustle Zone Solution |
|----------------|---------------------|
| No room discovery | Searchable rooms, hashtags, trending, categories |
| No notification re-engagement | Browser push for @mentions, room activity, **squad go-live alerts**, offline alerts |
| No monetization | **Token economy** (⏣), gifting, tips, promo rooms, paid private rooms, revenue sharing |
| No identity/belonging | **Squads** — labeled groups with badges, go-live notifications, conduct |
| No retention hooks | **Ongoing clap system** with token rewards, lurker counts, community reputation, recordings |
| No replay value | Recording + **GIF/Reel teaser creation** from room highlights |
| No community tooling | **3-tier governance** (Room → Squad → Platform), moderation, bans, **Jail** system |
| Anonymous users | **Forced identity verification** — photo, liveness, phone, age |

## Core Features

| Feature | Description |
|---------|-------------|
| 🎥 **4-Person Video Carousel** | The signature Blab experience — 4 slots, mute/unmute, slot queue |
| 🏷️ **Squads** | Label-based identity groups. Invite-only. Email notification when squad goes live |
| ⚔️ **Squad Battles** | Head-to-head live competitions. Viewers tip ⏣. Winner takes 70% of pot |
| ✅ **Identity Verification** | No anonymous users. Face photo + liveness + phone + age verification |
| 🎙️ **Voice Notes** | Audio messages in chat. Host can play for entire room and mute guests |
| 👏 **Ongoing Claps** | Continuous clapping for specific participants — earn tokens from claps |
| ⏣ **Token Economy** | In-app currency. Earn via engagement, exchange for cash (100 ⏣ = $1) |
| 🎬 **GIFs & Reels** | Create teaser content from rooms to post on social media when going live |
| 🏢 **Promo Rooms** | Paid rooms ($9.99) for **brands** selling products — NOT for individual coaches |
| 🎭 **Anonymous Rooms** | Paid ($0.49). Hide squad badges, anonymous display names |
| 🔒 **Paid Private Rooms** | 5-min password rooms for $0.99 — prevent private rooms from dominating |
| 🏛️ **3-Tier Governance** | Room (words/chat) → Squad (conduct/brand) → Platform (racism/illegal) |
| 🚔 **Jail System** | Reported users get restricted — can only appeal, nothing else |
| 🔴 **Recording with Consent** | Room recording with per-user consent. Host blocks non-consenting users |
| 👻 **Paid Lurker Prevention** | Hosts can pay to ban lurkers from their room ($1.99) |
| 📸 **Paid Screenshot Ban** | Hosts can pay to block screenshotting in their room ($1.49) |
| 📊 **Comprehensive Admin** | Platform admin, squad admin, and room host dashboards with full controls |

---

## Quick Start

The repo is a two-app monorepo: `server/` (Fastify API + WebSocket) and `web/`
(React + Vite). Each is self-contained.

```bash
git clone https://github.com/bowtiekreative/blab.git
cd blab

# 1. Backend
cd server
cp .env.example .env
npm install
createdb hustlezone        # PostgreSQL must be running
npm run migrate            # apply schema
npm run dev                # http://localhost:3000

# 2. Frontend (in a second terminal)
cd web
npm install
npm run dev                # http://localhost:5173 (proxies /v1 + /ws to :3000)
```

See [PLAN.md](./PLAN.md) for the phased build roadmap.

## Documentation

### Core API
- [API Reference](./api/README.md) — All endpoints, models, WebSocket events
- [WebRTC Flow](./api/webrtc.md) — Signaling, SFU integration, 4-person carousel
- [WebSocket Events](./api/websocket.md) — Real-time events for rooms, chat, notifications
- [Database Schema](./api/database.md) — PostgreSQL schema, indexes, relations

### Identity & Social
- [Identity & Verification](./api/identity.md) — Photo, liveness, phone, age verification
- [Squads](./api/squads.md) — Label-based identity groups, roles, go-live alerts
- [Squad Battles](./api/squad-battles.md) — Head-to-head live competitions, tip ⏣ to win
- [Tokens & Gift Rewards](./api/tokens.md) — Token economy, clap system, cash out, gift rewards

### Governance & Moderation
- [Governance System](./api/governance.md) — 3-tier governance (Room → Squad → Platform)
- [Moderation](./api/moderation.md) — Bans, blocks, IP restrictions, admin controls

### Monetization
- [Token Economy](./api/tokens.md) — Earn ⏣ tokens, clap system, cash out
- [Monetization](./api/monetization.md) — Gifting, subscriptions, Stripe Connect
- [Promo Rooms](./api/promo-rooms.md) — Paid coach/webinar rooms, Q&A, teasers

### Communication
- [Voice Notes](./api/voice-notes.md) — Audio messages in chat, host broadcast mode

### Media
- [Recording & GIFs](./api/media.md) — Room recording, GIF generation, teaser reels

### Admin
- [Admin Dashboard](./api/admin-dashboard.md) — Platform, squad, and room dashboards

### Auth
- [Auth Flow](./api/auth.md) — OAuth, JWT, session management, 2FA

## License

MIT
