---
inclusion: always
---

# Security

Business authorization: `docs/MASTER_SPECIFICATION.md` §7.

## Authentication (v1)

- Supabase Auth — email/password at request boundary.
- Build `RequestContext` from verified session — never trust client-supplied identity.

## Secrets

- Environment variables via `infrastructure/config/env.ts` — typed, fail fast.
- Never commit `.env.local` · redact tokens/keys in logs.
- AI keys server-side only.

## Authorization

- Enforce in use cases — UI hides, server enforces.
- Publish: GM, Technical Office Manager, System Administrator only.
- Fail closed: 403 for unauthorized.

## Auth scripts (local dev)

- **Never mutate Supabase Auth passwords** in `scripts/verify-*`, `scripts/diagnose-*`, Playwright flows, or agent verification steps.
- Browser/UI verification must log in with `TEST_USER_EMAIL` + `TEST_USER_PASSWORD` from `.env.local` via `scripts/lib/auth-script-guard.mjs`.
- Intentional password resets: `scripts/reset-user-password.mjs` only, with `ALLOW_PASSWORD_MUTATION=1` **and** `--confirm` on the command line.
- Do not run password reset scripts against production user accounts during feature verification.
