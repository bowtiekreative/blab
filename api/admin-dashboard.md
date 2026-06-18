# Admin Dashboard — Hustle Zone

> Comprehensive management dashboards for Platform Admins. Three levels: Platform Admin, Squad Admin, and Room Host dashboards.

---

## Dashboard Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│               PLATFORM ADMIN DASHBOARD                   │
│  (Full access — everything)                             │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────┐  ┌───────────────────────────┐   │
│  │  SQUAD DASHBOARDS  │  │  ROOM DASHBOARDS          │   │
│  │  (Per Squad)       │  │  (Per Room / Per User)    │   │
│  └───────────────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Platform Admin Dashboard

### 1. Overview (Home)

| Metric | Description |
|--------|-------------|
| **Total Users** | Registered + verified users |
| **Daily Active Users (DAU)** | Users who logged in today |
| **Monthly Active Users (MAU)** | Users who logged in this month |
| **Rooms Created Today** | Including standard + promo |
| **Currently Live** | Rooms broadcasting right now |
| **Total Revenue (MTD)** | Monthly-to-date platform revenue |
| **Tokens in Circulation** | Total ⏣ tokens purchased + earned |
| **Avg Session Duration** | Average time users spend per session |
| **Report Queue** | Unresolved reports count |
| **Jail Population** | Users currently in jail |

### 2. User Management

```
┌─────────────────────────────────────────────────────────────────┐
│ Users                                                        │
│ ┌──────┬──────────┬────────┬───────┬──────┬────────┬────────┐ │
│ │ User │ Email    │ Status │ Level │ #Rep │ Joined │ Action │ │
│ ├──────┼──────────┼────────┼───────┼──────┼────────┼────────┤ │
│ │ ...  │ ...      │ ✅     │ 5     │ 0    │ ...    │ ⚙️     │ │
│ └──────┴──────────┴────────┴───────┴──────┴────────┴────────┘ │
│                                                                 │
│ Filters: Status (Active | Banned | Suspended | Jail | Pending) │
│ Search: Name, Email, Phone, Squad                               │
│ Bulk Actions: Ban, Suspend, Verify, Clear Strikes               │
└─────────────────────────────────────────────────────────────────┘
```

**User Detail View:**
- Profile info (photo, bio, DOB)
- Verification level
- Squad memberships
- Room history (hosted, participated)
- Token balance + transaction history
- Strikes (with reason and issuing admin)
- Reports filed against this user
- IP addresses + device fingerprints
- Account status controls (warn, strike, suspend, ban)

### 3. Room Management

```
┌─────────────────────────────────────────────────────────────────┐
│ Live Rooms                                                    │
│ ┌──────┬──────────┬────────┬────────┬──────┬────────┬────────┐ │
│ │ Room │ Host     │ Type   │ Live   │ View │ Squad  │ Action │ │
│ ├──────┼──────────┼────────┼────────┼──────┼────────┼────────┤ │
│ │ ...  │ ...      │ Std    │ 🔴 2h  │ 1.2K │ ...    │ ⚙️     │ │
│ └──────┴──────────┴────────┴────────┴──────┴────────┴────────┘ │
│                                                                 │
│ Tabs: Live | Scheduled | Recent (24h) | Blocked | Promo        │
│ Actions per room: View, Block, Ban Host, End Room, Delete      │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Reports & Jail Management

```
┌─────────────────────────────────────────────────────────────────┐
│ Reports Queue                          Pending: 12             │
│ ┌──────┬──────────┬────────┬────────┬────────┬────────┬───────┐│
│ │ #    │ Reporter │ Target │ Reason │ Room   │ Status │ Actn  ││
│ ├──────┼──────────┼────────┼────────┼────────┼────────┼───────┤│
│ │ ...  │ ...      │ ...    │ ...    │ ...    │ Pending│ ⚙️    ││
│ └──────┴──────────┴────────┴────────┴────────┴────────┴───────┘│
│                                                                 │
│ Actions: Send to Jail | Dismiss | Strike User | Ban User       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Jail Population                          Currently: 8           │
│ ┌──────┬──────────┬──────────┬────────┬────────┬──────────────┐│
│ │ User │ In Jail  │ Reason   │ By     │ Appeal │ Days Left   ││
│ ├──────┼──────────┼──────────┼────────┼────────┼──────────────┤│
│ │ ...  │ 3d ago   │ ...      │ ...    │ ✅ Yes │ Unlimited   ││
│ └──────┴──────────┴──────────┴────────┴────────┴──────────────┘│
│                                                                 │
│ Actions: Release from Jail | Convert to Ban | Adjust Sentence  │
│ Appeal queue shows pending appeals from jailed users           │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Strikes & Bans

```
┌─────────────────────────────────────────────────────────────────┐
│ Strikes Management                                            │
│ ┌──────┬──────────┬──────────┬────────┬────────┬──────────────┐│
│ │ User │ Strikes  │ Last     │ Reason │ Issued │ Expires      ││
│ ├──────┼──────────┼──────────┼────────┼────────┼──────────────┤│
│ │ ...  │ 2/3      │ 5d ago   │ ...    │ Admin  │ Never        ││
│ └──────┴──────────┴──────────┴────────┴────────┴──────────────┘│
│                                                                 │
│ Bans (Global)                IP Bans                            │
│ ┌──────┬────────┬────────┐  ┌──────┬────────┬───────────────┐ │
│ │ User │ Reason │ Date   │  │ IP   │ Reason │ Date          │ │
│ ├──────┼────────┼────────┤  ├──────┼────────┼───────────────┤ │
│ │ ...  │ ...    │ ...    │  │ ...  │ ...    │ ...           │ │
│ └──────┴────────┴────────┘  └──────┴────────┴───────────────┘ │
│                                                                 │
│ Bulk import ban lists (known email domains, IP ranges, etc.)   │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Token & Revenue Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Revenue Overview                            MTD: $XX,XXX       │
│ ┌─────────────┬──────────┬──────────┬──────────┬─────────────┐│
│ │ Category    │ Volume   │ Platform │ Creator  │ Growth      ││
│ ├─────────────┼──────────┼──────────┼──────────┼─────────────┤│
│ │ Token Sales │ $XX,XXX  │ $X,XXX   │ $X,XXX   │ +XX%       ││
│ │ Gifts       │ $XX,XXX  │ $X,XXX   │ $X,XXX   │ +XX%       ││
│ │ Subs        │ $XX,XXX  │ $X,XXX   │ $X,XXX   │ +XX%       ││
│ │ Promo Rooms │ $XX,XXX  │ $X,XXX   │ $X,XXX   │ +XX%       ││
│ │ Cash Out    │ $XX,XXX  │ $X,XXX   │ —        │ +XX%       ││
│ └─────────────┴──────────┴──────────┴──────────┴─────────────┘│
│                                                                 │
│ Charts: Revenue over time (7d, 30d, 90d)                       │
│         Token circulation rate                                  │
│         Top spending users                                      │
│         Top earning creators                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 7. Identity Verification Queue

```
┌─────────────────────────────────────────────────────────────────┐
│ Identity Verification Pending                  Pending: 23      │
│ ┌──────┬──────────┬──────────┬────────┬──────────────────────┐ │
│ │ User │ Photo    │ Liveness │ Phone  │ Actions              │ │
│ ├──────┼──────────┼──────────┼────────┼──────────────────────┤ │
│ │ ...  │ ✅       │ ❌       │ ✅    │ [Approve] [Reject]    │ │
│ └──────┴──────────┴──────────┴────────┴──────────────────────┘ │
│                                                                 │
│ Tabs: Pending | Flagged (AI low confidence) | Approved | Rej   │
└─────────────────────────────────────────────────────────────────┘
```

### 8. Security & Monitoring

```
┌─────────────────────────────────────────────────────────────────┐
│ Security Dashboard                                             │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ ⚠️ DDoS detected: 12.3K requests from IP pool XX.XX.XX    ││
│ │   Status: Mitigated by Cloudflare                           ││
│ │                                                             ││
│ │ ⚠️ 3 users flagged for possible ban evasion (device match)  ││
│ │                                                             ││
│ │ 📊 API Rate Limit Stats:                                    ││
│ │   - Total requests (24h): 1.2M                              ││
│ │   - Rate limited: 2,300 (0.19%)                             ││
│ │   - Top throttled endpoint: /v1/auth/login                  ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Rate Limiting Controls:                                        │
│ - Login: 5/min per IP                                          │
│ - Chat: 30/min per user                                        │
│ - Room Creation: 10/hour per user                              │
│ - Token Operations: 20/hour per user                           │
│ - API Burst Protection: 100 req/10s                            │
└─────────────────────────────────────────────────────────────────┘
```

### 9. Platform Settings

```
┌─────────────────────────────────────────────────────────────────┐
│ Platform Settings                                              │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Age Restrictions:                                           ││
│ │   Min age: 13  [Edit]                                       ││
│ │   18+ rooms: ✅ Enabled                                     ││
│ │                                                             ││
│ │ Verification:                                               ││
│ │   Photo required: ✅ Enabled                                ││
│ │   Liveness check: ✅ Enabled                                ││
│ │   Phone required: ✅ Enabled                                ││
│ │   Age verification: Optional (req'd for 18+ rooms)          ││
│ │                                                             ││
│ │ Token Economy:                                              ││
│ │   Exchange rate: 100 ⏣ = $1.00                              ││
│ │   Platform fee: 15%                                         ││
│ │   Min cash out: 1,000 ⏣                                     ││
│ │                                                             ││
│ │ Default muted words (platform): [list of banned words]      ││
│ │                                                             ││
│ │ Legal:                                                      ││
│ │   Terms of Service: v1.2.0                                  ││
│ │   Privacy Policy: v1.1.0                                    ││
│ │   DMCA Agent: [name/email]                                  ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Squad Admin Dashboard

Available to Squad Super Admins and Admins.

```
┌─────────────────────────────────────────────────────────────────┐
│ [Squad Name] Dashboard                                         │
├─────────────────────────────────────────────────────────────────┤
│ Members: 45  |  Live Now: 3  |  Rooms Today: 12  |  Total ⏣   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Squad Activity Feed                                        ││
│ │ 🚀 @djkeen is live in "Beats & Rhymes" — 5 min ago         ││
│ │ 🎤 @vocalist joined the squad — 2 hours ago                 ││
│ │ 🔥 @beatmaker received 500 claps — 3 hours ago             ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Member Management: Invite, Kick, Promote, Demote               │
│ Squad Settings: Name, Description, Avatar, Brand Color         │
│ Squad Muted Words: Manage                                      │
│ Squad Conduct: Edit rules                                      │
│ Analytics: Squad member activity, total live alerts sent       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Room Host Dashboard

Available to any user hosting a room.

```
┌─────────────────────────────────────────────────────────────────┐
│ Room Dashboard: [Room Name]                                    │
├─────────────────────────────────────────────────────────────────┤
│ 🔴 LIVE | Viewers: 234 | Lurkers: 56 | Duration: 1h23m        │
│ ⏣ Room Tokens Earned: 567 | ⏣ Claps Given: 234                │
│                                                                 │
│ Room Controls:                                                 │
│ [Mute All] [Kick User] [Change Topic] [Start Q&A] [Record]    │
│ [Prevent Lurkers*] [Ban Screenshots*]                          │
│                                                                 │
│ * Paid features (199 ⏣ / 149 ⏣)                               │
│                                                                 │
│ Chat Moderation:                                               │
│ Muted Words: [+ Add]  [spam**, promo**, ...]                   │
│                                                                 │
│ Participant Claps:                                             │
│ [P1] @user — 1,234 claps (🔥 TOP)  │  [P2] @user — 892 claps  │
│ [P3] @user — 567 claps             │  [P4] @user — 3,210 claps│
│                                                                 │
│ Quick Actions:                                                 │
│ [Create Teaser GIF] [Create Reel] [End Room]                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Platform Admin

```
GET    /v1/admin/dashboard                       # Overview metrics
GET    /v1/admin/users                           # List all users (paginated)
GET    /v1/admin/users/:id                       # User detail
POST   /v1/admin/users/:id/strike                # Issue strike
DELETE /v1/admin/users/:id/strike/:strikeId      # Remove strike
POST   /v1/admin/users/:id/ban                   # Ban user
POST   /v1/admin/users/:id/unban                 # Unban user
POST   /v1/admin/users/:id/send-to-jail          # Send to jail
POST   /v1/admin/users/:id/release-from-jail     # Release from jail
GET    /v1/admin/jail                            # List jailed users
GET    /v1/admin/jail/appeals                    # Pending appeals
POST   /v1/admin/jail/appeals/:id/approve        # Approve release
POST   /v1/admin/jail/appeals/:id/deny           # Deny appeal
GET    /v1/admin/rooms                           # List rooms
POST   /v1/admin/rooms/:id/block                 # Block room
POST   /v1/admin/rooms/:id/unblock               # Unblock room
DELETE /v1/admin/rooms/:id                       # Delete room
GET    /v1/admin/reports                         # List reports (paginated)
POST   /v1/admin/reports/:id/resolve             # Resolve report
POST   /v1/admin/ips/:ip/ban                     # Ban IP
DELETE /v1/admin/ips/:ip/ban                     # Unban IP
GET    /v1/admin/identity/pending                # Pending verifications
POST   /v1/admin/identity/approve/:id            # Approve verification
POST   /v1/admin/identity/reject/:id             # Reject verification
GET    /v1/admin/analytics/overview              # Platform analytics
POST   /v1/admin/settings                        # Update platform settings
```

### Squad Admin

```
GET    /v1/squads/:id/dashboard                  # Squad overview
GET    /v1/squads/:id/analytics                  # Squad analytics
```

### Room Host

```
GET    /v1/rooms/:id/dashboard                   # Room overview
GET    /v1/rooms/:id/analytics                   # Room analytics
```
