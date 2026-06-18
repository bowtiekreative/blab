# WebSocket Events — Hustle Zone

**Endpoint:** `wss://api.hustlezone.app`
**Auth:** JWT token sent in connection query: `wss://api.hustlezone.app?token=<jwt>`

## Connection Lifecycle

```
1. Client connects with JWT
2. Server validates token, assigns userId
3. Client joins room: { type: "join_room", roomId: "uuid" }
4. Server subscribes client to room events
5. Client receives room_state snapshot
6. Client receives live events
```

---

## Client → Server Events

### Room Events

```json
{ "type": "join_room", "roomId": "uuid" }
{ "type": "leave_room", "roomId": "uuid" }
{ "type": "enter_room", "roomId": "uuid", "visible": true }
// vs
{ "type": "lurk_room", "roomId": "uuid" }
```

### Chat Events

```json
{ "type": "send_message", "roomId": "uuid", "content": "string" }
{ "type": "send_gif", "roomId": "uuid", "gifUrl": "url" }
{ "type": "delete_message", "roomId": "uuid", "messageId": "uuid" }
```

### @Mention — Triggers Push Notification

```json
{
  "type": "send_message",
  "roomId": "uuid",
  "content": "hey @john check this out",
  "mentions": ["user-id-of-john"]
}
```

### Gift Event

```json
{
  "type": "send_gift",
  "roomId": "uuid",
  "giftType": "crown | heart | rocket | fire | diamond",
  "recipientId": "uuid",
  "quantity": 1
}
```

### Interaction Events

```json
{ "type": "clap", "roomId": "uuid", "targetUserId": "uuid" }
{ "type": "react", "roomId": "uuid", "emoji": "🔥" }
```

### Slot Events

```json
{ "type": "join_slot", "roomId": "uuid", "slotIndex": 0 }
{ "type": "leave_slot", "roomId": "uuid" }
{ "type": "swap_slot", "roomId": "uuid", "toSlotIndex": 2 }
{ "type": "toggle_mute", "roomId": "uuid" }
{ "type": "toggle_video", "roomId": "uuid" }
```

### Typing Indicator

```json
{ "type": "typing", "roomId": "uuid", "isTyping": true }
```

---

## Server → Client Events

### Room State (on join)

```json
{
  "type": "room_state",
  "room": {
    "id": "uuid",
    "name": "string",
    "host": { "id": "uuid", "username": "string", "avatar": "url" },
    "slots": [
      { "index": 0, "user": { ... } | null, "isMuted": false, "isVideoOn": true },
      { "index": 1, ... },
      { "index": 2, ... },
      { "index": 3, ... }
    ],
    "viewerCount": 42,
    "lurkerCount": 15,
    "recentMessages": [],
    "hashtags": ["string"]
  }
}
```

### Chat Messages

```json
{
  "type": "new_message",
  "message": {
    "id": "uuid",
    "userId": "uuid",
    "username": "string",
    "avatarUrl": "url",
    "content": "string",
    "type": "text | gif | gift | system",
    "gifUrl": "url",
    "mentions": ["uuid"],
    "gift": { "type": "string", "value": 0, "recipientName": "string" },
    "createdAt": "ISO8601"
  }
}
```

### Participant Events

```json
{ "type": "participant_joined", "userId": "uuid", "username": "string", "slotIndex": 0 }
{ "type": "participant_left", "userId": "uuid", "slotIndex": 0 }
{ "type": "participant_kicked", "userId": "uuid", "slotIndex": 0, "reason": "string" }
{ "type": "slot_changed", "userId": "uuid", "fromSlot": 0, "toSlot": 2 }
{ "type": "slot_freed", "slotIndex": 0 }
```

### Viewer Events

```json
{ "type": "viewer_entered", "userId": "uuid", "username": "string", "avatarUrl": "url" }
{ "type": "viewer_left", "userId": "uuid" }
{ "type": "lurker_count_updated", "count": 15 }
```

### Interaction Broadcasts

```json
{ "type": "clap_received", "fromUserId": "uuid", "targetUserId": "uuid", "totalClaps": 142 }
{ "type": "reaction", "userId": "uuid", "emoji": "🔥" }
{ "type": "gift_sent", "giftType": "crown", "fromUser": "string", "toUser": "string", "value": 500 }
```

### Notification Events

```json
{ "type": "mention", "fromUserId": "uuid", "fromUsername": "string", "roomId": "uuid", "message": "hey @you check this" }
{ "type": "notification", "notification": { "id": "uuid", "type": "string", "title": "string", "body": "string" } }
```

### System Events

```json
{ "type": "room_ended", "reason": "host_ended" }
{ "type": "room_banned", "reason": "violation of terms" }
{ "type": "room_recording_started" }
{ "type": "room_recording_stopped" }
{ "type": "user_banned_from_room", "reason": "string" }
{ "type": "error", "code": "string", "message": "string" }
```

### Typing Indicators

```json
{ "type": "typing", "roomId": "uuid", "userId": "uuid", "username": "string", "isTyping": true }
```
