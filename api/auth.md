# Auth Flow — Hustle Zone

## Supported Providers

| Provider | Scope |
|----------|-------|
| **Google** | email, profile |
| **Facebook** | email, public_profile |
| **X (Twitter)** | email, users.read |

## Flow

```
1. Client redirects to:
   GET /v1/auth/oauth/google
   (Server generates state param, redirects to Google OAuth)

2. User authorizes → Google redirects back to:
   GET /v1/auth/oauth/callback?code=...&state=...

3. Server exchanges code for tokens, finds or creates user

4. Server issues JWT:
   {
     "sub": "user-uuid",
     "username": "string",
     "iat": 123,
     "exp": 123 + 7d
   }

5. Server sets httpOnly cookie + returns { token, user }
```

## JWT Format

```json
// Decoded
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "username": "hustler_john",
  "displayName": "John",
  "avatarUrl": "https://...",
  "isBanned": false,
  "iat": 1717000000,
  "exp": 1717604800
}
```

- **Access:** 7 days
- **Refresh:** 30 days (stored in DB)

## Security

- All OAuth state params must contain a nonce + HMAC signature
- Rate limit: 10 OAuth attempts per IP per minute
- Token rotation on logout
- Banned users cannot receive new tokens
- IP-banned addresses blocked at gateway level
