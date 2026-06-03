# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HiLoEquation is a multiplayer card game where players use number and operator cards to form mathematical equations and compete for the highest score. The repo is a monorepo with two packages:

- `hiloequation_server/` — Node.js/Express + Socket.IO backend (TypeScript, run with `tsx`)
- `hiloequation_client/` — React + Vite frontend (TypeScript, Tailwind CSS v4)

## Commands

### Server (`hiloequation_server/`)
```bash
npm start          # Start with hot reload via tsx watch
npm run typecheck  # Type-check without emitting
```

### Client (`hiloequation_client/`)
```bash
npm start          # Vite dev server (port 3000)
npm run build      # tsc + vite build
npm run lint       # ESLint
```

### Infrastructure
The server requires MongoDB (default `mongodb://localhost:27017`) and Redis (default `redis://127.0.0.1:6379`) to be running locally. Redis stores all live game state; MongoDB stores players and key tokens.

## Current Feature State

### Implemented

**Auth**
- Sign up / login / logout with RS256 JWT. Access token (2 days) and refresh token (7 days) stored in httpOnly cookies.
- Per-user key pairs persisted in MongoDB (`KeyToken` model). Client persists auth state in Redux (`user` slice, redux-persist).
- REST auth middleware (`authentication`) is wired; socket auth middleware exists in `src/auth/authUtils.ts` but is currently commented out.

**Room management**
- Create room (with optional password, max 4 players) and join room via REST API. Room stored in MongoDB.
- On enter, the client emits `CREATE_ROOM` or `JOIN_ROOM` over the socket, which joins the socket.io room and broadcasts the updated player list via `GET_PLAYER_JOIN`.
- Leave room: client emits `LEAVE_ROOM` → server removes player from MongoDB room and from Redis game state, broadcasts `GET_PLAYER_LEAVE`.

**Ready / start flow**
- Non-host players toggle ready state; the host sees a "Start Game" button that is enabled only when all guests are ready.
- Ready state is local to `roomStore.ts` (Zustand); server relays ready toggles to all room members via `GET_PLAYER_READY`.
- Host emits `START_GAME { roomCode, playerIds }` → server initializes `GameCore` in Redis → broadcasts `GET_START_GAME` → client immediately auto-emits `DEAL_CARD` with `isFirstDraw: true`.

**Card dealing and encryption**
- Server `GameCore.deal()` draws from the shuffled deck. On `isFirstDraw`, number cards are AES-256-CBC encrypted per player (key = SHA-256 of `playerId + 'salt'`). Default operation cards (`+`, `-`, `÷`) are injected on the first draw only.
- On round 2+ draws, cards are sent unencrypted. Players who already hold a `sqrt` or `multiply` card always draw only number cards.
- Client decrypts first-draw cards in `src/utils/card.ts` using the Web Crypto API (`AES-CBC`, same key derivation).
- After dealing, `GET_CARD_DEAL` is broadcast to the room; client updates the `game` Redux slice.
- **Multi-deal flow**: (1) `START_GAME` → server init, (2) client auto-emits `DEAL_CARD { isFirstDraw: true }` → round becomes 1, (3) `StartReadyButton` detects `round === 1` and immediately emits `DEAL_CARD { times: 1, isFirstDraw: false }` → round becomes 2, (4) once all players have placed their forced bet, host emits `DEAL_CARD { times: 1, isFirstDraw: false }` → round becomes 3 and a poker-style betting round auto-starts.

**Betting and folding (free-form, rounds 1–2)**
- `MainPlayer` component has a bet input (increment/decrement by 10, or free-type) capped to the player's cash, and a Fold button.
- Emits `BET_COIN { roomCode, playerId, betting }` → server validates ownership and amount, updates Redis, broadcasts `GET_BET_COIN`.
- Emits `FOLD_CARD { roomCode, playerId }` → server nulls out player's cards in Redis, broadcasts `GET_FOLD_CARD`.
- Both `GET_BET_COIN` (`ON_BETTING`) and `GET_FOLD_CARD` (`ON_FOLDING`) are wired in `useRoomSubscription`.
- **Forced first-bet phase** (round === 2, bet === 0): a blocking overlay modal appears with a minimum 50 EUR bet and no Fold option. Disappears automatically once the bet is recorded in Redux. Controlled by `isForcedBetPhase = isPlaying && round === 2 && bet === 0`.
- Server-side handler verifies `socket.data.playerId === playerId` before processing bets/folds.

**Poker-style betting round (round 3+)**
- After the round-3 deal, the server auto-calls `GameCore.startBettingRound()`, which initializes a `BettingRoundState` in Redis: ordered turn list (rotates starter each round via `nextStarterIndex`), per-player contributions, current bet, and last raiser.
- `GameCore.processBettingAction()` handles `bet`, `check`, and `fold` actions: updates cash/contributions/totalBetting, advances the turn pointer, and marks the round ended when the turn cycles back to the last raiser or only one active player remains.
- Server handler `ON_PLAYER_ACTION` validates ownership, calls `processBettingAction`, and broadcasts `EMIT_PLAYER_ACTION` (ongoing) or `EMIT_BETTING_ROUND_END` (round over) to the room.
- Client `MainPlayer` renders a **betting round panel** when `isMyTurn`: shows "Check / Bet / Fold" or "Call N / Raise / Fold" depending on whether the player owes a call. Emits `PLAYER_ACTION { roomCode, playerId, action, amount? }`.
- Opponent `Player` components show a **gold outline** when it is that player's turn (`currentTurnPlayerId` from Redux).
- New Redux selectors: `selectBettingRound`, `selectCurrentTurnPlayerId`, `selectIsMyTurn`, `selectCurrentBet`.
- `GET_PLAYER_ACTION` and `GET_BETTING_ROUND_END` are registered in `useRoomSubscription`.

**Game finalization**
- Server handler for `FINISH_GAME { roomCode, playerId, result }`: calls `setSubmission` to record score then `finalizeRound`, which awards the entire `totalBetting` pot to the player with the highest score and resets bets/cards. `nextStarterIndex` increments each round so the betting order rotates.
- **Not yet wired on the client** — no UI emits `FINISH_GAME` and `GET_GAME_RESULT` is not subscribed in `useRoomSubscription`.

**Room UI (in-game)**
- Room screen renders `MainPlayer` (local player, droppable zone) plus up to 3 `Player` components for opponents at left / top / right positions.
- Opponent `Player` components rotate their card group based on table position: left = `rotate(90deg)`, top = `rotate(180deg)`, right = `rotate(-90deg)`. Cards stack 50% on top of each other via negative `margin-left` on sibling wrappers (operates in local coordinate space after rotation).
- All opponent cards are visible; encrypted cards (those with an `encryptedData` field) render face-down. `faceDown` is never set by the server; the client detects it via `!!c.encryptedData`. Encrypted opponent cards have no `id` field — normalized with `` id ?? `face-down-${i}` `` in the Player component.
- Card drag-and-drop within the player's own hand via `@dnd-kit/react`; position offsets tracked in Zustand (`cardTranslates`).
- `BettingDisplay` component in the deck section shows each player's current bet amount (from Redux `hands`) in real time. Visible once `isPlaying && round >= 1`.
- `Deck` component currently renders a static decorative stack of the default operation cards, not the live deck count.

### Not yet implemented / known gaps

- No `GET_PLAYER_LEAVE` listener in `useRoomSubscription` — server broadcasts `GET_PLAYER_LEAVE` but the client ignores it.
- No game result screen or UI for submitting the player's equation result (`FINISH_GAME`). `GET_GAME_RESULT` is not subscribed in `useRoomSubscription`.
- Socket auth middleware is commented out — sockets are unauthenticated.
- Background music player is commented out in `App.tsx`.
- A debug "test Join Room" button is present on the Home screen.
- `Deck` component shows a static decorative stack, not the live remaining deck count.
- `EMIT_BETTING_ROUND_END` is broadcast but the client has no handler for it yet — the game does not advance automatically when a betting round ends.

## Recent Changes

> Replace this section (don't append) each time significant features land. Older history lives in `git log`.

### feat/handle-deal-card (current branch)
- **Poker-style betting round (server)**: `GameCore` gains `startBettingRound()` and `processBettingAction()`. `GameState` extended with `bettingRound: BettingRoundState | null` and `nextStarterIndex` (rotates the turn starter each round). After the round-3 deal, the server auto-starts the betting round. `IGameCore` interface updated accordingly.
- **Poker-style betting round (client)**: New `BettingRoundState` type and `bettingRound` field in the game Redux slice. New selectors: `selectBettingRound`, `selectCurrentTurnPlayerId`, `selectIsMyTurn`, `selectCurrentBet`. New events `PLAYER_ACTION` / `GET_PLAYER_ACTION` / `GET_BETTING_ROUND_END` added to both `events.ts` files.
- **`MainPlayer` betting round panel**: When `isMyTurn`, a panel replaces the normal actions showing Check / Call / Bet / Fold controls. Emits `PLAYER_ACTION`. Normal bet/fold actions are hidden during an active betting round turn.
- **Opponent turn indicator**: `Player` component shows a gold outline when `currentTurnPlayerId` matches that opponent's ID.
- **Forced first-bet modal**: In round 2 with `bet === 0`, a blocking overlay modal enforces a minimum 50 EUR bet. Disappears automatically once Redux records the bet. Fold is hidden in this phase.
- **`BettingDisplay`**: New `src/screens/Room/components/BettingDisplay/` component shows each player's live bet amount. Rendered in the deck section of Room.
- **Automatic second deal**: `StartReadyButton` fires `DEAL_CARD { times: 1 }` when `round === 1`, then fires `DEAL_CARD { times: 1 }` again when `round === 2 && isHost && allPlayersHaveBet`.
- **Opponent card stacking**: `Player` reads opponent hands from Redux and renders all cards stacked 50% with position-based rotation (left/top/right). Encrypted cards show face-down via `!!c.encryptedData`.
- **Wired listeners**: `GET_BET_COIN`, `GET_FOLD_CARD`, `GET_PLAYER_ACTION`, and `GET_BETTING_ROUND_END` registered in `useRoomSubscription`.

### sc/deal-card-1
- `GameCore.deal()` multi-player support; AES-256-CBC encryption of number cards on first draw.
- Client-side decryption in `src/utils/card.ts` (Web Crypto API).
- `START_GAME` → `DEAL_CARD { isFirstDraw: true }` auto-emit flow wired end-to-end.

## Architecture

### Server

**Entry**: `server.ts` → creates Express app (`src/app.ts`) and attaches Socket.IO via `src/socket/socket.ts`.

**Layered structure**: `routes → controllers → services → models` (MongoDB/Mongoose) for REST. Game logic is separate.

**Game engine** (`src/game/`):
- `GameCore` class persists all game state in Redis under key `game:state:<roomCode>`.
- A deck has 44 number cards (4 suits × 0–10) + 4 sqrt cards + 4 multiply cards.
- On the first draw (`isFirstDraw=true`), number cards are AES-256-CBC encrypted per player using `playerId + 'salt'` as the key. Subsequent draws (round 2+) are unencrypted. Players with an existing `sqrt` or `multiply` card always draw only number cards.
- Default operation cards (`+`, `-`, `÷`) are injected into each player's hand on first draw.
- `finalizeRound` awards the entire `totalBetting` pot to the player with the highest score.

**Socket handlers** (`src/socket/handlers/`): three files — `room.handler`, `player.handler`, `game.handler` — each registered on every connection in `src/socket/index.ts`.

**Auth**: `src/auth/authUtils.ts` implements RS256 JWT (access token 2 days, refresh token 7 days). Tokens are stored in httpOnly cookies. `KeyToken` model stores per-user public/private key pairs in MongoDB. Socket auth middleware exists but is currently commented out.

**API docs**: Swagger UI is served at `/api-docs`.

### Client

**Entry**: `main.tsx` → Redux store + `react-router` → `App.tsx` → `MainRouters.tsx`.

**Routing**: `MainRouters` wraps routes in a `PrivateRoute` that redirects unauthenticated users to `/login`. Routes: `/` (Home), `/room/:roomCode` (Room), `/login`, `/signup`.

**State management** (Redux Toolkit + redux-persist):
- `user` — auth tokens and user info (persisted)
- `room` — current room, player list, host
- `game` — live game state (`round`, `totalBetting`, `hands` keyed by playerId)
- `socket` — socket connection status

**Socket integration** (`src/store/socket/`): `connectSocket()` creates a singleton `socket.io-client` instance. `useConnectSocket` hook connects on login; `useDisconnectSocket` cleans up. `useRoomSubscription` registers all socket event listeners for a room session.

**Screen-level state**: `Room/roomStore.ts` uses Zustand for local UI state within the Room screen (`cardTranslates` for drag positions, `readyPlayers` set).

## Socket Event Contract

Client emits → Server handles:
- `CREATE_ROOM`, `JOIN_ROOM`, `LEAVE_ROOM`
- `PLAYER_READY`
- `START_GAME` `{ roomCode, playerIds }`
- `DEAL_CARD` `{ roomCode, players, times?, isFirstDraw? }`
- `BET_COIN` `{ roomCode, playerId, betting }`
- `FOLD_CARD` `{ roomCode, playerId }`
- `PLAYER_ACTION` `{ roomCode, playerId, action: 'bet' | 'check' | 'fold', amount?: number }`
- `FINISH_GAME` `{ roomCode, playerId, result }`

Server emits → Client listens:
- `GET_START_GAME`, `GET_CARD_DEAL`, `GET_BET_COIN`, `GET_FOLD_CARD`
- `GET_PLAYER_ACTION`, `GET_BETTING_ROUND_END`
- `GET_GAME_RESULT`, `GET_PLAYER_JOIN`, `GET_PLAYER_LEAVE`, `GET_PLAYER_READY`
- `SOCKET_ERROR`

Event names are defined in `hiloequation_server/src/socket/events.ts` and `hiloequation_client/src/store/socket/events.ts` — keep both in sync when adding events.

## Key Conventions

- Server uses CommonJS-style `module.exports` for `GameCore` but ES module `import/export` elsewhere.
- Client API calls use `src/store/api/get.ts` and `post.ts`; `retryRequest.ts` handles token refresh.
- Client config (API base URL, socket URL) lives in `src/config/config.json` — update this for non-local environments.
- CORS is hard-coded to `http://localhost:3000` in `src/app.ts`.
- Each player starts with 2000 cash (`INIT_CASH`). Bet step in the UI is 10.
