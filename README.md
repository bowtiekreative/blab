# Hustle Zone — Blab API

> *The spiritual successor to Blab (2015–2016)*

A **WebRTC live streaming platform** built for community. 4-person video carousel, room discovery, real-time chat with GIFs, lurker detection, gifting, recordings, and browser push notifications.

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
├──────────────────────────────────────────────────────────┤
│  PostgreSQL   │ Redis      │ S3/MinIO   │ LiveKit/WHIP  │
│  (State)      │ (Pub/Sub)  │ (Media)    │ (WebRTC SFU)  │
└──────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js + Fastify |
| **Real-time** | WebSocket (Socket.IO) + WebRTC |
| **Database** | PostgreSQL + Redis |
| **Media** | LiveKit (WebRTC SFU) + FFmpeg |
| **Storage** | S3/MinIO (recordings, GIFs, avatars) |
| **Auth** | OAuth 2.0 (Google, Facebook, X/Twitter) |
| **Push** | Firebase Cloud Messaging / Web Push API |
| **Payments** | Stripe Connect (gifting/monetization) |

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
| No notification re-engagement | Browser push for @mentions, room activity, offline alerts |
| No monetization | Gifting, tips, paid room access, revenue sharing |
| No retention hooks | Lurker counts, clapping, community reputation, recordings |
| No replay value | Recording + GIF creation from room highlights |
| No community tooling | Moderation, bans (room + global), IP blocking, admin controls |

---

## Quick Start

```bash
# Clone
git clone https://github.com/bowtiekreative/blab.git
cd blab

# Install
cp .env.example .env
npm install

# Database
docker compose up -d
npx prisma migrate dev

# Start
npm run dev
```

## Documentation

- [API Reference](./api/README.md) — All endpoints, models, WebSocket events
- [WebRTC Flow](./api/webrtc.md) — Signaling, SFU integration, 4-person carousel
- [WebSocket Events](./api/websocket.md) — Real-time events for rooms, chat, notifications
- [Database Schema](./api/database.md) — PostgreSQL schema, indexes, relations
- [Auth Flow](./api/auth.md) — OAuth, JWT, session management
- [Moderation](./api/moderation.md) — Bans, blocks, IP restrictions, admin controls
- [Monetization](./api/monetization.md) — Gifting, tips, Stripe Connect, revenue share
- [Recording & GIFs](./api/media.md) — Room recording, GIF generation, storage

## License

MIT
