---
inclusion: always
---

# Verify Before Done (Hard Rule)

## Core Prohibition

**FORBIDDEN WORDS** unless every applicable check below was run in *this session* and its literal output is pasted as evidence: "done", "fixed", "ready", "should work", "verified", "this will work", "that resolves it".

**If you did not run a command and read its output, you did not verify it.** Describing what a check *would* show is not permitted. Only actual terminal/log output counts as evidence.

If any check was skipped or failed, the required response format is:

> **BLOCKED / INCOMPLETE** — [check name] not run/failed because [reason]. Feature is NOT confirmed working.

Never soften this into a "done, but..." — blocked status goes first, not as a footnote.

## Anti-patterns to catch yourself doing

Before reporting done, check that you have NOT done any of the following:
- Claimed success because the code *compiles in your head* rather than in the terminal.
- Claimed a UI works because the JSX/HTML "looks like it should render that way."
- Claimed parity with a reference by matching intent/vibe instead of actually opening the reference and comparing.
- Silently narrowed scope (implemented a simpler version) and reported it as equivalent to what was asked.
- Reported "no errors" based on absence of visible red text in what you wrote, instead of the actual log/console.

If you notice yourself about to write "should," "likely," or "this looks correct" in a completion claim — stop, that is the signal you have not verified it.

## Auth password safety (non-negotiable)

While verifying UI or API flows, **never** call Supabase Admin `updateUserById` / `createUser` with a `password` field, and never generate temporary passwords for login.

- Use `TEST_USER_EMAIL` + `TEST_USER_PASSWORD` from `.env.local` for authenticated browser checks.
- If login fails during verification, report it — do **not** silently reset the user's password to "make the test pass."
- Intentional password recovery: `ALLOW_PASSWORD_MUTATION=1` + `--confirm` on `scripts/reset-user-password.mjs` only, and only when the user asks.

Run `npm run scripts:check-auth-safety` after changing anything under `scripts/`.

## Required checks (in order, every time)

1. **Build** — `npm run build`. Paste the final lines of output. Zero TS/compile errors.
2. **Dev server** — `npm run dev` on port 3000. If stale/crashed, restart. Paste confirmation it's running.
3. **Key routes respond** — curl or fetch and paste status codes:
   - `/login` → 200
   - `/boq` → 200 (not 500 / DB timeout)
   - `/boq/import` → 200
4. **Logs clean** — read `.next/dev/logs/next-development.log` or terminal output for the changed area. Paste the tail. Zero new ERROR lines.

## UI / interaction changes (mandatory, build+200 is not enough)

- Open the affected page/component.
- Perform the actual primary user flow: click, type, select, submit — not a description of the flow, the actual action.
- Confirm the observable outcome and state it concretely: what data appeared, what the dropdown listed, that there's no overlap/garbled text, no new console errors.

## Clone / parity tasks (e.g. "match ABRD exactly")

This is the failure mode that keeps recurring, so it gets its own explicit step:

- Open the reference implementation and the new implementation **side by side**.
- Diff structure, not vibe: same fields, same order, same conditional logic, same edge-case handling — not "a form with similar fields."
- If the user provided a screenshot, re-check the new UI against that screenshot pixel-by-pixel for the specific elements shown (labels, counts, states) — not just "yes it has a dropdown."
- State explicitly what was compared and what matched/differed. "Matches ABRD" without naming what was checked does not satisfy this rule.

## API / DB changes

- Hit the affected route; paste the actual status code (2xx required).
- If migration required: run `npm run db:migrate` and paste output, or report it failed and the feature is still broken.

## Reporting Format (required)