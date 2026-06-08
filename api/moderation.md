# Moderation System — Hustle Zone

## Moderation Layers

```
Layer 0: Self (User)
  ├── Block user (hide their content globally for you)
  ├── Mute words/phrases (never see them in chat)
  └── Report user/room/message

Layer 1: Room-Level (Host + Co-Hosts + Moderators)
  ├── Kick from slot
  ├── Mute participant
  ├── Remove participant video
  ├── Warn user
  ├── Ban from room
  ├── Unban from room
  ├── Delete messages
  ├── Clear entire chat
  ├── Enable slow mode
  └── Set room to subs-only

Layer 2: Admin (Platform Staff)
  ├── Issue strikes (1-3, auto-ban at 3)
  ├── Global user ban (cannot login)
  ├── Block room (removed from search/discover)
  ├── Ban IP address
  ├── Delete room permanently
  ├── Remove strikes
  ├── View reports dashboard
  └── Resolve reports
```

## Permissions Matrix

| Action | Host | Co-Host | Mod | Viewer |
|--------|------|---------|-----|--------|
| Kick from slot | ✅ | ✅ | ❌ | ❌ |
| Mute participant | ✅ | ✅ | ✅ | ❌ |
| Remove video | ✅ | ✅ | ✅ | ❌ |
| Warn user | ✅ | ✅ | ✅ | ❌ |
| Room ban | ✅ | ✅ | ❌ | ❌ |
| Delete message | ✅ | ✅ | ✅ | ❌ |
| Clear chat | ✅ | ✅ | ❌ | ❌ |
| Slow mode toggle | ✅ | ❌ | ❌ | ❌ |
| Promote co-host | ✅ | ❌ | ❌ | ❌ |
| Promote mod | ✅ | ✅ | ❌ | ❌ |
| End room | ✅ | ❌ | ❌ | ❌ |
| Report | ✅ | ✅ | ✅ | ✅ |
| Block user (self) | ✅ | ✅ | ✅ | ✅ |
| Mute words (self) | ✅ | ✅ | ✅ | ✅ |

## Host Moderation Actions (Layer 1)

### Kick from Slot
- Removes participant from their carousel slot
- Slot goes empty, others can join or queue next

### Room Ban
- Kicked user cannot rejoin this room
- Stored in `room_bans` table
- Host/co-host can unban later

### Warn
- User receives a system message + in-app notification
- Visible in room as: `[System] @user has been warned`

### Clear Chat
- Deletes all recent messages (last 5 min) from room
- System message shows: `Chat has been cleared`

## Strike System (Layer 2)

- Admin issues strikes for serious violations
- 3 strikes = automatic permanent ban
- Strikes have a reason recorded
- Admin can remove strikes on appeal

| Strike | Consequence |
|--------|-------------|
| 1st | Warning + 24h mute |
| 2nd | 7-day suspension |
| 3rd | Permanent ban |

## Auto-Moderation (Future)

- Profanity filter on chat messages
- Spam detection (rapid repeated messages)
- NSFW detection on uploaded avatars/video thumbnails
- Rate limiting at endpoint level
- Duplicate message detection

## Reporting

```json
{
  "type": "user | room | message",
  "targetId": "uuid",
  "reason": "harassment | spam | nsfw | impersonation | hate_speech | violence | other",
  "description": "string (optional)"
}
```
