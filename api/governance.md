# Governance System — Three Tiers

> Hustle Zone has **three levels of governance**: Room, Squad, and Platform. Each tier handles a specific scope of behavior with escalating severity.

---

## Architecture

```
                    ┌─────────────────────────────────────────────────────────────────┐
                    │                 PLATFORM GOVERNANCE (Admin Team)                  │
                    │  Racism, homophobia, illegal conduct, DDoS, malicious intent,    │
                    │  age restrictions, ban evasion, legal compliance                 │
                    │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
                    │  │  Strikes     │  │  Global Ban  │  │  IP/Device Fingerprint   │ │
                    │  │  (3 = ban)   │  │  + Takedown  │  │  + Rate Limiting         │ │
                    │  └─────────────┘  └──────────────┘  └──────────────────────────┘ │
                    └─────────────────────────────────────────────────────────────────┘
                                                    ▲
                              ┌─────────────────────┘
                              ▼
                    ┌─────────────────────────────────────────────────────────────────┐
                    │                 SQUAD GOVERNANCE (Squad Admins & Mods)            │
                    │  Squad-level muted words, squad conduct, brand representation    │
                    │  ┌─────────────────────┐  ┌────────────────────────────────────┐ │
                    │  │  Muted Words (Squad) │  │  Kick from Squad (simple, 1-click) │ │
                    │  └─────────────────────┘  └────────────────────────────────────┘ │
                    └─────────────────────────────────────────────────────────────────┘
                                                    ▲
                              ┌─────────────────────┘
                              ▼
                    ┌─────────────────────────────────────────────────────────────────┐
                    │                 ROOM GOVERNANCE (Host, Co-Host, Mod)              │
                    │  Room-specific rules, chat control, participant behavior         │
                    │  ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
                    │  │  Muted   │ │  Kick  │ │  Mute    │ │  Clear   │ │  Ban     │ │
                    │  │  Words   │ │  Slot  │ │  Audio   │ │  Chat    │ │  Room    │ │
                    │  └──────────┘ └────────┘ └──────────┘ └──────────┘ └──────────┘ │
                    └─────────────────────────────────────────────────────────────────┘
```

---

## Tier 1: Room Governance

**Who enforces:** Host, Co-Hosts, Room Moderators  
**Scope:** A single room  
**Consequences:** Kicked, muted, room-banned (can still access other rooms)

| Action | Who Can Do It | Description |
|--------|---------------|-------------|
| Mute words (room) | Host + Co-Host | Words that auto-delete from room chat |
| Kick from slot | Host + Co-Host | Remove from carousel |
| Mute participant audio | Host + Co-Host + Mod | Silence their mic |
| Remove participant video | Host + Co-Host + Mod | Hide their video feed |
| Warn user | Host + Co-Host + Mod | System notification |
| Ban from room | Host + Co-Host | Cannot rejoin this room |
| Unban from room | Host + Co-Host | Restore access |
| Delete message | Host + Co-Host + Mod | Remove specific message |
| Clear room chat | Host + Co-Host | Wipe recent messages |
| Change room topic | Host only | Update the room's current topic/Q&A focus |
| Enable slow mode | Host only | Limit message frequency |
| Set age restriction | Host only | 18+ toggle |
| Toggle recording consent | Host only | Block non-consenting users |

### Room Muted Words

```json
POST /v1/rooms/:id/muted-words
{
  "words": ["spam", "badword", "promo-link"],
  "scope": "chat",        // chat, transcript, or all
  "action": "hide"        // hide, delete, or flag
}
```

- Words can be banned in **chat only**, **transcript only** (spoken content via ASR), or **both**
- Hidden words are replaced with `[redacted]` — user is not notified
- Deleted words remove the entire message
- Flagged words go to the host for review

---

## Tier 2: Squad Governance

**Who enforces:** Squad Super Admin, Admin, Moderator  
**Scope:** Squad membership  
**Consequences:** Kicked from squad (simple, clean, final)

| Action | Who Can Do It | Description |
|--------|---------------|-------------|
| Set squad muted words | Super Admin + Admin | Words auto-filtered in squad context |
| Set squad conduct rules | Super Admin + Admin | Text rules members agree to |
| Kick from squad | Super Admin + Admin + Mod | Remove member (1-click, no appeal) |
| Silent member | Super Admin + Admin | Mute from squad chat |
| Invite new member | Super Admin + Admin + Mod | Add via invite code/link |

### Squad Conduct Philosophy

Squad enforcement is intentionally **lightweight**:
- No strike system
- No warnings required (though you can give one)
- **One click to kick** — "you're not representing the squad brand"
- Kicked members can be re-invited later by an Admin if resolved
- Squad is a privilege, not a right

---

## Tier 3: Platform Governance

**Who enforces:** Platform Admin Team (internal staff)  
**Scope:** Entire platform  
**Consequences:** Strikes, suspension, permanent ban, IP ban, legal escalation

| Action | Description |
|--------|-------------|
| Issue strike (1-3) | Written warning with escalation path |
| Auto-ban at 3 strikes | Permanent account termination |
| Global user ban | Cannot login, all sessions invalidated |
| IP/device ban | Prevents signup with new account |
| Block room | Remove from search/discovery |
| Delete room permanently | Remove all traces |
| Ban specific content | Remove message/clip/recording |
| Age enforcement | Block underage users from 18+ content |
| Legal compliance | DMCA takedown, law enforcement requests |
| DDoS mitigation | Rate limiting, traffic filtering, CDN protection |

### Platform Prohibited Content

| Category | Examples | Action |
|----------|----------|--------|
| **Racism** | Slurs, hate speech, racial superiority | Immediate ban |
| **Homophobia** | Anti-LGBTQ+ attacks, slurs | Immediate ban |
| **Illegal conduct** | Violence, drugs, CSAM, terrorism | Immediate ban + legal report |
| **Harassment** | Targeted abuse, stalking, doxxing | Strike → ban |
| **Spam** | Bot accounts, mass promotion | Immediate ban |
| **Impersonation** | Fake accounts pretending to be someone | Strike → ban |
| **Ban evasion** | New account after ban | IP + device ban |
| **DDoS / malicious traffic** | Intentional platform disruption | IP ban + Cloudflare mitigation |
| **Underage in 18+ rooms** | Minor in adult room | Parent notification + account restriction |

### Ages & Restrictions

| Age | Allowed |
|-----|---------|
| Under 13 | ❌ Not allowed (COPPA) |
| 13-17 | ✅ Standard rooms, no 18+ rooms |
| 18+ | ✅ Full access |

### Strike System

| Strike | Consequence |
|--------|-------------|
| 1st | Warning + 72-hour chat mute |
| 2nd | 7-day account suspension |
| 3rd | Permanent ban (all sessions invalidated) |

Strikes are permanent and visible on the admin dashboard.

---

## Report → Jail Pipeline

When a user is reported and the report is upheld:

```
User Reported ──> Admin Review ──> Report Upheld? ──> User goes to JAIL
                                        │                       │
                                        │                  Limited access:
                                        │                  - Cannot create rooms
                                        │                  - Cannot join rooms
                                        │                  - Cannot chat
                                        │                  - Can only appeal
                                        │                       │
                                        ▼                       ▼
                                  Report Dismissed         Appeal Process
                                  (no action)              (admin reviews)
```

### Jail Status

A user in "jail" has severely restricted access:

| Capability | In Jail? |
|------------|----------|
| Login | ✅ Yes |
| View dashboard | ✅ Yes |
| Create rooms | ❌ No |
| Join rooms | ❌ No |
| Chat | ❌ No |
| Send gifts | ❌ No |
| Appeal | ✅ Yes (one appeal per 30 days) |
| View appeal status | ✅ Yes |
| Contact support | ✅ Yes |

Jail is not permanent — users can appeal. But the bar for release is high.
