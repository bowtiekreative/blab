# Moderation System — Hustle Zone

## Three-Tier Governance

Hustle Zone has three layers of governance. See [Governance System](./governance.md) for full details.

```
Tier 0: Self (User)
  ├── Block user (hide their content globally for you)
  ├── Mute words/phrases (never see them in chat)
  └── Report user/room/message

Tier 1: Room-Level (Host + Co-Hosts + Moderators)
  ├── Kick from slot
  ├── Mute participant audio
  ├── Mute ALL guests (for voice notes / announcements)
  ├── Remove participant video
  ├── Warn user
  ├── Ban from room
  ├── Unban from room
  ├── Delete messages
  ├── Clear entire chat
  ├── Mute words in chat / transcript / both
  ├── Enable slow mode
  ├── Change room topic
  ├── Enable Q&A mode
  ├── Toggle 18+ restriction
  └── Set room to subs-only

Tier 2: Squad-Level (Super Admin + Admin + Moderator)
  ├── Mute words (squad-wide)
  ├── Set squad conduct rules
  ├── Kick from squad (simple, 1-click, no appeal)
  └── Invite / promote / demote members

Tier 3: Platform-Level (Admin Staff)
  ├── Issue strikes (1-3, auto-ban at 3)
  ├── Global user ban (cannot login)
  ├── Send user to JAIL (restricted access, can only appeal)
  ├── Release from jail
  ├── Block room (removed from search/discover)
  ├── Delete room permanently
  ├── Ban IP address
  ├── Review identity verification queue
  ├── View and resolve reports
  └── Update platform settings (age limits, rate limits, etc.)
```

## Permissions Matrix

| Action | Host | Co-Host | Mod | Viewers | Squad SA | Squad Admin | Squad Mod |
|--------|------|---------|-----|---------|----------|-------------|-----------|
| Kick from slot | ✅ | ✅ | ❌ | ❌ | — | — | — |
| Mute participant | ✅ | ✅ | ✅ | ❌ | — | — | — |
| Mute all guests | ✅ | ✅ | ✅ | ❌ | — | — | — |
| Remove video | ✅ | ✅ | ✅ | ❌ | — | — | — |
| Warn user | ✅ | ✅ | ✅ | ❌ | — | — | — |
| Room ban | ✅ | ✅ | ❌ | ❌ | — | — | — |
| Room unban | ✅ | ✅ | ❌ | ❌ | — | — | — |
| Delete message | ✅ | ✅ | ✅ | ❌ | — | — | — |
| Clear chat | ✅ | ✅ | ❌ | ❌ | — | — | — |
| Change room topic | ✅ | ❌ | ❌ | ❌ | — | — | — |
| Enable Q&A | ✅ | ❌ | ❌ | ❌ | — | — | — |
| Slow mode toggle | ✅ | ❌ | ❌ | ❌ | — | — | — |
| Toggle 18+ | ✅ | ❌ | ❌ | ❌ | — | — | — |
| Promote co-host | ✅ | ❌ | ❌ | ❌ | — | — | — |
| Promote mod | ✅ | ✅ | ❌ | ❌ | — | — | — |
| End room | ✅ | ❌ | ❌ | ❌ | — | — | — |
| Report | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Block user (self) | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Mute words (self) | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Kick from squad | — | — | — | — | ✅ | ✅ | ✅ |
| Edit squad settings | — | — | — | — | ✅ | ✅ | ❌ |
| Promote/demote | — | — | — | — | ✅ | ✅ | ❌ |
| Issue strike | — | — | — | — | ❌ | ❌ | ❌ |
| Global ban | — | — | — | — | ❌ | ❌ | ❌ |
| Send to jail | — | — | — | — | ❌ | ❌ | ❌ |

## Host Moderation Actions (Tier 1)

### Kick from Slot
- Removes participant from their carousel slot
- Slot goes empty, others can join or queue next

### Mute All Guests
- Available for **voice note playback** — host plays a voice note, mutes everyone so they can listen
- Visual indicator: "🎙️ Host is playing a voice note — guests are muted"

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

### Muted Words (Room)
- Words can be scoped to: **chat** (text messages), **transcript** (spoken ASR), or **all**
- Actions: **hide** (replace with [redacted]), **delete** (remove entire message), **flag** (notify host)

## Squad Moderation Actions (Tier 2)

See [Squads System](./squads.md) and [Governance System](./governance.md) for details.

Squad moderation is intentionally lightweight:
- No strikes, no warnings required
- One-click kick from squad
- Kicked users can be re-invited by an Admin

## Platform Moderation Actions (Tier 3)

### Strike System

| Strike | Consequence |
|--------|-------------|
| 1st | Warning + 72-hour chat mute |
| 2nd | 7-day account suspension |
| 3rd | Permanent ban |

### Jail System

See [Governance System - Jail](./governance.md#report--jail-pipeline) for full details.

| Capability | In Jail? |
|------------|----------|
| Login | ✅ |
| View dashboard | ✅ |
| Create rooms | ❌ |
| Join rooms | ❌ |
| Chat | ❌ |
| Send gifts | ❌ |
| Appeal | ✅ (once per 30 days) |

### Prohibited Content

| Category | Examples | Action |
|----------|----------|--------|
| **Racism** | Slurs, hate speech, racial superiority | Immediate ban |
| **Homophobia** | Anti-LGBTQ+ attacks, slurs | Immediate ban |
| **Illegal conduct** | Violence, drugs, CSAM, terrorism | Immediate ban + legal report |
| **Harassment** | Targeted abuse, stalking, doxxing | Strike → ban |
| **Spam** | Bot accounts, mass promotion | Immediate ban |
| **Impersonation** | Fake accounts | Strike → ban |
| **Ban evasion** | New account after ban | IP + device ban |
| **DDoS / malicious traffic** | Platform disruption | IP ban + Cloudflare |
| **Underage in 18+ rooms** | Minor in adult room | Account restriction |

## Auto-Moderation (Future)

- Profanity filter on chat messages
- Spam detection (rapid repeated messages)
- NSFW detection on uploaded avatars/video thumbnails
- Rate limiting at endpoint level
- Duplicate message detection
- DDoS mitigation via Cloudflare

## Reporting

```json
{
  "type": "user | room | message",
  "targetId": "uuid",
  "reason": "harassment | spam | nsfw | impersonation | hate_speech | violence | illegal | other",
  "description": "string (optional)"
}
```
