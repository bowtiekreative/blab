# API Reference — Hustle Zone

Base URL: `https://api.hustlezone.app/v1`
WebSocket: `wss://api.hustlezone.app`

## Authentication

All API requests require a Bearer JWT token unless otherwise noted.

```
Authorization: Bearer <token>
```

---

## Core Domain Models

### User

```json
{
  "id": "uuid",
  "username": "string (unique)",
  "displayName": "string",
  "avatarUrl": "url (must be real person's face)",
  "bio": "string",
  "socialLinks": { "google": "id", "facebook": "id", "x": "id" },
  "reputation": { "followers": 0, "following": 0, "totalClaps": 0, "level": 1, "xp": 0 },
  "badges": ["early_adopter", "top_host", "gifter"],
  "squads": [{ "id": "uuid", "name": "string", "role": "super_admin|admin|moderator|member" }],
  "verificationLevel": "basic | verified | id_verified",
  "verificationStatus": "pending | approved | rejected",
  "isBanned": "boolean",
  "isInJail": "boolean",
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
  "privateRoomExpiresAt": "ISO8601 (null if public)",
  "isRecorded": "boolean",
  "recordingConsent": { "consenting": ["uuid"], "blocked": ["uuid"] },
  "isBanned": "boolean",
  "isScheduled": "boolean",
  "scheduledStartAt": "ISO8601",
  "scheduledEndAt": "ISO8601",
  "isPromo": "boolean",
  "isAdult": "boolean",
  "ageRestriction": "number (null if none)",
  "inviteCode": "string",
  "slots": {
    "total": 4,
    "filled": 0,
    "participants": [{
      "userId": "uuid",
      "username": "string",
      "squadName": "string (if applicable)",
      "slotIndex": 0-3,
      "isMuted": false,
      "isVideoOn": true,
      "claps": 0,
      "isTopClapped": false,
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
  "mutedWords": [{ "word": "string", "scope": "chat|transcript|all", "action": "hide|delete|flag" }],
  "currentTopic": "string",
  "qaEnabled": false,
  "screenshotBanEnabled": false,
  "lurkerPreventionEnabled": false,
  "settings": {
    "slowMode": false,
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
  "type": "text | gif | gift | system | poll | clip | sub | voice_note | welcome",
  "content": "string",
  "gifUrl": "url",
  "mentions": ["uuid"],
  "hashtags": ["string"],
  "gift": { "type": "string", "value": 0, "recipientId": "uuid" },
  "poll": { "id": "uuid", "question": "string", "options": [] },
  "voiceNote": { "audioUrl": "url", "durationMs": 0, "transcript": "string", "playedByHost": false },
  "welcomeEmoji": "string (👋)",
  "createdAt": "ISO8601"
}
```

---

## 1. Auth & Identity

```
POST   /v1/auth/oauth/:provider         # OAuth login (google, facebook, x)
POST   /v1/auth/refresh                 # Refresh JWT
POST   /v1/auth/logout                  # Invalidate session
GET    /v1/auth/me                      # Current user profile
POST   /v1/auth/2fa/enable              # Enable 2FA
POST   /v1/auth/2fa/disable             # Disable 2FA (requires code)
POST   /v1/auth/2fa/verify              # Verify 2FA code on login
```

### Identity Verification

```
POST   /v1/identity/upload-photo        # Upload profile photo (face required)
POST   /v1/identity/liveness            # Submit liveness selfie
POST   /v1/identity/verify-phone        # Send SMS code
POST   /v1/identity/confirm-phone       # Confirm SMS code
POST   /v1/identity/verify-age          # Submit DOB / upload ID
GET    /v1/identity/status              # Current verification level
```

---

## 2. Rooms API

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

### Private / Password Rooms (Paid — 5 Min Limit)

```
POST   /v1/rooms/:id/verify-password  # Join private room
POST   /v1/private-rooms              # Create paid private room (+99 ⏣ / $0.99)
PATCH  /v1/rooms/:id/extend-private   # Extend 5 more min (additional charge)
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
POST   /v1/rooms/:id/mute-all       # Mute ALL guests (for voice notes / announcements)
POST   /v1/rooms/:id/unmute-all     # Unmute all guests
```

### Room Settings & Topics

```
PATCH  /v1/rooms/:id/settings       # Update room settings (slow mode, etc.)
PATCH  /v1/rooms/:id/topic          # Change current room topic
PATCH  /v1/rooms/:id/muted-words    # Manage muted words (chat, transcript, or both)
POST   /v1/rooms/:id/adult-toggle   # Toggle 18+ room restriction
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
POST   /v1/rooms/:id/enable-lurker-prevention  # Paid: prevent lurkers (199 ⏣)
POST   /v1/rooms/:id/enable-screenshot-ban     # Paid: ban screenshots (149 ⏣)
```

### Recording Consent

```
POST   /v1/rooms/:id/consent          # Consent to being recorded
POST   /v1/rooms/:id/revoke-consent   # Revoke recording consent
POST   /v1/rooms/:id/block-non-consenting  # Block users who won't consent
GET    /v1/rooms/:id/consent-status   # Who has consented / been blocked
```

### Welcome Emoji

```
POST   /v1/rooms/:id/welcome/:userId  # Host sends welcome emoji to arriving guest
```

---

## 3. Promo Rooms

```
POST   /v1/rooms/promo                    # Create promo room (charged 999 ⏣)
GET    /v1/rooms/promo/schedule           # Upcoming promo rooms
GET    /v1/rooms/promo/:id/qa             # Q&A for promo room
POST   /v1/rooms/promo/:id/qa             # Submit Q&A question
POST   /v1/rooms/promo/:id/qa/:qid/answer # Answer Q&A (host only)
POST   /v1/rooms/promo/:id/rate           # Rate promo room (1-5)
POST   /v1/rooms/promo/:id/screenshare    # Start screen share (host only)
```

---

## 4. Chat, Voice Notes & Reactions

```
GET    /v1/rooms/:id/messages       # Chat history (paginated)
POST   /v1/rooms/:id/messages       # Send text message
POST   /v1/rooms/:id/gif            # Send GIF (via GIPHY/Tenor)
DELETE /v1/rooms/:id/messages/:mid  # Delete message

POST   /v1/rooms/:id/voice-notes              # Upload and send voice note
GET    /v1/rooms/:id/voice-notes              # List voice notes in room
DELETE /v1/rooms/:id/voice-notes/:noteId      # Delete own voice note
POST   /v1/rooms/:id/voice-notes/:noteId/play # Host plays for room (mutes guests)
POST   /v1/rooms/:id/voice-notes/:noteId/stop # Stop playing
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

## 5. Clap System & Tokens

### Claps

```
POST   /v1/rooms/:id/clap                # Clap for a participant (free)
POST   /v1/rooms/:id/clap-tokens         # Clap using ⏣ tokens
GET    /v1/rooms/:id/clap-leaderboard    # Top clapped in room
GET    /v1/rooms/:id/claps/:userId       # User's claps in this room
```

### Tokens

```
GET    /v1/tokens/balance                # Token balance
GET    /v1/tokens/transactions           # Token transaction history
GET    /v1/tokens/earnings-history       # How you earned tokens (breakdown)
POST   /v1/tokens/purchase               # Buy tokens (Stripe)
POST   /v1/tokens/convert-to-cash        # Cash out tokens
GET    /v1/tokens/exchange-rate          # Current exchange rate (100 ⏣ = $1)
```

---

## 6. Gifting & Monetization

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

## 7. User API

```
GET    /v1/users/:id                 # Get user profile
PATCH  /v1/users/me                  # Update my profile
POST   /v1/users/me/avatar           # Upload avatar (face required)
DELETE /v1/users/me                  # Delete account (GDPR)
GET    /v1/users/me/export           # Export my data (GDPR)
GET    /v1/users/:id/rooms           # User's rooms (hosted)
GET    /v1/users/:id/squads          # User's squad memberships
```

### Connection Quality

```
POST   /v1/users/me/connection-quality  # Report connection quality
GET    /v1/users/me/connection-tips     # Get bandwidth tips (voice notes etc.)
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

## 8. Squads API

```
POST   /v1/squads                          # Create squad
GET    /v1/squads                          # List public squads
GET    /v1/squads/:id                      # Get squad details
PATCH  /v1/squads/:id                      # Update squad
DELETE /v1/squads/:id                      # Delete squad
POST   /v1/squads/:id/invite              # Invite user
GET    /v1/squads/:id/invites             # Pending invites
POST   /v1/squads/invite/:code/accept     # Accept invite
POST   /v1/squads/invite/:code/decline    # Decline invite
GET    /v1/squads/:id/members             # List members
POST   /v1/squads/:id/leave               # Leave squad
POST   /v1/squads/:id/kick/:userId        # Kick member
POST   /v1/squads/:id/promote/:userId     # Promote member
POST   /v1/squads/:id/demote/:userId      # Demote member
GET    /v1/squads/trending                # Trending squads
GET    /v1/squads/:id/live-now            # Squad members live now
GET    /v1/squads/:id/alert-history       # Go-live alert history
```

---

## 9. Notifications API

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
| `clap` | Someone claps for you (surge) | Push + in-app |
| `clap_spike` | Your claps are blowing up | Push + in-app |
| `room_trending` | Your room is trending | Push + in-app |
| `sub_gifted` | Someone subs to you | Push + in-app |
| `scheduled_room` | A room you follow is starting soon | Push + in-app |
| `poll_created` | Poll in room you're in | In-app only |
| `squad_go_live` | Squad member goes live | **Email** + Push |
| `squad_invite` | You're invited to a squad | **Email** + In-app |
| `voice_note_played` | Host plays your voice note for room | In-app |
| `welcome_received` | Host welcomed you with emoji | In-app |
| `promo_room_start` | A promo room you're interested in starts | Push + in-app |
| `jailed` | You've been sent to jail | In-app |
| `jail_appeal_update` | Your jail appeal status | In-app |

---

## 10. Recording, Clips, GIFs & Teasers

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

### Teasers (Going Live Promo)

```
POST   /v1/rooms/:id/teaser         # Generate teaser GIF/reel for going live
GET    /v1/rooms/:id/teasers        # Existing teasers
DELETE /v1/rooms/:id/teasers/:id    # Delete teaser
```

---

## 11. Moderation & Governance

### Report → Jail Pipeline

```
POST   /v1/reports                          # Report user/room/message
GET    /v1/reports/:id                      # Report status
```

### Room-Level Governance

```
POST   /v1/rooms/:id/bans           # Ban user from room
DELETE /v1/rooms/:id/bans/:userId   # Unban from room
GET    /v1/rooms/:id/bans           # List room bans
POST   /v1/rooms/:id/warn           # Warn a user
POST   /v1/rooms/:id/clear-chat    # Clear entire chat
```

### Squad-Level Governance

```
POST   /v1/squads/:id/muted-words   # Add squad muted word
DELETE /v1/squads/:id/muted-words/:word  # Remove squad muted word
PATCH  /v1/squads/:id/conduct       # Update squad conduct rules
```

### Platform Governance

```
POST   /v1/admin/users/:id/strike         # Issue strike
DELETE /v1/admin/users/:id/strike/:sid    # Remove strike
GET    /v1/admin/users/:id/strikes        # View strikes
POST   /v1/admin/users/:id/ban            # Ban user globally
POST   /v1/admin/users/:id/unban          # Unban user
POST   /v1/admin/users/:id/send-to-jail   # Send to jail
POST   /v1/admin/users/:id/release-from-jail # Release from jail
POST   /v1/admin/rooms/:id/block          # Block room
POST   /v1/admin/rooms/:id/unblock        # Unblock room
DELETE /v1/admin/rooms/:id                # Delete room permanently
POST   /v1/admin/ips/:ip/ban              # Ban IP address
DELETE /v1/admin/ips/:ip/ban              # Unban IP
GET    /v1/admin/reports                  # List reports
POST   /v1/admin/reports/:id/resolve      # Resolve report
GET    /v1/admin/jail                     # List jailed users
GET    /v1/admin/jail/appeals             # Pending appeals
POST   /v1/admin/jail/appeals/:id/approve # Approve release
POST   /v1/admin/jail/appeals/:id/deny    # Deny appeal
```

### Identity Moderation

```
GET    /v1/admin/identity/pending         # Pending verifications
POST   /v1/admin/identity/approve/:id     # Approve verification
POST   /v1/admin/identity/reject/:id      # Reject verification
GET    /v1/admin/identity/flags           # Flagged profiles
```

---

## 12. Admin Dashboards

```
GET    /v1/admin/dashboard                # Platform overview metrics
GET    /v1/admin/users                    # List all users (paginated)
GET    /v1/admin/users/:id                # User detail
GET    /v1/admin/rooms                    # List rooms
GET    /v1/admin/analytics/overview       # Platform analytics
GET    /v1/admin/analytics/top-rooms      # Top rooms
GET    /v1/admin/analytics/top-creators   # Top creators
GET    /v1/admin/analytics/revenue        # Revenue report
POST   /v1/admin/settings                 # Update platform settings

GET    /v1/squads/:id/dashboard           # Squad dashboard
GET    /v1/squads/:id/analytics           # Squad analytics

GET    /v1/rooms/:id/dashboard            # Room overview (host)
GET    /v1/rooms/:id/analytics            # Room analytics
```

---

## 13. WebRTC Signaling & Clips

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
    "code": "VALIDATION_ERROR",
    "message": "Profile photo must show a face",
    "details": { ... }
  }
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthorized (missing/invalid JWT) |
| 403 | Forbidden (insufficient permissions, not verified, in jail) |
| 404 | Not found |
| 409 | Conflict (duplicate username, already in room) |
| 422 | Unprocessable (photo doesn't contain a face, underage) |
| 429 | Rate limited |
| 500 | Server error |
