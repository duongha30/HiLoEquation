---
name: execute-plan
description: Use when you have a written implementation plan to execute task-by-task with review checkpoints. Loads the plan, runs each step, typechecks, and commits.
---

# Executing Plans

## Overview

Load a plan from `.claude/plans/`, review it critically, execute every task in order, and report when complete.

Announce at start: "I'm using the execute-plan skill to implement this plan."

---

## The Process

### Step 1: Load and Review Plan

- Read the plan file from `.claude/plans/`
- Review critically — identify gaps, ambiguous steps, or conflicts with current codebase state
- If concerns: raise them before touching any code
- If no concerns: create a TodoWrite task list mirroring the plan's tasks, then proceed

### Step 2: Branch Check

Never execute on `master` without explicit user consent. If on `master`, stop and ask which branch to use.

### Step 3: Execute Tasks

For each task in order:

1. Mark task `in_progress` in TodoWrite
2. Follow each step exactly as written — plan steps are bite-sized by design
3. After any code change to the server, run `npm run typecheck` from `hiloequation_server/`
4. After any code change to the client, run `npm run lint` from `hiloequation_client/`
5. If a step adds or renames a socket event, verify the event name exists in **both** `events.ts` files before moving on
6. Commit at the commit step — use the message from the plan
7. Mark task `completed`

### Step 4: Final Verification

After all tasks are complete:

- Run `npm run typecheck` in `hiloequation_server/` (even if no server changes — imports may have shifted)
- Run `npm run lint` in `hiloequation_client/`
- Summarise what was built and which files changed

---

## When to Stop and Ask

Stop immediately and ask when:

- A file the plan references doesn't exist or has moved
- A type, function, or event name the plan references isn't found in the codebase
- A typecheck or lint error introduced by the current task can't be resolved by following the plan
- An instruction is ambiguous and guessing would risk breaking existing behavior
- The plan modifies Redis `GameState` shape — confirm the change won't corrupt in-flight game sessions

Never guess. Raise the blocker, show the error, and wait.

---

## When to Revisit the Plan

Return to review when:

- The user updates the plan based on your feedback
- A discovered constraint makes the planned approach unworkable (e.g., a Redis key collision, a conflicting socket event name already in use)

Don't force through blockers — stop and ask.

---

## Key Rules

- Follow plan steps exactly; don't improvise improvements mid-execution
- Never skip typecheck or lint verifications
- Socket event names must stay in sync between server and client `events.ts` — treat a mismatch as a blocker
- Never commit directly to `master` without explicit user consent
- If the plan says to modify `GameCore`, keep the `module.exports` pattern (it uses CJS export while the rest of the server uses ESM)

---

## Integration

This skill executes plans produced by the `writing-plans` skill.
