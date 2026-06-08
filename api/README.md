# API Reference — Hustle Zone

Base URL: `https://api.hustlezone.app/v1`
WebSocket: `wss://api.hustlezone.app`

## Authentication

All API requests require a Bearer JWT token unless otherwise noted.

```
Authorization: Bearer <jwt_t...n### Endpoints

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
  "reputation": { "followers": 0, "following": 0, "totalClaps": 0, "level": 1, "xp": 0 },
  "badges": ["early_adopter", "top_host", "gifter"],
  "isBanned": "boolean",
  "isGloballyBlocked": "boolean",
  "strikes": 0,
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
  "coHostIds": ["uuid"],
  "coverImageUrl": "url",
  "hashtags": ["string"],
  "category": "string",
  "categoryIcon": "url",
  "isLive": "boolean",
  "isPrivate": "boolean",
  "passwordHash": "string (null if public)",
  "isRecorded": "boolean",
  "isBanned": "boolean",
  "isScheduled": "boolean",
  "scheduledStartAt": "ISO8601",
  "scheduledEndAt": "ISO8601",
  "inviteCode": "string",
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
    "totalGifts": 0,
    "totalSubscribers": 0
  },
  "moderators": ["uuid"],
  "mutedWords": ["string"],
  "settings": {
    "slowMode": 0,
    "slowModeDelay": 5,
    "giftsEnabled": true,
    "subsOnly": false
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
  "type": "text | gif | gift | system | poll | clip | sub",
  "content": "string",
  "gifUrl": "url",
  "mentions": ["uuid"],
  "hashtags": ["string"],
  "gift": { "type": "string", "value": 0, "recipientId": "uuid" },
  "poll": { "id": "uuid", "question": "string", "options": [] },
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
PATCH  /v1/rooms/:id/cover          # Upload room cover image
```

### Search & Discovery

```
GET    /v1/rooms/search?q=term&tag=hashtag&category=cat&sort=trending
GET    /v1/rooms/trending           # Trending rooms
GET    /v1/rooms/by-tag/:hashtag    # Rooms by hashtag
GET    /v1/rooms/categories         # List categories with icons
```

### Private / Password Rooms

```
POST   /v1/rooms/:id/verify-password  # Join private room
PATCH  /v1/rooms/:id/set-password     # Set/change room password
PATCH  /v1/rooms/:id/remove-password  # Make room public again
```

### Scheduled Rooms

```
POST   /v1/rooms/:id/schedule         # Schedule room for future
PATCH  /v1/rooms/:id/schedule         # Update schedule
DELETE /v1/rooms/:id/schedule         # Cancel scheduled room
GET    /v1/rooms/scheduled            # Upcoming scheduled rooms
GET    /v1/users/me/scheduled-rooms   # My scheduled rooms
```

### Invite / Share

```
POST   /v1/rooms/:id/generate-invite  # Generate invite code
GET    /v1/rooms/invite/:code         # Join via invite code
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

### Co-Hosts & Moderators

```
POST   /v1/rooms/:id/co-host          # Promote to co-host
DELETE /v1/rooms/:id/co-host/:userId  # Demote co-host
POST   /v1/rooms/:id/moderator        # Add moderator
DELETE /v1/rooms/:id/moderator/:uid   # Remove moderator
GET    /v1/rooms/:id/moderators       # List moderators
```

### Participant Slots (The 4-Person Carousel)

```
POST   /v1/rooms/:id/join-slot      # Request slot (0-3)
POST   /v1/rooms/:id/leave-slot     # Leave current slot
POST   /v1/rooms/:id/swap-slot      # Swap to different slot
GET    /v1/rooms/:id/slots          # Slot status
POST   /v1/rooms/:id/clap           # Clap for a participant
```

### Slot Queue (Waitlist)

```
POST   /v1/rooms/:id/queue-join     # Join waitlist for a slot
POST   /v1/rooms/:id/queue-leave    # Leave waitlist
GET    /v1/rooms/:id/queue          # View queue (host only)
POST   /v1/rooms/:id/queue-next     # Promote next in queue (host)
```

### Lurker/Viewer Tracking

```
GET    /v1/rooms/:id/viewers        # Visible viewers list
GET    /v1/rooms/:id/lurkers        # Lurker count (not list — privacy)
POST   /v1/rooms/:id/enter          # Enter room (visible)
POST   /v1/rooms/:id/lurk           # Enter room (hidden)
```

### Room Settings

```
PATCH  /v1/rooms/:id/settings       # Update room settings (slow mode, etc.)
PATCH  /v1/rooms/:id/muted-words    # Manage muted words
```

---

## 2. Chat & Comments API

```
GET    /v1/rooms/:id/messages       # Chat history (paginated)
POST   /v1/rooms/:id/messages       # Send text message
POST   /v1/rooms/:id/gif            # Send GIF (via GIPHY/Tenor)
DELETE /v1/rooms/:id/messages/:mid  # Delete message
```

### Emoji Reactions

```
POST   /v1/rooms/:id/messages/:mid/react   # React to message
DELETE /v1/rooms/:id/messages/:mid/react   # Remove reaction
```

### Polls

```
POST   /v1/rooms/:id/polls                   # Create poll (host/mod only)
POST   /v1/rooms/:id/polls/:pollId/vote      # Vote on poll
PATCH  /v1/rooms/:id/polls/:pollId/close     # Close poll (host only)
GET    /v1/rooms/:id/polls/:pollId/results   # Get poll results
```

### @Mentions

```
GET    /v1/mentions                  # My mentions
POST   /v1/mentions/:id/dismiss      # Mark mention as read
```

### Muted Words (User-Level)

```
POST   /v1/users/me/muted-words      # Add word to mute list
DELETE /v1/users/me/muted-words/:word # Remove word
GET    /v1/users/me/muted-words      # List muted words
```

---

## 3. Gifting & Monetization API

### Gifts

```
GET    /v1/gifts/catalog             # Available gift types with prices
POST   /v1/gifts/send                # Send gift to participant/room
```

### Subscriptions (Recurring)

```
GET    /v1/subscriptions/tiers        # Available subscription tiers
POST   /v1/subscriptions/:creatorId  # Subscribe to creator
DELETE /v1/subscriptions/:creatorId  # Unsubscribe
GET    /v1/subscriptions/active      # My active subscriptions
GET    /v1/users/:id/subscribers     # Creator's subscriber list
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
DELETE /v1/users/me                  # Delete account (GDPR)
GET    /v1/users/me/export           # Export my data (GDPR)
GET    /v1/users/:id/rooms           # User's rooms (hosted)
```

### 2-Factor Authentication

```
POST   /v1/auth/2fa/enable           # Enable 2FA
POST   /v1/auth/2fa/disable          # Disable 2FA (requires code)
POST   /v1/auth/2fa/verify           # Verify 2FA code on login
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

### Badges & Reputation

```
GET    /v1/users/:id/badges          # User's badges
GET    /v1/badges/catalog            # All available badges
GET    /v1/users/:id/xp             # XP breakdown
```

---

## 5. Notifications API

```
GET    /v1/notifications              # My notifications
POST   /v1/notifications/read/:id    # Mark as read
POST   /v1/notifications/read-all    # Mark all as read
POST   /v1/notifications/preferences # Update notification settings
```

### Push Subscriptions

```
POST   /v1/push/subscribe            # Register push endpoint (Web)
POST   /v1/push/register-fcm        # Register FCM token (Mobile)
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
| `sub_gifted` | Someone subs to you | Push + in-app |
| `scheduled_room` | A room you follow is starting soon | Push + in-app |
| `poll_created` | Poll in room you're in | In-app only |

---

## 6. Recording, Clips & GIFs API

### Recordings

```
POST   /v1/rooms/:id/record/start   # Start recording
POST   /v1/rooms/:id/record/stop    # Stop recording
GET    /v1/rooms/:id/recordings     # List recordings
```

### Clips (Short Highlights)

```
POST   /v1/rooms/:id/clips          # Create clip from timestamp
GET    /v1/rooms/:id/clips          # List room clips
GET    /v1/clips/trending           # Trending clips
DELETE /v1/rooms/:id/clips/:clipId  # Delete clip
```

### GIFs

```
POST   /v1/rooms/:id/gif            # Create GIF from timestamp range
GET    /v1/rooms/:id/gifs           # Room GIFs gallery
DELETE /v1/rooms/:id/gifs/:gifId    # Delete GIF
```

---

## 7. Moderation & Admin API

### Room-Level Moderation (Host + Co-Host + Mods)

```
POST   /v1/rooms/:id/bans           # Ban user from room
DELETE /v1/rooms/:id/bans/:userId   # Unban from room
GET    /v1/rooms/:id/bans           # List room bans

POST   /v1/rooms/:id/warn           # Warn a user
POST   /v1/rooms/:id/clear-chat    # Clear entire chat
```

### Strike System (Admin)

```
POST   /v1/admin/users/:id/strike     # Give user a strike
DELETE /v1/admin/users/:id/strike/:id # Remove strike
GET    /v1/admin/users/:id/strikes    # View strikes
POST   /v1/admin/users/:id/auto-ban   # Auto-ban at 3 strikes (configurable)
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
GET    /v1/admin/dashboard              # Admin analytics dashboard
```

### Report Abuse

```
POST   /v1/reports                  # Report user/room/message
```

---

## 8. Analytics API

### Room Analytics

```
GET    /v1/analytics/rooms/:id      # Room stats (views, gifts, participants)
GET    /v1/analytics/rooms/:id/daily # Daily breakdown
```

### User Analytics

```
GET    /v1/analytics/users/me       # My creator stats
GET    /v1/analytics/users/me/earnings  # Earnings over time
GET    /v1/analytics/users/me/growth    # Follower growth
```

### Platform Analytics (Admin)

```
GET    /v1/admin/analytics/overview     # Platform-wide stats
GET    /v1/admin/analytics/top-rooms    # Top performing rooms
GET    /v1/admin/analytics/top-creators # Top creators
GET    /v1/admin/analytics/revenue      # Revenue report
```

---

## 9. WebRTC Signaling & Clips

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
| `FORBIDDEN` | 403 | No permission |
| `ROOM_NOT_FOUND` | 404 | Room doesn't exist |
| `ROOM_FULL` | 409 | All 4 slots occupied |
| `WRONG_PASSWORD` | 401 | Invalid room password |
| `RATE_LIMITED` | 429 | Too many requests |
| `USER_BANNED` | 403 | User is globally banned |
| `IP_BANNED` | 403 | IP is banned |
| `SLOT_TAKEN` | 409 | Slot already occupied |
| `INSUFFICIENT_FUNDS` | 402 | Not enough wallet balance |
| `SUBS_ONLY` | 403 | Room is subscriber-only |
| `2FA_REQUIRED` | 401 | Two-factor auth needed |
| `STRIKE_LIMIT_REACHED` | 403 | Auto-banned | 

## Rate Limiting

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1620000000
```

- **Standard:** 100 req/min per user
- **Chat (normal):** 30 req/min per room
- **Chat (slow mode):** Configurable by host (default 5s between messages)
- **Auth:** 10 req/min (OAuth attempts)
- **Signaling:** N/A (WebSocket, persistent)
