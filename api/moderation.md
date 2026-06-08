# Moderation System — Hustle Zone

## Moderation Layers

```
Layer 1: Room-Level (Host)
  ├── Kick from slot
  ├── Mute participant
  ├── Remove participant video
  ├── Ban from room
  └── Delete messages

Layer 2: User-Level (Self)
  ├── Block user (hide their content globally for you)
  └── Report user/room/message

Layer 3: Global (Admin)
  ├── Ban user (cannot login)
  ├── Block room (removed from search/discover)
  ├── Ban IP address
  ├── Delete room permanently
  └── Resolve reports
```

## Host Moderation Actions (Layer 1)

### Kick from Slot
- Removes participant from their carousel slot
- Slot goes empty, others can join
- Kicked user can re-request (no cooldown by default)

### Room Ban
- Kicked user **cannot** rejoin this room
- Stored in `room_bans` table
- Host can unban later

### Room Ban Cooldown
- No time limit — ban is permanent until removed
- Host can see list of banned users and unban

## User-to-User Blocking (Layer 2)

- Blocks are **one-way** — user A blocks user B
- Blocked user cannot:
  - @mention the blocker
  - Send messages visible to the blocker
  - Request slots in rooms where blocker is host
- The blocker never sees content from blocked user
- Stored in `user_blocks` table

## Admin Tools (Layer 3)

### Global User Ban
- User cannot authenticate
- Active sessions invalidated immediately
- Cannot create rooms or join rooms
- Optional reason stored for reference

### Room Blocking
- Room removed from search results
- Blocked rooms still accessible via direct link (for existing members)
- Can be unblocked later

### IP Banning
- Applied at API gateway level
- Blocks all requests from that IP
- Used for persistent offenders, bots, DDOS

## Auto-Moderation (Future)

- Profanity filter on chat messages
- Spam detection (rapid repeated messages)
- NSFW detection on uploaded avatars/video thumbnails
- Rate limiting at endpoint level

## Reporting

```json
{
  "type": "user | room | message",
  "targetId": "uuid",
  "reason": "harassment | spam | nsfw | impersonation | other",
  "description": "string (optional)"
}
```
