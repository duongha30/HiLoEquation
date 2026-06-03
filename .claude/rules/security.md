# Security Rules

## CRITICAL — Never Violate These

- **Never** hardcode secrets, API keys, passwords, or tokens in source code
- **Never** commit `.env` files to version control
- **Never** log sensitive data (passwords, tokens, card values, PII)
- **Never** use `eval()` or `Function()` with user input
- **Always** validate and sanitize all user inputs at the system boundary

---

## Environment Variables

```js
// ✅ Always use environment variables for secrets
const mongoUri = process.env.MONGO_URI;
const redisUrl = process.env.REDIS_URL;
const privateKey = process.env.JWT_PRIVATE_KEY;

// ❌ Never hardcode
const mongoUri = 'mongodb://localhost:27017/hiloequation';
```

Vite bundles any variable prefixed `VITE_` into the client bundle — treat those as public. Never put JWT keys or MongoDB/Redis credentials in a `VITE_` variable.

CORS is currently hardcoded to `http://localhost:3000` in `src/app.ts`. In any non-local environment this must come from an env var:
```ts
origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000'
```

---

## Authentication (RS256 JWT)

This project uses **asymmetric RS256 JWT** — a per-user private key signs tokens, the matching public key verifies them. Both are stored in MongoDB (`KeyToken` model).

- Access token expiry: 2 days. Refresh token expiry: 7 days.
- Tokens are stored in **httpOnly, Secure cookies** — never in `localStorage` or `sessionStorage`.
- Never expose the private key outside `src/auth/authUtils.ts`.
- The `authentication` REST middleware must be applied to every protected route.

```ts
// ✅ Always verify ownership, not just authentication
if (socket.data.playerId !== playerId) {
    socket.emit(event, { status: ERROR });
    return;
}
```

Password hashing uses **bcrypt** (minimum 10 rounds). Never compare plaintext passwords.

---

## Socket.IO Security

The socket auth middleware exists in `src/auth/authUtils.ts` but is currently **commented out** — this is a known gap. Until it is re-enabled, all socket handlers must manually verify `socket.data.playerId === playerId` before mutating any game state.

Rules for every socket handler:
1. Reject the event if `playerId` is missing or does not match `socket.data.playerId`.
2. Never trust the client to report its own identity — always read from `socket.data`.
3. Never broadcast raw game state that includes another player's encrypted card data in a way that reveals the key material.

```ts
// ✅ Correct ownership check in every handler
socket.on(ON_BET_COIN, async ({ roomCode, playerId, betting }) => {
    if (!playerId || socket.data.playerId !== playerId) {
        socket.emit(EMIT_BETTING, { status: ERROR });
        return;
    }
    // ...
});
```

---

## Redis Game State

All live game state lives at `game:state:<roomCode>`. Rules:

- Only mutate state through `GameCore` methods — never write raw JSON to Redis from a handler.
- The `hands` object contains all players' cards. When broadcasting, be aware that all clients receive the full `hands` payload. Face-down (`faceDown: true`) cards must be filtered client-side; a future hardening step is server-side per-socket filtering.
- Never store auth tokens or player passwords in Redis.

---

## Card Encryption

On the first draw, number cards are encrypted per-player with **AES-256-CBC** using a key derived from `SHA-256(playerId + 'salt')`.

- The salt `'salt'` is a fixed string — if this ever needs to change, rotate it as a breaking change and re-deal.
- Encrypted cards are only sent in the first-draw broadcast. Subsequent draws are unencrypted.
- Client-side decryption happens in `src/utils/card.ts` using the Web Crypto API. Do not log decrypted card values.

---

## Authorization

Always verify resource ownership at the handler level, not only at the route/connection level:

```ts
// ✅ Handler-level ownership check
if (post.authorId !== req.user.id) throw new AppError('Forbidden', 403);
```

Apply the `authentication` middleware to every REST route that touches user or room data. Do not rely on client-side route guards as the sole protection.

---

## Input Validation

Validate all data arriving from the client (REST body, socket payload) before using it:

```ts
// ✅ Validate before using
if (typeof betting !== 'number' || betting <= 0 || betting > playerState.cash) return;

// ❌ Never trust the client's reported values directly
await Game.bet(roomCode, playerId, data.betting); // without checking data.betting
```

---

## React / Client Security

**XSS via `dangerouslySetInnerHTML`** — treat every usage as a code-review halt. Render user content as text, not HTML. If raw HTML is unavoidable, sanitize with `DOMPurify` first.

**Unsafe URL schemes** — validate `href` and `src` values that originate from user data:
```ts
function safeUrl(url: string): string | undefined {
    try {
        const { protocol } = new URL(url);
        if (['http:', 'https:'].includes(protocol)) return url;
    } catch { /* invalid URL */ }
    return undefined;
}
```

**`target="_blank"`** — always include `rel="noopener noreferrer"` on external links.

**Cookies** — sessions are already in httpOnly cookies. Never replicate token storage in `localStorage`.

---

## Dependency Security

```bash
npm audit            # check for known vulnerabilities
npm audit fix        # auto-fix where safe
```

Run `npm audit` in both `hiloequation_server/` and `hiloequation_client/` before merging any PR that adds or upgrades a dependency.
