# Voice Notes — Hustle Zone

> Voice notes are **audio messages** sent in the room chat. The host or guest can play them for everyone in the room. This adds a rich communication layer beyond text chat and live audio.

---

## How Voice Notes Work

### Sending

1. A user in the room records a short voice message (max 60 seconds)
2. It appears in the chat as a playable audio bubble: 🎵 `@user played a voice note (0:23)`
3. The voice note is processed and stored as an audio file

### Playing

There are **three playback modes**:

#### 1. Self-Play (Default)
- The recipient listens on their own device
- Private, personal — like a regular voice message in WhatsApp/Telegram

#### 2. Host Plays for Room (Broadcast)
- **The host (or co-host) can play a voice note for the entire room**
- Everyone hears it through the room's audio stream
- Useful for: announcements, Q&A responses, sharing a hot take
- When playing: the host can **mute all guests** so they can listen without interruption
- **Visual:** A "Now Playing" indicator shows: `🎙️ Host is playing a voice note from @user`

#### 3. Guest Plays via Mic
- A guest plays their own voice note through their microphone
- Low-bandwidth alternative to live streaming
- Useful when: guest has poor internet, wants to pre-record a response

---

## Audio & Muting During Voice Notes

| Scenario | Behavior |
|----------|----------|
| Host plays voice note | Host can automatically mute all guests — they listen, not talk |
| Host plays voice note (no mute) | Guests can still talk over it like background |
| Guest plays via mic | Guest's mic becomes active, others can respond live |
| Guest sends voice note (self-play) | Only the recipient hears it — no room impact |

---

## Voice Note Chat Messages

```json
{
  "id": "uuid",
  "roomId": "uuid",
  "userId": "uuid",
  "type": "voice_note",
  "voiceNote": {
    "audioUrl": "https://cdn.hustlezone.app/voice-notes/uuid.mp3",
    "durationMs": 23000,
    "waveform": [0.1, 0.3, 0.5, 0.2, ...],   // visual waveform data
    "transcript": "Optional AI-generated text transcript",
    "isPlaying": false,
    "playedByHost": false
  },
  "createdAt": "ISO8601"
}
```

---

## API Endpoints

```
POST   /v1/rooms/:id/voice-notes              # Upload and send voice note
GET    /v1/rooms/:id/voice-notes              # List voice notes in room
DELETE /v1/rooms/:id/voice-notes/:noteId      # Delete own voice note

POST   /v1/rooms/:id/voice-notes/:noteId/play # Host plays for room
POST   /v1/rooms/:id/voice-notes/:noteId/stop # Stop playing
```

---

## Low Bandwidth Tips

Users flagged as "low bandwidth" get suggestions:

```json
POST /v1/users/me/connection-quality
{
  "quality": "fair",  // excellent, good, fair, poor
  "suggestion": "Try using voice notes instead of live streaming"
}
```

When the system detects poor connection:
- Show a tip: **"🎵 Low bandwidth? Send a voice note instead!"**
- Auto-suggest switching from live video to mic-only
- Show a "Record voice note" button prominently

---

## Consent & Recording

Voice notes are **not part of room recordings** — they're separate audio files. When a room is being recorded, voice notes are NOT included in the recording to protect privacy.

---

## Storage & Retention

| Dimension | Limit |
|-----------|-------|
| Max duration | 60 seconds |
| Max size | 5 MB per voice note |
| Retention | 30 days (auto-deleted from CDN) |
| Max per room per day | 50 voice notes (limits spam) |
| Storage | S3/MinIO with CDN delivery |
