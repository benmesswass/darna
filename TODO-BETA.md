# TODO-BETA — controls & tests required before Beta

> **Beta = real Konnect sandbox + real OTP channel + invited real users.**
> Everything below must be done **before** opening Beta. Companion to
> `QA_ROADMAP.md` (§14). Each item is actionable and references the real code.
>
> When you implement an item: check it off, link the test file, and flip the
> corresponding row in `QA_ROADMAP.md` to `✅`.

## CI/CD & quality gates
- [ ] Add `vitest run --coverage` and **fail under 70%** lines/branches on `src/lib` + `src/actions` (add coverage to `vitest.config.ts` + CI step).
- [ ] Add **SAST**: CodeQL or `semgrep --config auto` as a CI job.
- [ ] Add **secret scanning**: `gitleaks` as a CI job (and a pre-commit hook).
- [ ] Add **Playwright E2E** project + a `e2e-smoke` CI job (5–8 journeys, against ephemeral PG + seeded data).
- [ ] Add an **integration** test project (real ephemeral Postgres service, like the existing CI Postgres) separate from pure unit tests.
- [ ] Enable **branch protection** on `main`: require all checks + 1 review; require linear history.
- [ ] Keep `npm audit --audit-level=high`; triage and document any accepted advisory.

## Authentication & sessions
- [ ] Implement **reset-password** flow (token TTL, single-use, invalidates active sessions) + tests.
- [ ] Test **session expiration** (NextAuth `maxAge`) and **invalidation on password change** (`src/actions/profile.ts`).
- [ ] Assert session **cookie flags**: HttpOnly, Secure, SameSite (integration).
- [ ] Add **login lockout/backoff** beyond the fixed 15-min window (`src/lib/rate-limit.ts`) + test.
- [ ] JWT hardening tests: reject tampered / `alg:none` / expired tokens.

## Permissions & roles
- [ ] **Permission matrix** regression test: every role × every server action (expected allow/deny).
- [ ] **Mass-assignment** tests: `role`, `kycStatus`, `isWakil`, `verified`, `emailVerified` cannot be set via `profile`/`properties` forms (zod picks explicit fields).
- [ ] Verify role change is re-evaluated on next request (fresh session — `src/lib/session.ts`).

## Reservations
- [ ] Promote D1 (booking-conflict concurrency) from demo unit test to an **integration** test against real PG with true parallel transactions.
- [ ] Test **stale EN_ATTENTE expiry** frees the slot (15-min hold) end-to-end.
- [ ] Decide & test **self-booking** policy (host books own property).
- [ ] Implement & test **cancellation/refund** policy.

## Payments (Konnect)
- [ ] **Webhook signature/HMAC verification** in `src/app/api/payments/konnect/webhook/route.ts` **before** any DB read (currently relies on `payment_ref` opacity + rate limit). _Blocking._
- [ ] **Replay test**: same signed webhook twice → idempotent, single audit.
- [ ] **Simultaneous-reservation + payment-race** integration test (two guests, overlapping dates).
- [ ] D6 price-integrity test promoted to integration (server ignores client total).

## KYC
- [ ] Test **KYC gating** ON: unverified host cannot publish (`src/actions/properties.ts:77-83`).
- [ ] Validate the **real OTP provider** path (SMS / Meta-WhatsApp) in a staging integration test.

## Uploads
- [ ] Integration test: upload action rejects polyglot / wrong-magic / oversized (wires `src/lib/storage.ts`).
- [ ] Enforce & test **max photos per property** at the action layer.
- [ ] **EXIF strip / re-encode** images on upload (anti-geotag, anti-polyglot) + test.

## API / input hardening
- [ ] For every server action: tests for **invalid payload**, **missing required fields**, **excessive payload** (oversized strings/arrays).
- [ ] Confirm **safe generic errors** on provider/DB failure (no stack/PII leak) + audited.

## Security regression (OWASP Beta subset)
- [ ] **CSRF / SameSite**: cross-site POST to a server action is rejected.
- [ ] **Open redirect**: `safeCallbackUrl` (`src/actions/auth.ts:123-132`) rejects external domains — add tests.
- [ ] **SSRF**: outbound to Konnect/Resend/Meta/geocode pinned to allowlisted hosts — add tests.
- [ ] **XSS**: stored content (title/description/review/contact message) output-encoded; CSP regression test for `src/middleware.ts`.
- [ ] **Rate-limit bypass**: `x-forwarded-for` spoofing blocked when `TRUSTED_PROXY` unset (`src/lib/rate-limit.ts:44-48`).
- [ ] **Headers regression** test: HSTS, X-Frame-Options DENY, nosniff, CSP nonce present on responses.

## Database
- [ ] **Unique-constraint** tests: `email`, `cinHash`, `slug`, `paymentRef`, `Review.bookingId`, `Favorite[userId,propertyId]`.
- [ ] **FK cascade** tests (`onDelete: Cascade`/`SetNull`): delete user → bookings/properties cascade; delete folder → favorites `SetNull`.
- [ ] **Rollback** test: down-migration / restore to previous schema.
- [ ] **Transaction atomicity** tests: booking create, photo reorder (`$transaction`).

## Observability
- [ ] Define error budget; alert on auth-failure spike, payment-failure, 5xx rate.
- [ ] Confirm `OBSERVABILITY_WEBHOOK_URL` wired in staging (`src/lib/observability.ts`).
