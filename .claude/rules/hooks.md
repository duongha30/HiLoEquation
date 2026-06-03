# React Hooks

Covers `useState`, `useEffect`, `useMemo`, `useCallback`, custom hooks, and project-specific hook patterns (Redux, Zustand, Socket.IO).

---

## Rules of Hooks

Enforced by `eslint-plugin-react-hooks` (`react-hooks/rules-of-hooks: error`).

- Hooks only at the **top level** of a function component or custom hook
- Never inside loops, conditionals, nested functions, or after early returns
- Always called in the same order on every render
- Only inside React function components or `use*` functions

```tsx
// WRONG: conditional hook
function Foo({ enabled }: { enabled: boolean }) {
  if (enabled) {
    const [x, setX] = useState(0); // violation
  }
}

// CORRECT: condition inside, hook unconditional
function Foo({ enabled }: { enabled: boolean }) {
  const [x, setX] = useState(0);
  if (!enabled) return null;
  return <span>{x}</span>;
}
```

---

## useEffect — When NOT to Use

`useEffect` is for synchronizing with **external systems** (sockets, browser APIs, third-party libs). It is the wrong tool for:

- **Derived state** — compute it during render
- **Transforming data for rendering** — compute it during render
- **Notifying parents of state changes** — call the callback in the event handler

```ts
// WRONG: effect for derived state
const [fullName, setFullName] = useState('');
useEffect(() => { setFullName(`${first} ${last}`); }, [first, last]);

// CORRECT: derive during render
const fullName = `${first} ${last}`;
```

---

## Dependency Arrays

- Include every reactive value referenced inside the effect/callback
- Never silence `react-hooks/exhaustive-deps` without a comment explaining the intentional omission
- If the dep array grows unwieldy the effect is doing too much — split it

---

## Cleanup

Every subscription, interval, or listener must clean up in the effect's return function.  
**Missing cleanup = stale listeners and memory leaks on unmount.**

```ts
// ✅ Socket listener cleanup (matches pattern in useRoomSubscription)
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;

  const onEvent = (data: SomeType) => { /* ... */ };
  socket.on('EVENT_NAME', onEvent);

  return () => { socket.off('EVENT_NAME', onEvent); };
}, [isConnected]);
```

Every `socket.on` in `useRoomSubscription` **must** have a matching `socket.off` in the cleanup. Adding a listener without cleanup causes it to fire multiple times after reconnects.

---

## Redux Hooks

Always use the **typed wrappers** from `@/store/hooks`, never the raw `useSelector` / `useDispatch`:

```ts
// ✅ Typed — correct
import { useAppSelector, useAppDispatch } from '@/store/hooks';
const playerId = useAppSelector(selectUserId);
const dispatch = useAppDispatch();

// ❌ Raw hooks — loses type safety
import { useSelector, useDispatch } from 'react-redux';
```

Selectors live in `src/store/selectors/`. Use `createAppSelector` (re-exported from `@/store/hooks`) for any selector that derives or filters data — it memoizes the result and avoids unnecessary re-renders:

```ts
// src/store/selectors/game.ts
export const selectOpponentHands = createAppSelector(
    [(state) => state.gameReducer.hands, (state) => state.userReducer.userId],
    (hands, userId) => Object.entries(hands).filter(([id]) => id !== userId),
);
```

Never write inline selector logic directly in a component with `useAppSelector(state => state.gameReducer.hands[state.userReducer.userId])` — extract it to a named selector file.

---

## Zustand (`useRoomStore`)

Zustand is used **only for Room-screen-local UI state** — drag card positions (`cardTranslates`) and local ready state (`readyPlayers`). It is not a substitute for Redux.

```ts
// ✅ Room-local UI state
const { cardTranslates, setPlayerReady } = useRoomStore();

// ❌ Do not store server-synced game data in Zustand — it belongs in Redux
```

Do not read `useRoomStore` outside `src/screens/Room/`. If other screens need that data, promote it to a Redux slice.

---

## Socket Hook Patterns

Socket listeners belong in `useRoomSubscription`. The effect re-runs when `isConnected` changes (reconnect scenario):

```ts
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;

  const onSomeEvent = (data: EventType) => { /* dispatch or setState */ };
  socket.on(ON_SOME_EVENT, onSomeEvent);

  return () => { socket.off(ON_SOME_EVENT, onSomeEvent); };
}, [isConnected]); // re-register on reconnect
```

**Stale closure risk**: handlers defined inside `useEffect` capture the values from that render. If a handler needs a fresh value (e.g., `playerId`, `roomCode`), either add it to the dep array or read it from a ref kept in sync:

```ts
const playerIdRef = useRef(playerId);
useEffect(() => { playerIdRef.current = playerId; }, [playerId]);

// handler inside useEffect reads playerIdRef.current — always fresh
```

Never define socket handlers outside `useEffect` and then pass them in — they will not be cleaned up correctly.

---

## useMemo and useCallback

Default: **do not memoize**. Add only when:

- The value is passed as a prop to a `React.memo`-wrapped child and identity matters
- The value is a dependency of another `useEffect` / `useMemo` / `useCallback`
- The computation is measurably expensive (profile first)

Premature memoization adds noise and can be slower than the re-computation it replaces.

---

## Custom Hooks

Extract a custom hook when the same hook sequence (state + effect + computed) appears in 2+ components or has a clearly nameable purpose. Do **not** extract when it has a single caller — inline it.

Existing project hooks:
- `useRoomSubscription` — registers all Socket.IO listeners for the room session
- `useConnectSocket` / `useDisconnectSocket` — socket lifecycle tied to auth state
- `useDrapDrop` — drag-and-drop offset tracking inside the Room screen

---

## useState Patterns

- Pass a function to `useState(() => computeInitial())` when initial computation is expensive
- Use the functional updater when new state depends on old: `setCount(c => c + 1)` — never `setCount(count + 1)` inside async or batched contexts
- Use `useReducer` when state transitions are conditional on the previous state or there are 3+ related values that change together

---

## Stale Closure Trap

Async handlers and intervals capture values from the render where they were created. Fix by:

- Using the functional updater form of `setState`
- Adding the changing value to the dep array and rebuilding the handler
- Reading from a ref kept in sync with the latest value
