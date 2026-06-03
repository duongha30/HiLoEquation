---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code. Produces a step-by-step implementation plan saved to /Users/duongha/Documents/HiLoEquation/.claude/plans/.
---

# Writing Plans

## Overview

Write a comprehensive implementation plan that an engineer can follow task-by-task with zero prior context. Document which files to touch, exact code changes, exact commands to run, and how to verify each step. Bite-sized, DRY, YAGNI, frequent commits.

Announce at start: "I'm using the writing-plans skill to create the implementation plan."

Save plans to: `/Users/duongha/Documents/HiLoEquation/.claude/plans/YYYY-MM-DD-<feature-name>.md`

---

## Project Context

HiLoEquation is a TypeScript monorepo. Plans must reflect the actual stack:

- **Server** (`hiloequation_server/`): Express + Socket.IO, `tsx watch` for hot reload, no test runner configured. Type-check with `npm run typecheck`.
- **Client** (`hiloequation_client/`): React 19 + Vite, Redux Toolkit + redux-persist, Zustand for Room-local UI. Lint with `npm run lint`.
- **Infrastructure**: Redis (live game state at `game:state:<roomCode>`), MongoDB (players, key tokens).

When a feature touches real-time behavior, the plan must include steps for **both** the socket handler (server) and the Redux listener / hook (client). Socket event names must be kept in sync between:
- `hiloequation_server/src/socket/events.ts`
- `hiloequation_client/src/store/socket/events.ts`

---

## Scope Check

If the spec covers multiple independent subsystems, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, independently verifiable software.

---

## File Structure

Before defining tasks, list every file that will be created or modified and its single responsibility. This locks in decomposition decisions.

- Each file should have one clear responsibility.
- Files that change together should live together (e.g., a new socket handler goes in `src/socket/handlers/`, its event constants go in `src/socket/events.ts`).
- In the client, follow the existing slice pattern: add actions to `store/actions/`, reducers to `store/reducers/`, selectors to `store/selectors/`.
- Follow the existing CJS/ESM split: `GameCore` uses `module.exports`; everything else uses ES module `import/export`.

---

## Plan Document Header

Every plan MUST start with:

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds]

**Packages affected:** [server | client | both]

**Architecture:** [2–3 sentences about the approach]

**Tech touched:** [e.g., Redis GameState, Socket.IO handler, Redux slice, React component]

---
```

---

## Task Structure

### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts`

- [ ] **Step 1: [Action]**

```typescript
// exact code to write or change
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck` (from `hiloequation_server/` or `hiloequation_client/`)
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add <files>
git commit -m "feat: <description>"
```

---

## Bite-Sized Granularity

Each step is one action (2–5 minutes). For a socket feature, typical steps are:

1. Add event name constants to both `events.ts` files
2. Add/update the server socket handler
3. Add/update `GameCore` method (if game state changes)
4. Add Redux action + reducer update on the client
5. Register the socket listener (in the relevant hook or `useRoomSubscription`)
6. Update the component to read from the new Redux state
7. Typecheck both packages
8. Manual smoke-test steps (what to click/emit and what to observe)
9. Commit

---

## No Placeholders

Never write:

- "TBD", "TODO", "implement later"
- "Add appropriate error handling" / "handle edge cases" without showing the code
- "Similar to Task N" — repeat the code; engineers may read tasks out of order
- Steps that describe *what* to do without showing *how* (code required for every code step)
- References to types or functions not defined in any task

---

## Self-Review

After writing the complete plan, check:

1. **Spec coverage**: can you point to a task for every requirement in the spec? List any gaps and add tasks for them.
2. **Placeholder scan**: any patterns from the "No Placeholders" section? Fix them.
3. **Type consistency**: do method names, type shapes, and event names match across all tasks? A mismatch between tasks is a future bug.
4. **Event sync**: if new socket events were added, are they in both `events.ts` files?

Fix issues inline. No need to re-review — just fix and move on.

---

## Save the Plan

The plan must always end up at:
```
/Users/duongha/Documents/HiLoEquation/.claude/plans/YYYY-MM-DD-feature-name.md
```

**How to save depends on whether plan mode is active:**

### Outside plan mode (skill invoked directly)
After self-review passes, save immediately:

1. Run via Bash tool (substitute the real date and feature name):
   ```bash
   touch /Users/duongha/Documents/HiLoEquation/.claude/plans/YYYY-MM-DD-feature-name.md
   ```
   If that file already exists, append a suffix (e.g. `-v2`) before touching.
2. Write the plan content into that file using the `Write` tool.
3. Do not ask for confirmation — just create and write it.

### Inside plan mode (FleetView controls the file location)
FleetView forces the plan into its own storage (`/Users/duongha/.claude/plans/<auto-name>.md`) during planning — you cannot write to the project path in this mode.

Instead, **make the very first task in the plan** be saving itself to the project directory:

```markdown
## Task 0: Save this plan to the project plans directory

- [ ] **Step 1: Touch the plan file**
  ```bash
  touch /Users/duongha/Documents/HiLoEquation/.claude/plans/YYYY-MM-DD-feature-name.md
  ```
- [ ] **Step 2: Write the plan content**
  Use the `Write` tool to write the full plan content to that path.
```

This ensures the plan is always persisted at the correct project path as the first thing execution does.

---

## Execution Handoff

After saving the plan (or after writing Task 0 in plan mode):

> "Plan saved to `/Users/duongha/Documents/HiLoEquation/.claude/plans/<filename>.md`. Ready to execute task-by-task in this session — want me to start with Task 1?"
