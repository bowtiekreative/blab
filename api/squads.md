# Squads System — Hustle Zone

> Squads are **label-based identity groups** that bind people together without fragmenting the community. Think of them like email lists + a badge. They give people identity and belonging without pulling users out of the open ecosystem.

---

## Core Concept

Squads are **labels** that group users. When a squad member goes live, all squad members get notified. You can see what squad someone belongs to. Squads don't control room access, moderation, or any gatekeeping — they're purely **identity + notification** tools.

### Design Principles

| Principle | Why |
|-----------|-----|
| **Visible identity** | Everyone can see your squad tag — builds brand |
| **Invite-only** | You cannot request to join; you must be invited |
| **No content gates** | Squads don't lock rooms or create exclusivity |
| **No private squad rooms** | All rooms are still public/accessible |
| **Notification-only** | The squad's main power is: "Your squadmate is live!" |

---

## Roles Hierarchy

```
Super Admin ─── Full control of squad settings
     │
     ▼
Admin ───────── Manage members, edit squad metadata
     │
     ▼
Moderator ───── Invite new members, kick for conduct
```

| Permission | Super Admin | Admin | Moderator | Member |
|------------|-------------|-------|-----------|--------|
| Edit squad name/description/branding | ✅ | ✅ | ❌ | ❌ |
| Promote members (any role below yours) | ✅ | ✅ | ❌ | ❌ |
| Demote members | ✅ | ✅ | ❌ | ❌ |
| Invite new members | ✅ | ✅ | ✅ | ❌ |
| Kick member for conduct | ✅ | ✅ | ✅ | ❌ |
| Delete squad | ✅ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |
| View squad analytics | ✅ | ✅ | ✅ | ✅ |
| Leave squad voluntarily | ✅ | ✅ | ✅ | ✅ |

---

## Squad Model

```json
{
  "id": "uuid",
  "name": "string (unique, e.g. 'The Beats', 'Creative Army')",
  "description": "string",
  "avatarUrl": "url",
  "coverUrl": "url",
  "brandColor": "hex color",
  "tagline": "string (short bio)",
  "memberCount": 0,
  "totalGoLiveAlerts": 0,
  "squadReputation": { "totalClaps": 0, "roomsHosted": 0 },
  "createdAt": "ISO8601",
  "createdBy": "uuid",

  "roles": {
    "superAdmin": ["uuid"],
    "admins": ["uuid"],
    "moderators": ["uuid"],
    "members": ["uuid"]
  },

  "settings": {
    "allowMemberInvites": false,
    "autoApproveInvites": true,
    "requireConductAgreement": true
  }
}
```

---

## API Endpoints

### CRUD

```
POST   /v1/squads                          # Create squad
GET    /v1/squads                          # List public squads (searchable)
GET    /v1/squads/:id                      # Get squad details
PATCH  /v1/squads/:id                      # Update squad (Super Admin / Admin)
DELETE /v1/squads/:id                      # Delete squad (Super Admin only)
```

### Membership

```
POST   /v1/squads/:id/invite              # Invite user to squad (invite-only)
GET    /v1/squads/:id/invites             # Pending invites (Admin+)
POST   /v1/squads/invite/:code/accept     # Accept invite
POST   /v1/squads/invite/:code/decline    # Decline invite
GET    /v1/squads/:id/members             # List all members
POST   /v1/squads/:id/leave               # Leave squad voluntarily
POST   /v1/squads/:id/kick/:userId        # Kick member (Moderator+)
```

### Roles

```
POST   /v1/squads/:id/promote/:userId     # Promote member (Super Admin / Admin)
POST   /v1/squads/:id/demote/:userId      # Demote member (Super Admin / Admin)
```

### Notifications (Go-Live)

```
POST   /v1/squads/:id/alert               # Manually trigger go-live alert
GET    /v1/squads/:id/alert-history       # Recent alerts
```

When any squad member goes live, the system automatically:
1. Sends **email notification** to all squad members: "🚀 @user from [Squad Name] is live!"
2. Shows squad badge on the user's carousel slot
3. Highlights the room in the squad's "Live Now" section

### Discovery

```
GET    /v1/squads/trending                # Squads with most live activity
GET    /v1/squads/:id/live-now            # Which squad members are live right now
GET    /v1/users/:id/squads               # User's squad memberships
```

---

## Squad Branding

Each squad has:
- **Name** (unique, max 30 chars)
- **Avatar** (uploaded image)
- **Cover image** (banner)
- **Brand color** (accent color used in UI)
- **Tagline** (max 100 chars)
- **Member badge** (shown next to username — "🏷️ [Squad Name]")

Squad badges appear:
- On user profiles
- Next to username in chat
- On the carousel slot during live rooms
- In the room participant list

---

## Squad Conduct

Squads have their own **conduct rules** (set by Super Admin):

| Rule | Description |
|------|-------------|
| **Words** | Squad-level muted words (messages containing these are auto-filtered) |
| **Behavior** | "Represent the squad brand" — vague by design, enforced by mods |
| **Consequence** | Simple: **kick from squad**. No appeals needed. Keep it simple. |

Squad conduct enforcement is intentionally **lightweight**:
- Moderator sees behavior issue → one-click kick from squad
- No strike system, no warnings required
- Squad is a privilege, not a right
- Kicked users can be re-invited later if issue resolved

---

## Squad Notifications

| Event | Notification | Delivery |
|-------|-------------|----------|
| Squad member goes live | "🚀 @username from [Squad Name] is live!" | Email + Push |
| You're invited to a squad | "You've been invited to [Squad Name]!" | Email + In-app |
| Squad is trending | "[Squad Name] is trending! 5 members live now!" | Push |


## Squad Governance (Second Tier)

Part of the three-tier platform governance system:

| Tier | Scope | What it controls |
|------|-------|-----------------|
| **Room** | Individual room | Words, chat, participant conduct |
| **Squad** | Squad membership | Squad words, squad conduct, brand representation |
| **Platform** | Entire platform | Racism, homophobia, illegal conduct, age limits, DDoS, malicious intent |
