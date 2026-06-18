# Hustle Zone — Build Plan (Clean-Room)

The spiritual successor to Blab (2015–2016): a 4-person video carousel live-streaming
platform with chat, claps, a token economy, squads, and governance.

## Why "clean-room"

This codebase is built **entirely from our own API specification** in [`/api`](./api) —
original code that we own outright and can license freely. An earlier exploratory
fork of a third-party **AGPL-3.0** video project was fully removed, since AGPL's
network-use source-disclosure obligations are incompatible with shipping this as our
own proprietary product.

- `server/` — our backend (original code)
- `web/` — our frontend (original code)
- `api/` — our API/domain spec (the source of truth, written by us)

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node 22 + Fastify 5 (ESM) | matches spec |
| Realtime signaling | Raw WebSocket (`@fastify/websocket`) | matches `api/websocket.md` event shapes |
| Media (SFU) | LiveKit | Apache-2.0, permissive — powers the 4-stream carousel |
| Database | PostgreSQL | schema from `api/database.md` |
| Cache/presence | Redis | viewer counts, presence, rate limits (optional in dev) |
| Frontend | React + Vite + TypeScript + Tailwind | |
| Auth | JWT (OAuth providers later) | matches `api/auth.md` |
| Payments | Stripe + Stripe Connect | Phase 5 |

## Phases

- [x] **0 — Scaffold**: monorepo, tooling, this plan.
- [ ] **1 — Backend foundation**: Fastify boot, Postgres schema + migrate, JWT auth,
      `/health`, dev login, `/auth/me`.
- [ ] **2 — Rooms & realtime**: rooms CRUD + discovery; WebSocket gateway (presence,
      chat, claps, reactions, slot join/leave/swap, typing) per `api/websocket.md`.
- [x] **3 — Media**: LiveKit integration. Server mints scoped access tokens
      (`POST /v1/rooms/:id/token`, identity = userId, room = roomId); client
      `useLiveKit` hook publishes camera/mic on slot join, subscribes to remote
      tracks, and maps streams to slots by userId. Degrades to local-only
      preview when LiveKit isn't configured. *(Runtime multi-party needs a
      LiveKit server — set `LIVEKIT_*` in `server/.env`.)*
- [ ] **4 — Frontend**: login, room discovery, room view (2×2 carousel + chat + claps).
- [x] **5 — Economy**: ⏣ token wallet with an append-only ledger (atomic
      credit/debit). Endpoints: balance, transactions, earnings-history,
      exchange-rate, purchase, convert-to-cash (15% fee, monthly cap). Gift
      catalog + send (recipient earns `GIFT_EARN_RATE`, broadcast over WS).
      Free claps (20/room cap) and unlimited token claps both credit earnings;
      clap leaderboard. Stripe is optional — simulated purchase/cashout when no
      key is set. Frontend: wallet balance, gift picker, gift events in chat.
- [x] **6 — Community & safety**: three-tier governance + squads + jail.
      Tier 2 squads (CRUD, invite-only membership, role hierarchy with
      promote/demote/kick, conduct muted-words). Tier 1 room governance
      (co-hosts, moderators, kick, room ban/unban, warn, mute, delete message,
      clear chat, muted words) with live WS broadcasts. Tier 0 self-block +
      reports. Tier 3 admin (strikes→escalation, global ban, send-to-jail,
      block room, resolve reports, jail appeals approve/deny, IP bans). Jail
      enforced across room create / join / chat / gift / clap. Frontend:
      live moderation events + report button.
      *(Deferred: squad go-live email alerts — needs email infra.)*
- [x] **7 — Growth & ops**: notifications (persisted + live WS delivery, wired
      into gifts/mentions/follows), follows graph, push-subscription +
      preference endpoints. Recordings + clips/gifs/teasers (real metadata API;
      media assets marked 'simulated' until Egress/FFmpeg/S3 are wired).
      Admin dashboards: overview metrics, user list/detail, room tabs, revenue
      + top-creators/top-rooms analytics. Frontend: admin dashboard page
      (reports queue + jail release) and a notifications bell.
      *(Deferred: real LiveKit Egress recording, FFmpeg clip rendering, Web
      Push/FCM fan-out, identity-verification queue — all need external infra.)*

## Local dev

```bash
# backend
cd server && cp .env.example .env && npm install
createdb hustlezone && npm run migrate && npm run dev   # http://localhost:3000

# frontend
cd web && npm install && npm run dev                    # http://localhost:5173
```
