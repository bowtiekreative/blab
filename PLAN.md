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
- [ ] **3 — Media**: LiveKit integration; token minting; 4-slot publish/subscribe;
      kick = revoke publish perms.
- [ ] **4 — Frontend**: login, room discovery, room view (2×2 carousel + chat + claps).
- [ ] **5 — Economy**: tokens, wallet, claps→earnings, gift catalog, Stripe purchase/cashout.
- [ ] **6 — Community & safety**: squads, room/squad/platform governance, jail + appeals.
- [ ] **7 — Growth & ops**: notifications/push, recordings/clips/teasers, admin dashboards.

## Local dev

```bash
# backend
cd server && cp .env.example .env && npm install
createdb hustlezone && npm run migrate && npm run dev   # http://localhost:3000

# frontend
cd web && npm install && npm run dev                    # http://localhost:5173
```
