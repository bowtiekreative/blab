# Identity & Verification — Hustle Zone

> **No anonymous users.** Everyone must verify their identity. This platform is for real people building real communities.

---

## Core Rules

| Rule | Details |
|------|---------|
| **Profile photo required** | Must be a clear photo of a person's face — no logos, avatars, cartoons, text, or AI-generated faces |
| **No anonymous access** | Cannot browse, lurk, or participate without verified identity |
| **One account per person** | Phone + email deduplication |
| **Age verification** | Users must be 13+ (or 18+ for 18+ rooms) |
| **Real name optional** | Username can be a pseudonym, but photo must be real |

---

## Verification Flow

```
1. Sign Up (OAuth: Google / Facebook / X)
   │
2. Upload Profile Photo
   │
3. Liveness Check (AI + optional manual review)
   │
4. Phone Verification (SMS code)
   │
5. Age Verification (DOB or ID upload)
   │
6. Account Activated ✅
```

### Steps in Detail

#### 1. Sign Up
- OAuth only (Google, Facebook, X/Twitter)
- No email/password signup — reduces bot accounts
- OAuth provides: name, email, profile photo (temporary — will be replaced)

#### 2. Profile Photo Upload
- User uploads a clear face photo
- AI checks: is it a face? Is it a real photo (not AI-generated)?
- Rejection triggers: cartoon/logo/anime/celebrity photo/AI face/blurry/dark
- Manual review queue for edge cases

#### 3. Liveness Check
- User takes a **selfie** (not a static photo upload)
- 3-point verification: blink, turn head, smile
- AI verifies it's a live human, not a photo of a photo
- Falls back to manual review if AI confidence is low

#### 4. Phone Verification
- SMS code to phone number
- One phone number = one account
- Prevents duplicate/fake accounts

#### 5. Age Verification
- Provide date of birth
- Optional: upload government ID for 18+ room access
- Under 13: rejected (COPPA compliance)
- 13-17: standard account, no 18+ rooms
- 18+: full access, can enter 18+ rooms

#### 6. Activation
- Account is fully activated
- "Verified" badge appears on profile
- User can now create/join rooms

---

## Profile Photo Standards

| Standard | Requirement |
|----------|-------------|
| **Format** | JPEG, PNG, WebP |
| **Min resolution** | 200×200 pixels |
| **Max size** | 5 MB |
| **Face must be** | Clearly visible, unobstructed, front-facing or slight angle |
| **Rejected** | Sunglasses, masks (non-medical), filters, heavy editing, group photos, pets, objects, text, logos, cartoons, AI-generated faces |

---

## Age Verification (for 18+ Rooms)

Room hosts can mark a room as **18+ only**:

```json
{
  "isAdult": true,
  "ageRestriction": 18
}
```

- Only users who have completed age verification (ID upload) can enter
- Minors are blocked from seeing/joining 18+ rooms
- Hosts who allow minors into 18+ rooms face platform-level consequences

---

## Verification Levels

| Level | Requirements | Badge | Priveleges |
|-------|-------------|-------|------------|
| **Basic** | OAuth + phone | ✅ (blue check) | Create rooms, join rooms, chat |
| **Verified** | Basic + photo + liveness | ✅✅ (blue check + verified) | Host rooms, be in carousel |
| **ID Verified** | Verified + government ID | ✅✅✅ (gold badge) | Access 18+ rooms, receive payouts |

---

## API Endpoints

### Verification

```
POST   /v1/identity/upload-photo       # Upload profile photo
POST   /v1/identity/liveness           # Submit liveness selfie
POST   /v1/identity/verify-phone       # Send SMS code
POST   /v1/identity/confirm-phone      # Confirm SMS code
POST   /v1/identity/verify-age         # Submit DOB / ID
GET    /v1/identity/status             # Current verification level
```

### Moderation

```
GET    /v1/admin/identity/pending       # Pending manual reviews
POST   /v1/admin/identity/approve/:id   # Approve verification
POST   /v1/admin/identity/reject/:id    # Reject with reason
GET    /v1/admin/identity/flags         # Flagged profiles (AI low confidence)
```

---

## Anti-System Gaming

| Attack | Countermeasure |
|--------|---------------|
| Same photo, different account | Perceptual hash matching on all profile photos |
| AI-generated profile photos | AI detection model + liveness check required |
| Stolen phone numbers | SMS OTP + OAuth binding |
| VPN/proxy for banned users | IP/device fingerprinting on identity step |
| Reusing rejected photos | Photo hash is stored on rejection |
