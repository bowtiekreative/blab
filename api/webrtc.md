# WebRTC Flow — 4-Person Carousel

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Hustle Zone Client                    │
│  Browser WebRTC API  ◄──  MediaStream (cam + mic)       │
└───────────────┬───────────────┬───────────────┬──────────┘
                │               │               │
           Publish          Subscribe         Data
         (Send video)     (Receive 4 videos)  Channel
                │               │               │
┌───────────────▼───────────────▼───────────────▼──────────┐
│              LiveKit Server (WebRTC SFU)                  │
│   Selective Forwarding Unit — routes tracks per slot     │
│   Manages: room participants, tracks, permissions        │
└──────────────────────────────────────────────────────────┘
```

## The 4-Person Carousel

This is Hustle Zone's signature feature — exactly **4 visible participant slots** on screen at once, like the original Blab.

### Slot Model

```
┌──────────────┐  ┌──────────────┐
│   Slot 0     │  │   Slot 1     │
│  (Top-Left)  │  │  (Top-Right) │
├──────────────┤  ├──────────────┤
│   Slot 2     │  │   Slot 3     │
│  (Bot-Left)  │  │  (Bot-Right) │
└──────────────┘  └──────────────┘

┌──────────────────────────────────┐
│      Viewers (carousel below)    │
│  Face bubbles of visible viewers │
│  + lurker count (e.g. "23 👁️")   │
└──────────────────────────────────┘
```

### Slot States

| State | Description |
|-------|-------------|
| `empty` | No participant, shows dark tile + "Join" button |
| `joining` | User requesting slot, brief transition |
| `active` | Participant broadcasting video/audio |
| `muted` | Participant visible but audio off |
| `video_off` | Participant audio only, avatar shown |
| `kicked` | Recently kicked, slot blocked briefly |

### Room Capacity

- **4** broadcasting slots (the carousel)
- **Unlimited** viewers (visible, with faces in viewer strip)
- **Unlimited** lurkers (hidden, only count shown)

## Signaling Flow

### 1. Joining a Room as Viewer

```
Client                          Server/ LiveKit
  │                                 │
  │──── POST /rooms/:id/enter ──────│  (visible = true)
  │◄──── { room, liveKitToken } ────│
  │                                 │
  │──── Connect to LiveKit ─────────│
  │◄──── Subscribed to room tracks ─│
  │                                 │
  │──── Subscribe to all 4 slot     │
  │     participant video tracks    │
  │                                 │
```

### 2. Taking a Slot (Becoming a Broadcaster)

```
Client                          Server/ LiveKit
  │                                 │
  │──── POST /rooms/:id/join-slot ──│  { slotIndex: 0-3 }
  │◄──── { slotIndex, liveKitToken }│  (new token with publish perms)
  │                                 │
  │──── Disconnect old session      │
  │──── Reconnect to LiveKit        │
  │──── Publish camera + mic tracks │  to assigned slot
  │──── Subscribe to other 3 slots  │
  │                                 │
  │──── WS: participant_joined ─────│  Broadcast to room
  │                                 │
```

### 3. Swapping Slots

```
Client                          Server/ LiveKit
  │                                 │
  │──── POST /rooms/:id/swap-slot ──│  { toSlotIndex: 2 }
  │◄──── { slotIndex: 2 } ──────────│
  │──── Unpublish from old slot     │
  │──── Publish to new slot         │
  │                                 │
  │──── WS: slot_changed ───────────│  Broadcast to room
  │                                 │
```

### 4. Host Kicking from a Slot

```
Host Client                     Server
  │                                 │
  │──── POST /rooms/:id/kick ───────│  { userId, slotIndex }
  │◄──── 200 OK ────────────────────│
  │                                 │
  │──── WS: participant_kicked ─────│  → Kicked user
  │──── WS: slot_freed ─────────────│  → All viewers
  │                                 │
  │     LiveKit: Server revokes     │
  │     participant's publish perms │
  │                                 │
```

## LiveKit Configuration

```yaml
# livekit.yaml
port: 7880
rtc:
  port_range: 50000-60000
  tcp_port: 7881
  use_external_ip: true

room:
  max_participants: 100  # includes viewers
  empty_timeout: 300     # 5 min

webhook:
  url: http://api:3000/v1/webhooks/livekit
```

## Client-Side Implementation (React)

```tsx
// Hook for managing a single slot
function useSlot(roomId: string, slotIndex: number | null) {
  // Returns: { isInSlot, joinSlot, leaveSlot, swapSlot, videoRef, audioRef }
}

// The 4-panel carousel component
function Carousel({ roomId }: { roomId: string }) {
  // Renders 4 SlotPanel components in a 2x2 grid
  // Each SlotPanel shows the participant's video or empty state
  // Below: viewer face bubbles + lurker count
}
```

## Data Channel Messages

Sent over WebRTC DataChannel for low-latency room events:

| Message | Direction | Purpose |
|---------|-----------|---------|
| `clap` | Any → Server | Clap for participant |
| `reaction` | Any → Room | Quick emoji reaction (fire, heart, laugh) |
| `slot_request` | Viewer → Host | Request to join slot |
| `slot_offer` | Host → Viewer | Offer a slot |

## Media Constraints

```json
{
  "video": {
    "width": { "ideal": 1280 },
    "height": { "ideal": 720 },
    "frameRate": { "ideal": 30 }
  },
  "audio": {
    "echoCancellation": true,
    "noiseSuppression": true
  }
}
```
