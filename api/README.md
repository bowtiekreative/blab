# API Reference — Hustle Zone

Base URL: `https://api.hustlezone.app/v1`
WebSocket: `wss://api.hustlezone.app`

## Authentication

All API requests require a Bearer JWT token unless otherwise noted.

```
Authorization: Bearer <jwt_token>
```

### Endpoints

```
POST   /v1/auth/oauth/:provider         # OAuth login (google, facebook, x)
POST   /v1/auth/refresh                 # Refresh JWT
POST   /v1/auth/logout                  # Invalidate session
GET    /v1/auth/me                      # Current user profile
```

---

## Core Domain Models

### User

```json
{
  "id": "uuid",
  "username": "string (unique)",
  "displayName": "string",
  "avatarUrl": "url",
  "bio": "string",
  "socialLinks": { "google": "id", "facebook": "id", "x": "id" },
  "reputation": { "followers": 0, "following": 0, "totalClaps": 0 },
  "isBanned": "boolean",
  "isGloballyBlocked": "boolean",
  "createdAt": "ISO8601",
  "lastSeenAt": "ISO8601"
}
```

### Room

```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "hostId": "uuid",
  "hashtags": ["string"],
  "category": "string",
  "isLive": "boolean",
  "isRecorded": "boolean",
  "isBanned": "boolean",
  "slots": {
    "total": 4,
    "filled": 0,
    "participants": [{
      "userId": "uuid",
      "slotIndex": 0-3,
      "isMuted": false,
      "isVideoOn": true,
      "joinedAt": "ISO8601"
    }]
  },
  "stats": {
    "viewerCount": 0,
    "lurkerCount": 0,
    "totalClaps": 0,
    "totalGifts": 0
  },
  "createdAt": "ISO8601",
  "startedAt": "ISO8601"
}
```

### Message

```json
{
  "id": "uuid",
  "roomId": "uuid",
  "userId": "uuid",
  "type": "text | gif | gift | system",
  "content": "string",
  "gifUrl": "url",
  "mentions": ["uuid"],
  "hashtags": ["string"],
  "gift": { "type": "string", "value": 0, "recipientId": "uuid" },
  "createdAt": "ISO8601"
}
```

---

## 1. Rooms API

### CRUD

```
GET    /v1/rooms                    # List/search rooms
POST   /v1/rooms                    # Create room
GET    /v1/rooms/:id                # Get room details
PATCH  /v1/rooms/:id                # Update room
DELETE /v1/rooms/:id                # Delete room (host only)
```

### Search & Discovery

```
GET    /v1/rooms/search?q=term&tag=hashtag&category=cat&sort=trending
GET    /v1/rooms/trending           # Trending rooms
GET    /v1/rooms/by-tag/:hashtag    # Rooms by hashtag
GET    /v1/rooms/categories         # List categories
```

### Room Control (Host)

```
POST   /v1/rooms/:id/start          # Start streaming
POST   /v1/rooms/:id/end            # End streaming
POST   /v1/rooms/:id/kick           # Kick participant from slot
POST   /v1/rooms/:id/block          # Block user from room
POST   /v1/rooms/:id/unblock        # Unblock user from room
POST   /v1/rooms/:id/mute           # Mute participant
POST   /v1/rooms/:id/unmute         # Unmute participant
POST   /v1/rooms/:id/remove-video   # Remove participant's video
```

### Participant Slots (The 4-Person Carousel)

```
POST   /v1/rooms/:id/join-slot      # Request slot (0-3)
POST   /v1/rooms/:id/leave-slot     # Leave current slot
POST   /v1/rooms/:id/swap-slot      # Swap to different slot
GET    /v1/rooms/:id/slots          # Slot status
POST   /v1/rooms/:id/clap           # Clap for a participant
```

### Lurker/Viewer Tracking

```
GET    /v1/rooms/:id/viewers        # Visible viewers list
GET    /v1/rooms/:id/lurkers        # Lurker count (not list — privacy)
POST   /v1/rooms/:id/enter          # Enter room (visible)
POST   /v1/rooms/:id/lurk           # Enter room (hidden)
```

---

## 2. Chat & Comments API

```
GET    /v1/rooms/:id/messages       # Chat history (paginated)
POST   /v1/rooms/:id/messages       # Send text message
POST   /v1/rooms/:id/gif            # Send GIF (via GIPHY/Tenor)
DELETE /v1/rooms/:id/messages/:mid  # Delete message
```

### @Mentions

```
GET    /v1/mentions                  # My mentions
POST   /v1/mentions/:id/dismiss      # Mark mention as read
```

---

## 3. Gifting & Monetization API

### Gifts

```
GET    /v1/gifts/catalog             # Available gift types with prices
POST   /v1/gifts/send                # Send gift to participant/room
```

### Wallet

```
GET    /v1/wallet                    # Balance & transaction history
POST   /v1/wallet/deposit            # Add funds (Stripe)
POST   /v1/wallet/withdraw           # Withdraw earnings (Stripe Connect)
```

### Tip Revenue

```
GET    /v1/wallet/earnings           # Host/participant earnings
POST   /v1/wallets/payout            # Request payout
```

---

## 4. User API

```
GET    /v1/users/:id                 # Get user profile
PATCH  /v1/users/me                  # Update my profile
POST   /v1/users/me/avatar           # Upload avatar
GET    /v1/users/:id/rooms           # User's rooms (hosted)
```

### Follows

```
POST   /v1/users/:id/follow          # Follow user
DELETE /v1/users/:id/follow          # Unfollow
```

### Blocks

```
POST   /v1/users/:id/block           # Block user globally
DELETE /v1/users/:id/block           # Unblock user
GET    /v1/users/me/blocks           # My blocked users list
```

---

## 5. Notifications API

```
GET    /v1/notifications              # My notifications
POST   /v1/notifications/read/:id    # Mark as read
POST   /v1/notifications/read-all    # Mark all as read
```

### Push Subscriptions

```
POST   /v1/push/subscribe            # Register push endpoint
POST   /v1/push/unsubscribe          # Unregister push
```

### Notification Types

| Type | Trigger | Delivery |
|------|---------|----------|
| `mention` | Someone @mentions you in chat | Push + in-app badge |
| `room_invite` | Someone invites you to a room | Push + in-app |
| `gift_received` | Someone sends you a gift | Push + in-app |
| `follower` | Someone follows you | In-app only |
| `clap` | Someone claps for you | In-app only |
| `room_trending` | Your room is trending | Push + in-app |

---

## 6. Recording & GIFs API

```
POST   /v1/rooms/:id/record/start   # Start recording
POST   /v1/rooms/:id/record/stop    # Stop recording
GET    /v1/rooms/:id/recordings     # List recordings

POST   /v1/rooms/:id/gif            # Create GIF from timestamp range
GET    /v1/rooms/:id/gifs           # Room GIFs gallery
DELETE /v1/rooms/:id/gifs/:gifId    # Delete GIF
```

### Recording Model

```json
{
  "id": "uuid",
  "roomId": "uuid",
  "url": "url",
  "duration": 0,
  "size": 0,
  "createdAt": "ISO8601",
  "thumbnails": ["url"]
}
```

### GIF Model

```json
{
  "id": "uuid",
  "roomId": "uuid",
  "userId": "uuid",
  "url": "url",
  "startTime": 0,
  "endTime": 0,
  "createdAt": "ISO8601"
}
```

---

## 7. Moderation & Admin API

### Room-Level Moderation (Host)

```
POST   /v1/rooms/:id/bans           # Ban user from room
DELETE /v1/rooms/:id/bans/:userId   # Unban from room
GET    /v1/rooms/:id/bans           # List room bans
```

### Global Moderation (Admin)

```
POST   /v1/admin/users/:id/ban          # Ban user globally
POST   /v1/admin/users/:id/unban        # Unban user
POST   /v1/admin/rooms/:id/block        # Block room (remove from search)
POST   /v1/admin/rooms/:id/unblock      # Unblock room
POST   /v1/admin/ips/:ip/ban            # Ban IP address
DELETE /v1/admin/ips/:ip/ban            # Unban IP
GET    /v1/admin/reports                # List reported content
POST   /v1/admin/reports/:id/resolve    # Resolve report
```

### Report Abuse

```
POST   /v1/reports                  # Report user/room/message
```

---

## 8. WebRTC Signaling

**Note:** All signaling happens over WebSocket, not REST. See [WebRTC Flow](./webrtc.md) for details.

---

## Response Format

### Success

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100
  }
}
```

### Error

```json
{
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "The specified room does not exist or has been banned.",
    "status": 404
  }
}
```

### Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | No permission (banned/kicked) |
| `ROOM_NOT_FOUND` | 404 | Room doesn't exist |
| `ROOM_FULL` | 409 | All 4 slots occupied |
| `RATE_LIMITED` | 429 | Too many requests |
| `USER_BANNED` | 403 | User is globally banned |
| `IP_BANNED` | 403 | IP is banned |
| `SLOT_TAKEN` | 409 | Slot already occupied |
| `INSUFFICIENT_FUNDS` | 402 | Not enough wallet balance |

## Rate Limiting

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1620000000
```

- **Standard:** 100 req/min per user
- **Chat:** 30 req/min per room (text)
- **Signaling:** N/A (WebSocket, persistent)
- **Auth:** 10 req/min (OAuth attempts)
