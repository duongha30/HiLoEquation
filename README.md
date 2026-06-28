# HiLoEquation

> A real-time, multiplayer card game where players draw number and operator cards, arrange them into mathematical equations, and bet poker-style to win the pot by landing closest to the **Hi** (20) or **Lo** (1) target.

🎮 **Live demo:** [hiloequation.com](https://hiloequation.com)

Built as a full-stack TypeScript monorepo with an authoritative game server, real-time Socket.IO sync, and a single-origin Docker deployment behind a Cloudflare Tunnel.

---

## Tech Stack

**Frontend**
- React 19 + TypeScript, built with Vite 7
- Redux Toolkit + redux-persist (auth/game/room slices), Zustand for screen-local UI state
- Tailwind CSS v4
- `@dnd-kit` drag-and-drop for arranging cards into equations
- `socket.io-client` for real-time gameplay

**Backend**
- Node.js + Express 5 + TypeScript (run via `tsx`)
- Socket.IO 4 for the real-time game protocol
- **Redis** — authoritative live game state (`game:state:<roomCode>`)
- **MongoDB** + Mongoose — persistent players, cash balances, and auth key pairs
- RS256 JWT auth (asymmetric per-user key pairs) in httpOnly cookies

**Infra**
- Docker + Docker Compose (multi-stage builds)
- nginx single-origin reverse proxy (SPA + API + WebSocket)
- Cloudflare Tunnel for zero-port-exposure HTTPS hosting

---

## How the Game Works

- A deck of **44 number cards** (4 suits × 0–10), **4 √ cards**, and **4 × (multiply) cards**.
- Each player is dealt a **hidden hole card** plus default operator cards, then draws more across several rounds.
- Between rounds, players take part in **poker-style betting** (check / bet / call / raise / fold).
- At showdown, each player **declares** their target — **Hi Pot** (aim for 20), **Lo Pot** (aim for 1), or **Swing** (both) — then arranges their cards into an equation.
- Equations evaluate **strictly left-to-right** (no operator precedence): `3 + 4 ÷ 2 − 3` = `((3 + 4) ÷ 2) − 3` = `0.5`.
- Closest to each target wins that pot; ties break on highest card value, then suit rank.

---

## Engineering Highlights

These were the more interesting problems to solve:

- **Authoritative server, zero client trust.** The server never trusts client-submitted card *values* — on equation submission it remaps the submitted card IDs back to the player's own Redis-held cards, then validates/auto-corrects them through a deterministic equation scanner. Ownership is re-checked on every socket action (`socket.data.playerId`).
- **Per-player card encryption.** Each player's secret hole card is encrypted with **AES-256-CBC** (key = `SHA-256(playerId + salt)`) at broadcast time, so opponents receive only `{ encryptedData }` and the card stays face-down until showdown. The owning client decrypts it via the Web Crypto API. Plaintext is kept only in Redis (server-side), never leaked on the wire.
- **Redis as the source of truth.** All live game state lives in Redis and is mutated exclusively through a `GameCore` class, keeping the multi-round deal → bet → declare → showdown state machine consistent across reconnects and server restarts.
- **Real-time protocol design.** A well-defined Socket.IO event contract (`START_GAME`, `DEAL_CARD`, `PLAYER_ACTION`, `DECLARE_POT`, `SUBMIT_EQUATION`, `GET_SHOWDOWN_RESULT`, …) drives the whole game; the client registers/cleans up every listener in a single subscription hook.
- **Persistent economy.** Player cash (default 2000) persists to MongoDB across hands and server restarts — seeded at game start and written back after each showdown.
- **Production deployment without exposing the host.** A single-origin nginx config serves the SPA and reverse-proxies the API + WebSocket upgrade to the backend; a Cloudflare Tunnel provides public HTTPS with **no inbound ports opened** on the host.

---

## Architecture

Monorepo with two packages:

```
hiloequation/
├── hiloequation_server/   # Express + Socket.IO + Redis + MongoDB (TypeScript)
│   └── src/
│       ├── game/          # GameCore engine, deck, equation scanner
│       ├── socket/        # event handlers (room / player / game)
│       ├── auth/          # RS256 JWT utils + socket auth middleware
│       ├── services/      # player, room, redis pub/sub
│       └── models/        # Mongoose schemas
└── hiloequation_client/   # React + Vite SPA (TypeScript)
    └── src/
        ├── screens/       # Home, Room (gameplay), Login/Signup, User Guide
        ├── store/         # Redux slices, selectors, socket integration
        └── utils/         # card decryption, equation scanner (client mirror)
```

**Production topology (single origin via Cloudflare Tunnel):**

```
Browser ──HTTPS──▶ Cloudflare edge ──tunnel──▶ cloudflared ──http──▶ client (nginx)
                                                                       ├─ /v1/api, /socket.io ─▶ server:4056
                                                                       └─ everything else ─▶ SPA
```

---

## Running Locally

**Prerequisites:** Node.js, MongoDB (`localhost:27017`), Redis (`127.0.0.1:6379`).

```bash
# Server
cd hiloequation_server
npm install
npm run start:dev          # tsx watch, hot reload

# Client (in a second terminal)
cd hiloequation_client
npm install
npm start                  # Vite dev server on http://localhost:3000
```

API docs (Swagger UI) are served at `/api-docs`.

## Deployment

The whole stack runs via Docker Compose behind a Cloudflare Tunnel — see **[DEPLOY.md](DEPLOY.md)** for the full walkthrough.

```bash
docker compose up -d
```

---

## Status

Actively developed. Core gameplay loop — auth, room management, multi-round dealing,
poker-style betting, pot declaration, equation submission, and showdown — is implemented
and playable end-to-end.
