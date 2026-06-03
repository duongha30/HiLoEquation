---
name: brainstorming
description: Use this before any feature work — new game mechanics, socket events, UI screens, or behavior changes. Explores intent and design before writing code.
---

# Brainstorming Ideas Into Designs

Turn ideas into fully-formed designs through focused dialogue, then commit a spec before touching code.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design and get user approval.

Do NOT write any code or take any implementation action until you have presented a design and the user has approved it.

---

## Checklist

Complete these in order:

1. Explore project context — read `.claude/CLAUDE.md`, relevant source files, recent commits
2. Ask clarifying questions — one at a time; purpose, constraints, success criteria
3. Propose 2–3 approaches — with trade-offs and a recommendation
4. Present design — section by section, get approval after each
5. Write spec — save to `.claude/specs/YYYY-MM-DD-<topic>.md` and commit
6. Self-review spec — scan for placeholders, contradictions, ambiguity; fix inline
7. User reviews spec — ask user to review before proceeding
8. Transition — present the approved spec and ask how the user wants to proceed

---

## Project Context

HiLoEquation is a two-package monorepo:

- **`hiloequation_server/`** — Express + Socket.IO backend. Live game state lives in Redis (`game:state:<roomCode>`). Player/auth data lives in MongoDB.
- **`hiloequation_client/`** — React + Vite frontend. State is split between Redux Toolkit (global: `user`, `room`, `game`, `socket`) and Zustand (Room-screen local UI).

When exploring context, always check which packages a feature touches. Features that add or change real-time behavior must cover both the socket event contract and the client subscription.

**Socket event names** are defined in two mirrored files — any new event must be added to both:
- `hiloequation_server/src/socket/events.ts`
- `hiloequation_client/src/store/socket/events.ts`

---

## The Process

### Understanding the idea

- Read `.claude/CLAUDE.md` and the relevant source files before asking questions.
- Before asking detailed questions, assess scope. If the request spans multiple independent subsystems, flag it and help decompose into sub-features first.
- For appropriately-scoped requests, ask one question at a time — prefer multiple choice when possible.
- Focus on: purpose, constraints, success criteria.

### For features touching both packages

Always clarify:
- Which new socket events (if any) are needed?
- Does game state in Redis need new fields on `GameState` / `HandsType`?
- Does the client need a new Redux action/reducer or Zustand state change?
- Are there any auth or room-membership guards needed?

### Exploring approaches

- Propose 2–3 approaches with trade-offs.
- Lead with your recommendation and the reason.

### Presenting the design

- Present section by section; ask for approval after each.
- Scale depth to complexity: a few sentences for simple changes, up to 200–300 words for nuanced ones.
- Always cover: what changes in the server (game logic, socket handler, service), what changes in the client (Redux slice, socket listener, component), and how they interact.
- Design for isolation: each unit should have one clear purpose and a well-defined interface.
- Where existing code has problems that affect the work (e.g. mixed CJS/ESM in game core, hard-coded CORS origin), include targeted fixes — but don't propose unrelated refactoring.

---

## After the Design

### Writing the spec

- Save to `.claude/specs/YYYY-MM-DD-<topic>.md`
- Commit the spec to git before implementation begins.

### Spec self-review

After writing, check:
- **Placeholders**: any "TBD", "TODO", or vague requirements? Fix them.
- **Consistency**: does the architecture match the feature description? Do event names match the contract?
- **Scope**: is this focused enough for a single implementation pass?
- **Ambiguity**: could any requirement be read two ways? Pick one and make it explicit.

Fix issues inline — no need to re-review after fixing.

### User review gate

After the self-review, ask:

> "Spec written and committed to `.claude/specs/<filename>.md`. Please review it and let me know if you want any changes before we start implementation."

Wait for approval. Make any requested changes, then proceed.

### Transition

Present the approved spec and ask the user how they want to proceed. Do not invoke any other skill automatically.

---

## Key Principles

- One question at a time — don't stack questions.
- YAGNI — remove unnecessary features from all designs.
- Always propose 2–3 approaches before settling.
- Incremental validation — present design, get approval, then write spec.
- Be flexible — revisit earlier decisions when something doesn't hold up.
