# Darna — QA, Security & Release Roadmap

> **Permanent reference.** This document is the single source of truth for what
> quality, security and reliability controls protect Darna **today (Demo)**, and
> what must be added **before Beta** and **before Production**.
>
> Guiding principle: _we optimize for speed today, but we document everything
> that must be added later so that no important quality or security control is
> forgotten before public launch._
>
> **Maintenance rule:** when a test/control listed here as `❌`/`⚠️` is
> implemented, move it to `✅` and note the file. When a feature is added, add
> its rows here **before** merging. A PR that introduces a sensitive surface
> (auth, payment, KYC, upload, permission) without updating this file should be
> blocked in review.

- **Stack:** Next.js 15 (App Router, Server Actions) · TypeScript strict · Prisma/PostgreSQL · NextAuth (credentials, JWT) · zod · Vitest · Redis (ioredis) · Konnect (escrow, optional).
- **Phases:** `Demo` (current, mocks assumed) → `Beta` (real payments/KYC, invited users) → `Production` (public, untrusted traffic, regulated payments).
- **Legend:** `✅` implemented & tested · `⚠️` implemented but not (fully) tested · `❌` not implemented/tested · Priority `P0` (blocker) `P1` (high) `P2` (medium) `P3` (low).

---

## 0. Table of contents

1. [Current state snapshot](#1-current-state-snapshot)
2. [Phase definitions & coverage targets](#2-phase-definitions--coverage-targets)
3. [Demo-critical tests (implement now)](#3-demo-critical-tests-implement-now)
4. [Master test matrix (per feature × test type × phase)](#4-master-test-matrix)
5. [Security test matrix (OWASP Top 10 / CWE Top 25)](#5-security-test-matrix-owasp--cwe)
6. [Payment test suite (bank-grade)](#6-payment-test-suite-bank-grade)
7. [Auth test suite](#7-auth-test-suite)
8. [API / endpoint test checklist](#8-api--endpoint-test-checklist)
9. [Database test suite](#9-database-test-suite)
10. [CI/CD quality gates & thresholds](#10-cicd-quality-gates--thresholds)
11. [Code review checklist](#11-code-review-checklist)
12. [Release checklist](#12-release-checklist)
13. [Risks if omitted](#13-risks-if-omitted)
14. [Execution roadmap (prioritized)](#14-execution-roadmap-prioritized)

---

## 1. Current state snapshot

Darna already ships with a **security-conscious architecture and a real test
suite**. This is not a greenfield "demo" — many production controls already
exist. The roadmap below is therefore **gap-driven**, not a rewrite.

**Already implemented & tested (`✅`):**

| Area | Control | Code | Test |
|------|---------|------|------|
| Auth | bcrypt cost=12, timing-attack-resistant compare, generic errors (anti-enumeration) | `src/lib/auth.ts`, `src/actions/auth.ts` | `auth-register.test.ts` |
| Auth | Rate limiting 5/15min/IP, Redis + in-memory fallback | `src/lib/rate-limit.ts` | `rate-limit*.test.ts` |
| Reservations | Double-booking guard: `$transaction` SERIALIZABLE + atomic conflict check | `src/actions/bookings.ts:140-187` | ⚠️ state transitions only |
| Payments | Idempotent settlement via `updateMany({where:{status:"EN_ATTENTE"}})` | `src/lib/payments.ts:106-114` | `payments.test.ts` |
| Payments | Server-side amount re-verification (reject underpayment) | `src/lib/payments.ts:77-84` | `payments.test.ts` |
| Payments | Expiry guard (cancel if paid after deadline) | `src/lib/payments.ts:91-100` | `payments.test.ts` |
| KYC | CIN encrypted at rest (AES-256-GCM), mandatory in prod | `src/lib/crypto.ts` | `crypto.test.ts` |
| KYC | CIN uniqueness via deterministic hash + DB unique index | `src/lib/crypto.ts`, schema `User.cinHash` | `kyc-actions.test.ts` |
| KYC | OTP: hashed storage, 10-min TTL, 5-attempt cap, purpose isolation | `src/lib/otp.ts` | `otp.test.ts`, `otp-channel.test.ts` |
| Uploads | MIME + size + **magic-byte signature** validation | `src/lib/storage.ts:34-72` | `storage.test.ts` |
| Headers | CSP per-request nonce, HSTS, X-Frame-Options DENY, nosniff | `src/middleware.ts`, `next.config.ts` | ❌ |
| Audit | Audit trail on every sensitive action (user, IP, metadata) | `src/lib/audit.ts` | indirectly |
| Config | Boot-time `env.ts` fail-fast (prod requires enc key, SMS, trusted proxy, S3) | `src/lib/env.ts` | `modes.test.ts`, `kyc-gating.test.ts` |

**Existing test files (21):** `admin`, `auth-register`, `booking-gate`,
`bookings`, `cache`, `crypto`, `email-actions`, `konnect`, `kyc-actions`,
`kyc-gating`, `mailer`, `modes`, `observability`, `otp`, `otp-channel`,
`payments`, `rate-limit`, `rate-limit-keyed`, `rate-limit-redis`, `storage`,
`verticals`.

**Confirmed gaps (the focus of this roadmap):**

- ⚠️ **No concurrency test** proving two overlapping bookings → exactly one wins.
- ⚠️ **No IDOR/negative-authorization tests** (user A acting on user B's booking/property/profile).
- ✅ **Webhook signature verification** implemented (`signKonnectWebhook`/`verifyKonnectWebhook`, HMAC-SHA256 constant-time, `src/lib/konnect.ts`) and tested (`tests/konnect.test.ts`, `tests/host-invoice-webhook.test.ts`, `tests/api/webhook-konnect.spec.ts` for the traveler webhook's HTTP-level gates). This bullet incorrectly said "missing" — corrected 2026-07-08.
- ❌ **No E2E tests** (no browser-level journeys for signup → KYC → booking → payment).
- ❌ **No session lifecycle tests** (expiration, invalidation on password change).
- ❌ **No CSRF / SSRF / mass-assignment / open-redirect regression tests** (some controls exist in code, none asserted).
- ❌ **No DB migration/rollback/integrity tests** beyond `migrate deploy` in CI.
- ❌ **No coverage gate** in CI (suite runs but coverage is not measured/enforced).

---

## 2. Phase definitions & coverage targets

| Dimension | **Demo** (now) | **Beta** | **Production** |
|-----------|----------------|----------|----------------|
| Audience | Internal / invited, mock money | Invited users, **real** Konnect sandbox + real OTP | Public, untrusted traffic, real funds |
| Unit tests | Critical paths green (no hard %) | **≥70%** lines/branches on `src/lib` + `src/actions` | **≥85%** on critical modules, **≥80%** global |
| Integration | Optional | All server actions: happy + auth-fail + ownership-fail | All actions + edge/error paths, against ephemeral PG |
| E2E | None (or 1 smoke) | 5–8 critical journeys (Playwright) | Full role matrix + cross-browser + mobile |
| Security tests | Unit-level guards that exist | OWASP A01/A02/A03/A05/A07 automated + headers regression | Full OWASP Top 10 + CWE Top 25 + annual pentest/DAST |
| Payment tests | Idempotency/amount/expiry (✅) | + webhook signature, replay, reconciliation | + bank-grade fraud/replay/race suite, chargeback flow |
| Load/concurrency | None | Booking-conflict concurrency test | Sustained load + soak + chaos |
| CI gates | build, lint, tsc, test, migrate, audit-high | + coverage gate, SAST, secret scan, E2E smoke, branch protection | + DAST, container/SBOM scan, load gate, migration safety, canary |
| DB | `migrate deploy` validates drift | + rollback test, referential-integrity test | + backup/restore drill, PITR, data-corruption detection |
| Observability | structured logs + optional webhook | error budget defined, alerts on auth/payment failures | full SLOs, tracing, on-call, runbooks |

---

## 3. Demo-critical tests (implement now)

These are the **only** new tests worth adding for the demo. Everything else in
the existing suite already protects the demo and must simply **stay green**.
Rationale: the demo's promise is "verified listings + safe booking + a payment
that never double-charges." The guards exist in code; the demo gap is that the
**failure paths are unproven**.

| # | Test | Priority | Risk covered | Why needed now |
|---|------|----------|--------------|----------------|
| D1 | **Booking conflict**: two overlapping bookings on the same property → exactly one `CONFIRMEE`, the other rejected (`BookingConflictError`) | **P0** | Double-booking / money taken for an unavailable property | The SERIALIZABLE transaction (`bookings.ts:140-187`) is the single most fragile invariant; a refactor could silently break it. Untested = unprotected. |
| D2 | **Booking IDOR**: user B cannot `confirmPaymentAction`/`startKonnectPaymentAction`/`submitReviewAction` on user A's booking | **P0** | Horizontal privilege escalation; payment/review on someone else's reservation | Authorization is in demo scope; the `guestId === user.id` check (`bookings.ts:323`) must be proven. |
| D3 | **Property IDOR**: user B cannot edit / delete / add photos / block dates on user A's property | **P0** | Tampering with other hosts' listings | `requireOwnProperty()` is relied upon across ~10 mutations; one missing call = full IDOR. |
| D4 | **Role gate negatives**: `requireUser/requireLister/requireAdmin/requireWakilOrAdmin` reject the wrong role | **P0** | Vertical privilege escalation (a VOYAGEUR reaching admin/listing actions) | Cheap, high-value; guards live in one file (`src/lib/session.ts`). |
| D5 | **Mock payment exclusivity**: `confirmPaymentAction` (demo escrow) refuses to run when Konnect is enabled | **P1** | A real booking being "confirmed" without real money | Prevents demo/real mode confusion (`bookings.ts:311`). |
| D6 | **Price integrity**: server ignores any client-supplied price; total is recomputed from `nights × nightlyPrice + serviceFee` | **P1** | Amount manipulation at booking time | Confirms the "prices always recalculated server-side" invariant. |
| D7 | **Upload rejection E2E-lite**: a polyglot/oversized/wrong-magic file is rejected by the action (not only the lib) | **P2** | Malicious upload reaching disk/S3 | `storage.test.ts` covers the lib; this proves the action wires it. |
| D8 | **Host cancellation IDOR**: host B cannot `hostCancelBookingAction` on host A's property/booking | **P0** | Tampering with another host's reservations (fake cancellation, forced refund/suspension against a rival) | `ANNULATION_HOTE_ROADMAP.md` §AH7. Test: `tests/host-cancellation-security.test.ts`. |
| D9 | **Host cancellation idempotence**: a 2nd cancel attempt on an already-`ANNULEE` booking (explicit status check + `updateMany` race guard) does not double-apply the listing block or the account suspension | **P0** | Double-punishment / suspension counter drift under double-click or concurrent requests | Test: `tests/host-cancellation-security.test.ts`. |
| D10 | **Host cancellation block-tier non-bypass**: the blocking duration (3/15/30 days) is recomputed server-side from `booking.checkIn` — the form only sends `bookingId`, no client-controlled tier | **P1** | A host forcing the shortest block regardless of real notice given | Test: `tests/host-cancellation-security.test.ts`. |
| D11 | **Blocked listing unreachable via direct link**: `createBookingAction` AND `quoteBookingAction` both refuse a booking on a listing still under `cancelBlockedUntil`, even when the search filter is bypassed by guessing/bookmarking the URL | **P0** | A blocked (reputationally sanctioned) listing still taking real bookings | Found via live testing that `quoteBookingAction` was missing the check (quote looked valid, only the final submit rejected it) — fixed in the same pass. Test: `tests/host-cancellation-security.test.ts`. |
| D12 | **Rebooking discount token security**: usage-once (atomic `updateMany` re-check), bound to the correct guest only, rejects a tampered signature, expires after `REBOOKING_DISCOUNT_VALIDITY_DAYS` | **P1** | A discount replayed on multiple bookings, or transferred/guessed by another account | Test: `tests/rebooking-discount.test.ts`. |
| D13 | **Host cancellation atomicity**: the critical core (booking flip → listing block → account suspension) runs inside a single Serializable `$transaction` — a failure after the `ANNULEE` flip rolls back instead of leaving a partial, non-recoverable state (idempotence guard would otherwise block any retry from applying the missing block/suspension) | **P0** | A booking stuck `ANNULEE` with no listing block and no suspension, forever un-retriable — a host cancels with zero reputational/visibility penalty | `ANNULATION_HOTE_CORRECTIFS_ROADMAP.md` §AHC2. Notification/e-mail/audit stay best-effort outside the tx. Test: `tests/host-cancellation-security.test.ts` (rollback on `property.update` failure). |

> **Scope discipline:** do **not** add CSRF/SSRF/E2E/load tests for the demo —
> they are documented in §5/§4 for Beta/Production. Adding them now violates
> "don't overload the project with hundreds of tests at this stage."

---

## 4. Master test matrix

Per feature × test type. `Status` reflects today. `Phase` = when the missing
work is due.

### 4.1 Authentication
| Test | Type | Status | Phase | Prio | Risk covered |
|------|------|--------|-------|------|--------------|
| Register: OTP issued, code never leaked, anti-enumeration | unit | ✅ | Demo | P0 | Account enumeration, OTP leak |
| Login: bcrypt compare, timing-resistant, generic error | unit | ✅ | Demo | P0 | Credential stuffing, user enumeration |
| Login rate limiting 5/15min/IP | unit | ✅ | Demo | P0 | Brute force |
| Password policy (≥8, ≥1 digit), reuse prevention on change | unit | ✅ | Demo | P1 | Weak/recycled passwords |
| Login/logout E2E (browser, cookie set/cleared) | E2E | ❌ | Beta | P1 | Broken auth flow regressions |
| Reset-password flow (token TTL, single-use, invalidates sessions) | unit+integration | ❌ (feature not built) | Beta | P0 | Account takeover via reset |
| Lockout/backoff after N failures (beyond fixed window) | unit | ❌ | Beta | P2 | Distributed brute force |

### 4.2 Sessions
| Test | Type | Status | Phase | Prio | Risk covered |
|------|------|--------|-------|------|--------------|
| Session user fetched fresh from DB each request | unit | ⚠️ (code: `session.ts:22-42`) | Demo | P1 | Stale role/KYC after change |
| Session expiration (JWT maxAge) enforced | integration | ❌ | Beta | P1 | Indefinite sessions |
| Session invalidation on password change | integration | ❌ | Beta | P0 | Hijacked session survives reset |
| Cookie flags: HttpOnly, Secure, SameSite | integration | ❌ | Beta | P0 | Session theft via XSS/CSRF |
| Concurrent-session / device revocation | integration | ❌ | Production | P2 | Stolen-device persistence |

### 4.3 User management
| Test | Type | Status | Phase | Prio | Risk covered |
|------|------|--------|-------|------|--------------|
| Profile update validation (name, phone E.164) | unit | ⚠️ | Demo | P2 | Bad data |
| Phone change resets `phoneVerified` | unit | ⚠️ (code: `profile.ts:48`) | Demo | P1 | Trust badge without re-verify |
| Avatar upload validated (MIME/size/magic) | unit | ⚠️ | Demo | P2 | Malicious avatar |
| Mass-assignment: `role`/`kycStatus`/`isWakil` not settable via profile form | integration | ❌ | Beta | P0 | Privilege escalation via form fields |
| Account deletion / RGPD export | integration | ❌ (feature) | Production | P1 | GDPR non-compliance |

### 4.4 KYC
| Test | Type | Status | Phase | Prio | Risk covered |
|------|------|--------|-------|------|--------------|
| Phone OTP verify sets `phoneVerified`; bad code = no change | unit | ✅ | Demo | P0 | Fake verification |
| CIN requires verified phone first | unit | ✅ | Demo | P1 | Out-of-order verification |
| CIN uniqueness across accounts (hash) | unit | ✅ | Demo | P0 | Identity duplication/fraud |
| CIN encrypted at rest; plaintext only in demo | unit | ✅ | Demo | P0 | PII exposure at rest |
| KYC mode cannot be "demo" with a real OTP channel | unit | ✅ | Demo | P0 | Fake verification with real channel |
| KYC gating blocks unverified hosts from listing (when on) | integration | ❌ | Beta | P1 | Unvetted listers |
| CIN format / liveness / document-check (real KYC provider) | integration | ❌ | Production | P0 | Synthetic identity |

### 4.5 Reservations
| Test | Type | Status | Phase | Prio | Risk covered |
|------|------|--------|-------|------|--------------|
| Booking gate: requires verified email **and** phone | unit | ✅ | Demo | P0 | Anonymous/unverified booking |
| **Double-booking conflict → one winner** (concurrency) | unit/integration | ⚠️→ **D1** | **Demo** | **P0** | Double-booking |
| Stale EN_ATTENTE expires (15 min) and frees the slot | unit | ⚠️ | Demo | P1 | Inventory locked by abandoned holds |
| Guest count ≤ maxGuests; dates ≥ today; 1–90 nights | unit | ⚠️ | Demo | P1 | Invalid reservations |
| Booking IDOR (confirm/pay/review on other's booking) | unit → **D2** | ⚠️→ **D2** | **Demo** | **P0** | Horizontal escalation |
| State machine CONFIRMEE→TERMINEE, escrow lifecycle | unit | ✅ | Demo | P1 | Wrong financial state |
| Self-booking (host books own property) policy | unit | ❌ | Beta | P2 | Review/ranking gaming |
| Cancellation/refund policy | integration | ❌ (feature) | Beta | P1 | Refund disputes |
| Host cancellation IDOR + idempotence + block-tier non-bypass | unit → **D8-D10** | ✅ | Demo | P0 | Tampering / double-punishment / forced-shortest-block |
| Blocked listing unreachable via direct link (create + quote) | unit → **D11** | ✅ | Demo | P0 | Sanctioned listing still bookable |
| Rebooking discount token: usage-once, guest-bound, tamper/expiry-proof | unit → **D12** | ✅ | Demo | P1 | Discount replay/theft |
| Host cancellation atomicity (booking + block + suspension in one tx) | unit → **D13** | ✅ | Demo | P0 | Partial, un-retriable cancel state |

### 4.6 Payments → see [§6](#6-payment-test-suite-bank-grade)

### 4.7 Uploads
| Test | Type | Status | Phase | Prio | Risk covered |
|------|------|--------|-------|------|--------------|
| MIME + size + magic-byte validation | unit | ✅ | Demo | P0 | Malicious/oversized files |
| Random filename (no user input → no traversal) | unit | ⚠️ (code: `storage.ts:75`) | Demo | P0 | Path traversal |
| Delete path guard (`/uploads/` regex) | unit | ⚠️ | Demo | P1 | Arbitrary file delete |
| Action wires validation (D7) | integration | ❌→ **D7** | Demo | P2 | Bypass at action layer |
| Max photos per property enforced | integration | ⚠️ | Beta | P2 | Storage abuse |
| S3 SigV4 signing + private ACL + content-type pinning | integration | ❌ | Production | P0 | Public/overwritten objects |
| Image re-encode/strip EXIF (anti-polyglot, anti-geotag) | unit | ❌ | Production | P1 | Polyglot exec / PII leak via EXIF |

### 4.8 Messaging
> Darna has **no real messaging yet** — only `ContactRequest` (public contact form).
| Test | Type | Status | Phase | Prio | Risk covered |
|------|------|--------|-------|------|--------------|
| Contact form: valid active non-SEJOUR property, rate-limited | unit | ⚠️ | Demo | P2 | Spam, contact on invalid listing |
| Stored-XSS in message body (output encoding) | integration | ❌ | Beta | P0 | Stored XSS to host |
| Real inbox: authz (only participants), abuse reporting | E2E | ❌ (feature) | Production | P1 | Cross-user message access |

### 4.9 Administration
| Test | Type | Status | Phase | Prio | Risk covered |
|------|------|--------|-------|------|--------------|
| `verifyPropertyAction` requires wakil/admin + owner KYC verified | unit | ✅ | Demo | P0 | Unverified listing gets badge |
| Wakil review requires admin; promotion atomic | unit | ✅ | Demo | P0 | Self-promotion to Wakil/Admin |
| Soft/hard delete requires admin | unit | ⚠️ | Demo | P1 | Unauthorized deletion |
| Admin actions fully audited | integration | ⚠️ | Beta | P1 | No forensic trail |
| Admin UI authz (server-enforced, not just hidden nav) | E2E | ❌ | Beta | P0 | Hidden-but-reachable admin routes |

### 4.10 API (Server Actions + `/api/*`) → see [§8](#8-api--endpoint-test-checklist)

### 4.11 Permissions
| Test | Type | Status | Phase | Prio | Risk covered |
|------|------|--------|-------|------|--------------|
| Role gate negatives (D4) | unit → **D4** | ⚠️→ **D4** | **Demo** | **P0** | Vertical escalation |
| Ownership gate negatives (D2/D3) | unit → **D2/D3** | ⚠️ | **Demo** | **P0** | Horizontal escalation (IDOR) |
| Feature-flag gating (vertical disabled → action refused) | unit | ✅ (`verticals.test.ts`) | Demo | P1 | Bypassing disabled module |
| Permission matrix regression (every role × every action) | integration | ❌ | Beta | P1 | Permission drift over time |

### 4.12 Role management
| Test | Type | Status | Phase | Prio | Risk covered |
|------|------|--------|-------|------|--------------|
| Role assignment is server-only / manual (no public escalation) | integration | ⚠️ | Beta | P0 | Self-escalation |
| `isWakil` promotion only via admin review | unit | ✅ | Demo | P0 | Unauthorized trust role |
| Role change re-evaluated on next request (fresh session) | integration | ❌ | Beta | P1 | Stale elevated session |

### 4.13 Product instrumentation / analytics (`INSTRUMENTATION_ROADMAP.md` §IN0–IN2)
| Test | Type | Status | Phase | Prio | Risk covered |
|------|------|--------|-------|------|--------------|
| `trackEvent` action: zod validation, client event-name allowlist, rate-limit | unit | ✅ (`tests/track-event.test.ts`) | Demo | P2 | Forged/arbitrary event names or userId spoofing from client |
| `SHARE_CLICKED` (native/copy/whatsapp channels) | unit | ✅ (`tests/components/share-button.test.tsx`) | Demo | P3 | Silent metric drift |
| `SAVED_SEARCH_CREATED` (metadata: city/prixMin/prixMax) | unit | ✅ (`tests/saved-search-events.test.ts`) | Demo | P3 | Silent metric drift |
| `MAP_INTERACTED` (first `dragstart` or zoom-control click, session-deduped via `sessionStorage`) | unit | ⚠️ (`src/components/map/MapInner.tsx`) | Demo | P2 | Session dedup or event trigger regresses silently — no test would catch it (PR #173) |
| `SIMULATOR_USED` (fires on every `/dashboard/yield` load when `properties.length > 0`) | unit | ⚠️ (`src/app/dashboard/yield/page.tsx`) | Demo | P2 | Empty-state gate or metadata shape regresses silently (PR #173) |

---

## 5. Security test matrix (OWASP & CWE)

For each: **attack scenario** → **tests to create** → **protections to verify** (in code today).

| Vuln (OWASP/CWE) | Attack scenario | Tests to create | Protection to verify | Status | Phase |
|------------------|-----------------|-----------------|----------------------|--------|-------|
| **Broken Access Control** (A01 / CWE-284, 639) | User B confirms/pays/edits user A's booking/property via crafted ID | D2, D3, D4 + permission matrix | `requireOwnProperty`, `guestId===user.id`, role gates (`session.ts`) | ⚠️ | Demo→Beta |
| **IDOR** (CWE-639) | Enumerate cuid/slug to act on others' resources | Negative authz tests per action | Server-side ownership check on every mutation | ⚠️ | Demo |
| **Auth failures** (A07 / CWE-287, 307) | Brute force, credential stuffing, enumeration | login lockout, timing, rate-limit (✅) | bcrypt+dummy compare, generic errors, rate-limit | ✅/⚠️ | Demo→Beta |
| **Session hijacking** (CWE-384) | Steal/replay cookie; session survives password reset | cookie flags, expiry, invalidation tests | NextAuth JWT config, fresh DB session | ❌ | Beta |
| **Privilege escalation** (CWE-269) | VOYAGEUR reaches admin/listing actions; self-set role | D4 + mass-assignment test | role gates, no role field in mutable schemas | ⚠️ | Demo→Beta |
| **Injection / SQLi** (A03 / CWE-89) | Malicious input in search/filters | param/edge tests; assert Prisma params (no raw SQL) | Prisma parameterized queries; **invariant: no raw SQL** | ⚠️ | Beta |
| **XSS** (A03 / CWE-79) | Stored script in title/description/review/message | output-encoding tests; CSP regression | React auto-escaping, CSP nonce, single `dangerouslySetInnerHTML` (`JsonLd.tsx`) | ❌ | Beta |
| **CSRF** (CWE-352) | Cross-site POST to a server action | CSRF/Origin tests; SameSite cookie test | Next server-action origin checks, SameSite cookies | ❌ | Beta |
| **SSRF** (A10 / CWE-918) | Outbound to Konnect/Resend/Meta/geocode coerced to internal host | URL allowlist tests | pin base URLs; no user-controlled outbound host | ❌ | Beta |
| **Mass assignment** (CWE-915) | Extra form fields set `role`/`kycStatus`/`verified` | zod-strict / extra-field tests | zod schemas pick explicit fields | ⚠️ | Beta |
| **Open redirect** (CWE-601) | `callbackUrl` to attacker domain | redirect allowlist tests | `safeCallbackUrl` (`auth.ts:123-132`) | ⚠️ | Beta |
| **File upload attacks** (CWE-434) | Polyglot, SVG-with-script, oversized | D7 + EXIF/re-encode tests | magic-byte validation, MIME allowlist, size cap, SVG CSP sandbox | ⚠️ | Demo→Prod |
| **Path traversal** (CWE-22) | `../` in upload/delete path | traversal tests | random filenames, `/uploads/` delete regex | ⚠️ | Beta |
| **Secret exposure** (CWE-798, 200) | Keys in logs/bundle/`NEXT_PUBLIC_` | secret-scan in CI; bundle assertion | server-only libs, `env.ts`, never `NEXT_PUBLIC_` for keys | ⚠️ | Beta |
| **Rate-limit bypass** (CWE-770) | Rotate IP / spoof `x-forwarded-for` | proxy-trust tests | trusted-proxy IP extraction, prod fail-closed | ⚠️ | Beta |
| **Brute-force login** (CWE-307) | Password spray | covered by rate-limit (✅) + lockout test | rate-limit per IP+action | ✅/⚠️ | Demo→Beta |
| **Business-logic abuse** | Book→cancel→rebook to lock inventory; review without stay | expiry test, review-FK test | 15-min expiry, `Review.bookingId` FK | ⚠️ | Beta |
| **Payment abuse** | Underpay, tamper amount, double-confirm | covered (✅) + see §6 | server amount recompute, idempotent settle | ✅ | Demo |
| **Replay attacks** (CWE-294) | Replay Konnect webhook | webhook signature + idempotency-key test | idempotent `updateMany`, per-ref rate-limit, HMAC signature (`verifyKonnectWebhook`) | ✅ `tests/konnect.test.ts`, `tests/api/webhook-konnect.spec.ts` | Demo |
| **Race conditions** (CWE-362) | Concurrent booking / settlement | D1 + settlement-race test (⚠️ partial) | SERIALIZABLE tx, `updateMany` gate | ⚠️ | Demo |

---

## 6. Payment test suite (bank-grade)

Target: **near-banking** confidence. Konnect escrow has two modes (simulated by
default; real via `KONNECT_*`). Settlement lives in `src/lib/payments.ts`
(`settleKonnectBooking`, intentionally **not** a `"use server"`).

| Scenario | Test to create | Expected guarantee | Status | Phase |
|----------|----------------|--------------------|--------|-------|
| Double payment | Two settle calls, same ref | Only first mutates; second is a no-op | ✅ `payments.test.ts` | Demo |
| Webhook replay | Same webhook GET twice | Idempotent; no double-confirm, no double-audit | ⚠️ (idempotent yes, **signature no**) | Beta |
| Payment cancelled | Settle on `ANNULEE` booking | Returns `ANNULEE`, no funds moved | ✅ | Demo |
| Payment expired | Pay after `expiresAt` | Auto-cancel, no confirm | ✅ (`payments.ts:91-100`) | Demo |
| Confirmed multiple times | Concurrent webhook + return page | Single `CONFIRMEE`, single audit | ✅ (race test) | Demo |
| Simultaneous reservation | Two guests pay overlapping dates | One CONFIRMEE; other refunded/cancelled | ⚠️ (needs D1 + payment-race) | Beta |
| User fraud (amount tamper) | `reachedAmount < expected` | Reject (no confirm) | ✅ | Demo |
| Amount manipulation (client) | Client posts lower total | Server recomputes; client value ignored | ⚠️ (D6) | Demo |
| Access others' reservation | Pay/confirm someone else's booking | Rejected (ownership) | ⚠️ (D2) | Demo |
| **Webhook authenticity** | Forged webhook with guessed ref | Reject without valid signature/HMAC | ❌ **(must add)** | Beta |
| Currency precision | TND→millimes rounding | No truncation/over-charge | ✅ `konnect.test.ts` | Demo |
| Reconciliation | Konnect status vs local state mismatch | Detect & alert; never silent loss | ❌ | Production |
| Chargeback / dispute | Dispute opened post-settlement | State + audit + escrow handling | ❌ (feature) | Production |
| Escrow release safety | Release only on TERMINEE & EN_SEQUESTRE | No early/duplicate release | ✅ `bookings.test.ts` | Demo |
| Partial/failed refund | Refund fails mid-way | Idempotent retry, consistent state | ❌ | Production |

**Production payment invariants to enforce & test:**
1. No state transition without server-side amount verification.
2. Every settlement is idempotent on `paymentRef` (DB-unique).
3. Webhook authenticity verified (signature/HMAC) **before** any DB read.
4. All money events audited (immutable trail, 90-day+ retention).
5. EUR display is UI-only; the charged amount is always TND.

### 6.1 HostInvoice test suite (Rail 2 — paiement sur place)

Same bar as §6, applied to `HostInvoice` (commission owed by the HOST to
Darna on a `SUR_PLACE` booking — the guest pays the host directly, nothing
to Darna; the host settles the invoice via Konnect or the demo fallback).
Settlement lives in `src/lib/host-invoicing.ts` (`settleHostInvoice`,
intentionally **not** a `"use server"`, mirrors `settleKonnectBooking`).
`PAIEMENT_SUR_PLACE_ROADMAP.md` PSP1-PSP8.

| Scenario | Test to create | Expected guarantee | Status | Phase |
|----------|----------------|---------------------|--------|-------|
| Double settlement | Two `settleHostInvoice` calls, same ref | Only first mutates; second is a no-op | ✅ `host-invoicing.test.ts` | Demo |
| Settlement race (webhook vs return page) | Concurrent settle, `updateMany` count 0 on the loser | Single `PAYEE`, single audit | ✅ `host-invoicing.test.ts` | Demo |
| Amount tamper | `reachedAmount < expected` | Reject (`ERREUR`, no confirm) | ✅ `host-invoicing.test.ts` | Demo |
| Unknown reference | Settle with an unrecognized `paymentRef`/`invoiceId` | `INTROUVABLE`, harmless no-op | ✅ `host-invoicing.test.ts` | Demo |
| Payment IDOR | Host B initiates/confirms host A's invoice payment (`payHostInvoiceAction`, `confirmHostInvoiceAction`) | Rejected — `invoice.hostId !== user.id` | ✅ `host-invoice-payment.test.ts` | Demo |
| Demo/real exclusivity | `confirmHostInvoiceAction` while Konnect is enabled | No-op, never settles | ✅ `host-invoice-payment.test.ts` | Demo |
| **Webhook authenticity** | Forged/missing signature on `host-invoice-webhook` | Reject (401) without valid HMAC (`verifyKonnectWebhook`), same guard as the booking webhook | ✅ `host-invoice-webhook.test.ts` | Demo |
| Webhook rate limiting | Hammering one `iid` | 429 beyond the per-invoice cap | ✅ `host-invoice-webhook.test.ts` | Demo |
| Recovery lever non-bypass | `hasOverdueHostInvoice` toggles false→true→false around settlement, no field to resync | ✅ `host-invoicing.test.ts` (`hasOverdueHostInvoice` — proves instant reappearance) | Demo |
| Cash-terms non-bypass | Host flips `cashPaymentEnabled` false→true without accepting CGU, or re-toggles an already-active mode | Rejected on first transition without acceptance; no re-acceptance forced when already active (`cashTermsAcceptedAt` untouched) | ✅ `cash-payment-terms-bypass.test.ts` | Demo |
| View IDOR (`/dashboard/factures/[id]`) | Host B opens host A's invoice URL directly | `notFound()` — `invoice.hostId !== user.id` (`src/app/dashboard/factures/[id]/page.tsx:59`) | ⚠️ guarded in code, not unit-tested (no Server Component test harness in this suite — same gap as other page-level ownership checks) | Demo |
| Reconciliation | Konnect status vs local `HostInvoice` mismatch | Detect & alert; never silent loss | ❌ | Production |

### 6.2 FeaturedOrder test suite (mise en avant « à la une », MONETISATION_IMMO_ROADMAP.md §MI0)

Same bar as §6, applied to `FeaturedOrder` (achat/prolongation du boost
« à la une » — `Property.featuredUntil`). Settlement lives in
`src/lib/featured-payments.ts` (`settleFeaturedOrder`, intentionally **not**
a `"use server"`, mirrors `settleHostInvoice`/`settleKonnectBooking`). Le
mock démo (`featureListingAction`) reste le fallback quand Konnect est
désactivé — jamais les deux à la fois (garde d'exclusivité, comme AH/PSP).

| Scenario | Test to create | Expected guarantee | Status | Phase |
|----------|----------------|---------------------|--------|-------|
| Double settlement | Two `settleFeaturedOrder` calls, same ref | Only first mutates/extends `featuredUntil`; second is a no-op | ✅ `featured-payments.test.ts` | Demo |
| Settlement race (webhook vs return page) | Concurrent settle, `updateMany` count 0 on the loser | Single `PAYEE`, single boost extension, single audit | ✅ `featured-payments.test.ts` | Demo |
| Amount tamper | `reachedAmount < expected` | Reject (`ERREUR`, no confirm, no extension) | ✅ `featured-payments.test.ts` | Demo |
| Unknown reference | Settle with an unrecognized `paymentRef`/`orderId` | `INTROUVABLE`, harmless no-op | ✅ `featured-payments.test.ts` | Demo |
| Cumulative extension | Settle while a previous boost is still active | Extends from the remaining `featuredUntil`, not from now | ✅ `featured-payments.test.ts` | Demo |
| Payment IDOR | Host B initiates the boost payment for host A's listing (`startFeaturedOrderPaymentAction`) | Rejected — `property.ownerId !== user.id` | ✅ `featured-payment-idor.test.ts` | Demo |
| Ineligible listing | Boost a non-`ACTIVE`/expired listing | Rejected before any `FeaturedOrder`/Konnect call | ✅ `featured-payment-idor.test.ts` | Demo |
| Demo/real exclusivity | `featureListingAction` while Konnect is enabled | No-op, never applies the mock effect | ✅ `featured-payment-idor.test.ts` | Demo |
| **Webhook authenticity** | Forged/missing signature on `featured-webhook` | Reject (401) without valid HMAC (`verifyKonnectWebhook`), same guard as the booking/host-invoice webhooks | ✅ `featured-webhook.test.ts` | Demo |
| Webhook rate limiting | Hammering one `fid` | 429 beyond the per-order cap | ✅ `featured-webhook.test.ts` | Demo |
| Reconciliation | Konnect status vs local `FeaturedOrder` mismatch | Detect & alert; never silent loss | ❌ | Production |

### 6.3 Subscription test suite (abonnement agence, MONETISATION_IMMO_ROADMAP.md §MI2)

Same bar as §6, applied to `Subscription` (souscription/renouvellement de
l'abonnement agence — quota d'annonces actives). Settlement lives in
`src/lib/subscription-payments.ts` (`settleSubscriptionPayment`,
intentionally **not** a `"use server"`). Différence structurelle testée
explicitement : `Subscription` est une ligne UNIQUE réutilisée à chaque cycle
(pas une ligne par paiement comme `FeaturedOrder`/`HostInvoice`) — l'idempotence
repose donc sur `paymentRef` (remis à `null` au règlement), pas sur `status`,
pour que le renouvellement d'un abonnement déjà `ACTIF` reste réglable. Le mock
démo (`subscribeAgencyPlanAction`) reste le fallback quand Konnect est
désactivé — jamais les deux à la fois (garde d'exclusivité, comme AH/PSP/MI0).

| Scenario | Test to create | Expected guarantee | Status | Phase |
|----------|----------------|---------------------|--------|-------|
| Double settlement | Two `settleSubscriptionPayment` calls, same ref | Only first mutates; second is a no-op | ✅ `subscription-payments.test.ts` | Demo |
| Settlement race (webhook vs return page) | Concurrent settle, `updateMany` count 0 on the loser | Single `ACTIF`, single audit | ✅ `subscription-payments.test.ts` | Demo |
| Amount tamper | `reachedAmount < expected` (recomputed from `AGENCY_PLANS`, never client-supplied) | Reject (`ERREUR`, no activation) | ✅ `subscription-payments.test.ts` | Demo |
| Unknown reference | Settle with an unrecognized `paymentRef`/`subscriptionId` | `INTROUVABLE`, harmless no-op | ✅ `subscription-payments.test.ts` | Demo |
| Renewal on an already-`ACTIF` subscription | Settle a second payment while `status: "ACTIF"` | Extends from the remaining `currentPeriodEnd`, not blocked by `status` (unlike a naive `EN_ATTENTE`-gated `updateMany`) | ✅ `subscription-payments.test.ts` | Demo |
| Stale `paymentRef` replay | Replay an old ref after a new cycle changed it | `INTROUVABLE`, harmless no-op | ✅ `subscription-payments.test.ts` | Demo |
| Role non-bypass | `startSubscriptionPaymentAction`/`subscribeAgencyPlanAction` called by a `HOTE` account | Rejected — the subscription mechanism only targets `AGENCE` | ✅ `subscription-payment-access.test.ts` | Demo |
| Demo/real exclusivity | `subscribeAgencyPlanAction` while Konnect is enabled | No-op, never applies the mock effect | ✅ `subscription-payment-access.test.ts` | Demo |
| **Webhook authenticity** | Forged/missing signature on `subscription-webhook` | Reject (401) without valid HMAC (`verifyKonnectWebhook`), same guard as the booking/host-invoice/featured webhooks | ✅ `subscription-webhook.test.ts` | Demo |
| Webhook rate limiting | Hammering one `sid` | 429 beyond the per-subscription cap | ✅ `subscription-webhook.test.ts` | Demo |
| Active-listings limit non-bypass | `verifyPropertyAction` on an `AGENCE` owner already at quota (free tier or paid plan) | Rejected before the listing becomes `ACTIVE` — quota re-derived server-side (`activeListingsLimit`), never a stored/trusted count | ✅ `admin.test.ts` | Demo |
| Quota-reached notification | `verifyPropertyAction` refusal for a quota-blocked listing | Agency is notified in-app (`ANNONCE_LIMITE_ABONNEMENT`, `notifyAgencyQuotaReached`) pointing to `/dashboard/abonnement` — the admin seeing the error is not enough, the agency has no other way to find out | ✅ `notification-quota.test.ts`, `admin.test.ts` | Demo |
| Reconciliation | Konnect status vs local `Subscription` mismatch | Detect & alert; never silent loss | ❌ | Production |

### 6.4 Wakil verification credits test suite (MONETISATION_IMMO_ROADMAP.md §MI3)

Same bar as §6, applied to `VerificationWallet`/`VerificationCreditOrder`
(payment gate on Wakil verification, `verifyPropertyAction` in
`src/actions/admin.ts`). **Two DIFFERENT regimes by role** (decision
2026-07-20) sharing the SAME balance and settlement code:
- `AGENCE`: `FREE_VERIFICATION_CREDITS = 1` free for life + a one-time Starter
  plan bonus (`AGENCY_PLANS[].verificationCreditsBonus`, generic — non-zero
  only for Starter today), then prepaid packs only (`VERIFICATION_CREDIT_PACKS`)
  — never a per-unit charge.
- `HOTE`: 0 free credits ever, strictly per-unit (`HOST_VERIFICATION_PRICE_TND`),
  never a pack — must pay BEFORE a Wakil can verify.

**A consumed credit pays for the listing for its entire lifetime**, never per
verification event (correction 2026-07-20). `Property.verificationCreditSpentAt`
(`DateTime?`, migration `20260720084214_add_property_verification_credit_spent`)
marks consumption permanently per listing — `verifyPropertyAction` never
re-consumes for that same listing again, including across
`unverifyPropertyAction` (badge removal) or `republishPropertyAction`
(republication after `LISTING_LIFETIME_DAYS` expiry).

Settlement lives in `src/lib/verification-credit-payments.ts`
(`settleVerificationCreditOrder`, intentionally **not** a `"use server"`,
mirrors `settleFeaturedOrder` — one row per purchase, unlike `Subscription`).
The demo mocks (`buyVerificationCreditPackDemoAction`,
`payHostVerificationDemoAction`) are the fallback when Konnect is off — never
both at once. The webhook (`verification-credit-webhook`) is shared by both
regimes (generic, role-agnostic).

| Scenario | Test to create | Expected guarantee | Status | Phase |
|----------|----------------|---------------------|--------|-------|
| Role-aware free baseline | `verificationCreditsRemaining`/`consumeVerificationCredit` for `AGENCE` vs `HOTE` with no wallet row | `AGENCE` → `FREE_VERIFICATION_CREDITS` (1); `HOTE` → 0 (must pay first) | ✅ `verification-credits.test.ts` | Demo |
| Credit consumption non-bypass | `verifyPropertyAction` when balance is 0, for either role | Rejected before the listing is verified/activated — atomic `updateMany` guarded by `balance: {gt: 0}`, never a stored/trusted balance | ✅ `admin.test.ts`, `verification-credits.test.ts` | Demo |
| **Lifetime credit coverage** | Re-verify a listing whose `verificationCreditSpentAt` is already set (after `unverifyPropertyAction` or a `republishPropertyAction` post-`LISTING_LIFETIME_DAYS` cycle), balance at 0, for `AGENCE` and `HOTE` | Succeeds without touching the wallet — a credit is consumed AT MOST ONCE per listing, ever | ✅ `admin.test.ts` (2 dedicated regressions) + live preview proof (DB + browser: pay → expire → republish → re-verify, zero re-debit) | Demo |
| Role-differentiated notification | Credit-blocked verification for `AGENCE` vs `HOTE` | Agency → `ANNONCE_CREDITS_VERIF_EPUISES`/`notifyAgencyOutOfVerificationCredits` → `/dashboard/abonnement`; Host → `ANNONCE_VERIF_PAIEMENT_REQUIS`/`notifyHostVerificationPaymentRequired` → `/dashboard/annonces` — never the wrong one for the wrong role | ✅ `admin.test.ts` | Demo |
| Starter bonus granted once | Subscribe/renew Starter twice (demo and real settlement) | +3 credits ONLY on the first activation (`Subscription.starterBonusGranted`); a renewal never re-grants | ✅ `subscription-payments.test.ts`, `subscription-payment-access.test.ts` | Demo |
| No bonus for other plans | Subscribe/renew Standard or Pro (`verificationCreditsBonus = 0`) | Wallet never touched | ✅ `subscription-payments.test.ts`, `subscription-payment-access.test.ts` | Demo |
| Double settlement | Two `settleVerificationCreditOrder` calls, same ref (agency pack or host single-credit order) | Only first credits the wallet; second is a no-op | ✅ `verification-credit-payments.test.ts` | Demo |
| Settlement race (webhook vs return page) | Concurrent settle, `updateMany` count 0 on the loser | Single credit applied, single audit | ✅ `verification-credit-payments.test.ts` | Demo |
| Amount tamper | `reachedAmount < expected` (pack price or `HOST_VERIFICATION_PRICE_TND`, recomputed server-side) | Reject (`ERREUR`, no credit) | ✅ `verification-credit-payments.test.ts` | Demo |
| Role non-bypass (agency packs) | `startVerificationCreditPaymentAction` called by a `HOTE` account | Rejected — packs only exist for agencies | ✅ `verification-credit-payment-action.test.ts` | Demo |
| Role non-bypass (host per-unit) | `startHostVerificationPaymentAction` called by an `AGENCE` account | Rejected — per-unit payment only exists for individuals | ✅ `host-verification-payments.test.ts` | Demo |
| Demo/real exclusivity | `buyVerificationCreditPackDemoAction`/`payHostVerificationDemoAction` while Konnect is enabled | No-op, never grants a free credit | ✅ `verification-credit-payment-action.test.ts`, `host-verification-payments.test.ts` | Demo |
| **Webhook authenticity** | Forged/missing signature on `verification-credit-webhook` | Reject (401) without valid HMAC, same guard as the other payment webhooks | ✅ `verification-credit-webhook.test.ts` (404 disabled, 400 no ref, 401 missing/bad signature, 429 rate-limit, 200 nominal — same 6-case pattern as `featured-webhook.test.ts`) | Demo |
| Reconciliation | Konnect status vs local `VerificationCreditOrder` mismatch | Detect & alert; never silent loss | ❌ | Production |

### 6.5 Free featured-boost claim test suite (MONETISATION_IMMO_ROADMAP.md §MI4)

Applied to `claimFreeFeaturedBoostAction` (`src/actions/properties.ts`) — the
Pro-plan subscription perk (decision 2026-07-20: existing Pro tier, 1 free
« à la une » boost per billing cycle, non-cumulative). Unlike §6.1-6.4 this
is **not a payment rail**: no `FeaturedOrder`, no Konnect call, no webhook —
the only sensitive surface is authorization (IDOR, role, plan/cycle
eligibility) and the atomic claim guard, so the bar here is the ownership/
non-bypass pattern (`D2`/`D3`/`D8`-style) rather than the payment-idempotency
pattern of §6.1-6.4.

`Subscription.freeBoostUsedAt` (`DateTime?`, migration
`20260720120305_add_subscription_free_boost`) tracks per-cycle consumption —
reset to `null` on EVERY successful settlement (`settleSubscriptionPayment`
and `subscribeAgencyPlanAction`, initial subscribe and renewal alike), so a
new cycle always starts with a fresh, unclaimed boost. `hasUnclaimedFreeBoost()`
(`src/lib/subscriptions.ts`) is the single source of truth for eligibility,
shared by the server action and the `/dashboard/annonces/[id]/a-la-une` UI.

| Scenario | Test to create | Expected guarantee | Status | Phase |
|----------|----------------|---------------------|--------|-------|
| IDOR | Agency B calls `claimFreeFeaturedBoostAction` on agency A's property | Rejected (`ACCES_REFUSE` via `requireOwnProperty`), no wallet/property mutation | ✅ `free-boost-claim.test.ts` | Demo |
| Role non-bypass | A `HOTE` account calls the action | Rejected before any DB read beyond the role check — the perk only targets `AGENCE` | ✅ `free-boost-claim.test.ts` | Demo |
| Plan non-bypass | An `AGENCE` on Starter/Standard (`freeBoostPerCycle: false`) calls the action | Rejected — `hasUnclaimedFreeBoost` false, no mutation | ✅ `free-boost-claim.test.ts` | Demo |
| Cycle non-bypass (no double-dip) | Called again after `freeBoostUsedAt` is already set this cycle | Rejected — non-cumulable, no `featuredUntil` extension | ✅ `free-boost-claim.test.ts` | Demo |
| Subscription-state non-bypass | Called with an expired (`currentPeriodEnd` past) or `EN_ATTENTE` subscription | Rejected — `isSubscriptionActive` gate, same derived-`EXPIRE` pattern as `activeListingsLimit` | ✅ `free-boost-claim.test.ts` | Demo |
| Listing eligibility | Called on a non-`ACTIVE`/expired property | Rejected — same eligibility re-check as `featureListingAction`/`startFeaturedOrderPaymentAction` | ✅ `free-boost-claim.test.ts` | Demo |
| Claim race (double click / double tab) | Concurrent claim, `updateMany` count 0 on the loser (`where: {userId, freeBoostUsedAt: null}`) | Only the winner extends `featuredUntil`; no double extension | ✅ `free-boost-claim.test.ts` | Demo |
| Reset on settlement (real) | `settleSubscriptionPayment` on any plan/cycle | `freeBoostUsedAt` included as `null` in the winning `updateMany` — new cycle, fresh boost | ✅ `subscription-payments.test.ts` | Demo |
| Reset on settlement (demo) | `subscribeAgencyPlanAction` (Konnect off) | `freeBoostUsedAt: null` in both `create`/`update` of the upsert | ✅ `subscription-payment-access.test.ts` | Demo |
| Plan shape | Exactly one plan (`PRO`) has `freeBoostPerCycle: true` | Locks the current business decision; a future plan change must touch this test | ✅ `agency-plans.test.ts` | Demo |
| Happy path | Eligible Pro agency claims on an eligible active listing | `featuredUntil` extended by `FEATURED_DURATION_DAYS` (cumulative if already featured), `PROPERTY_FEATURED` audit with `provider: "subscription_perk"`, redirect to `/dashboard/annonces?alaune=1` | ✅ `free-boost-claim.test.ts` + live Playwright proof (before/after screenshots: no banner → green claim banner → redirect with extended boost visible on `/dashboard/annonces` → banner replaced by "already used this cycle" note on revisit) | Demo |

---

## 7. Auth test suite

| Case | Normal path | Abnormal path | Status | Phase |
|------|-------------|---------------|--------|-------|
| Login | Valid creds → session | Wrong pw, unknown user (generic error, timing-stable), rate-limited | ✅/⚠️ | Demo |
| Logout | Clears cookie/session | Logout when not logged in (no error leak) | ❌ E2E | Beta |
| Reset password | Token issued, single-use, TTL | Reused/expired/forged token; invalidates active sessions | ❌ (feature) | Beta |
| OTP (phone/email) | 6-digit, 10-min, consumed on success | Wrong code (attempt++), expired, exhausted (5), purpose-cross | ✅ | Demo |
| KYC | Phone→CIN order, unique CIN, encrypted | Out-of-order, duplicate CIN, demo/real mode confusion | ✅ | Demo |
| Session expiration | Expires at maxAge | Expired token rejected | ❌ | Beta |
| Session invalidation | Invalidated on pw change/logout | Old session refused after invalidation | ❌ | Beta |
| JWT | Signed, role/userId claims fresh-checked | Tampered/none-alg/expired JWT rejected | ⚠️ | Beta |
| User roles | VOYAGEUR/HOTE/AGENCE gates | Wrong role refused (D4) | ⚠️ | Demo |
| Admin roles | ADMIN/isWakil gates | Non-admin refused; no self-promotion | ✅/⚠️ | Demo |

---

## 8. API / endpoint test checklist

Darna uses **Server Actions** (not REST) + two routes: `/api/auth/[...nextauth]`
and `/api/payments/konnect/webhook`. For **every action/route**, the contract:

| Check | What to assert | Status | Phase |
|-------|----------------|--------|-------|
| Authentication | Unauthenticated call refused where required (`requireUser`) | ⚠️ | Demo |
| Authorization | Wrong role/owner refused (D2/D3/D4) | ⚠️ | Demo |
| Input validation | zod schema present; invalid shape rejected | ⚠️ | Beta |
| Invalid payload | Wrong types/enums rejected with safe error | ⚠️ | Beta |
| Missing payload | Required fields missing → 4xx-equivalent, no crash | ❌ | Beta |
| Excessive payload | Oversized strings/arrays (e.g. 10 000-char fields, huge arrays) bounded | ❌ | Beta |
| Rate limiting | Sensitive actions rate-limited | ✅ (most) | Demo |
| Server errors | DB/provider down → safe generic error, audited, no stack leak | ⚠️ | Beta |
| Webhook | Signature verified, idempotent, always 200, rate-limited | ⚠️ (no signature) | Beta |

**Action inventory to cover:** `auth`, `bookings`, `kyc`, `email`, `onboarding`,
`admin`, `properties`, `profile`, `contact`, `wakil`, `destination`, `geocode`.

---

## 9. Database test suite

| Area | Test to create | Status | Phase |
|------|----------------|--------|-------|
| Migrations | `prisma migrate deploy` applies cleanly from scratch (drift check) | ✅ (CI) | Demo |
| Rollback | Down-migration / restore to previous schema works | ❌ | Beta |
| Referential integrity | FK cascades (`onDelete: Cascade`/`SetNull`) behave (e.g. delete user → bookings cascade) | ❌ | Beta |
| Unique constraints | `User.email`, `User.cinHash`, `Property.slug`, `Booking.paymentRef`, `Review.bookingId`, `Favorite[userId,propertyId]` reject duplicates | ⚠️ (cinHash via kyc test) | Beta |
| Concurrency | Overlapping booking under SERIALIZABLE (D1) | ⚠️ | Demo |
| Transactions | Multi-step writes are atomic (booking create, photo reorder) | ⚠️ | Beta |
| Race conditions | Settlement race / favorite double-insert | ⚠️ | Beta |
| Data corruption | Detect orphaned escrow / booking without property; integrity sweep | ❌ | Production |
| Retention | AuditLog purge ≥90 days (RGPD) | ❌ | Production |
| Backup/restore | Restore drill + PITR verified | ❌ | Production |

---

## 10. CI/CD quality gates & thresholds

**A PR must never merge if:** build fails · lint fails · TypeScript fails ·
tests fail · a **critical/high** vulnerability is detected · coverage drops
below the phase threshold.

### Current CI (`.github/workflows/ci.yml`) — already satisfies the Demo bar ✅
```
checkout → setup-node 22 → npm ci → prisma generate → prisma migrate deploy
→ lint → tsc --noEmit → npm test → next build → npm audit --audit-level=high
```
> The demo asked for "build + lint + typescript + critical tests, nothing more."
> The existing pipeline already does that **plus** migration-drift and a high/
> critical dependency audit. **Keep it as-is for the demo.** Do not regress it.

### Gate matrix by phase
| Gate | Demo | Beta | Production |
|------|:----:|:----:|:----------:|
| Build (`next build`) | ✅ | ✅ | ✅ |
| Lint (`eslint`) | ✅ | ✅ | ✅ |
| Typecheck (`tsc --noEmit`) | ✅ | ✅ | ✅ |
| Unit tests (`vitest run`) | ✅ | ✅ | ✅ |
| Migration drift (`migrate deploy`) | ✅ | ✅ | ✅ |
| Dependency audit (`npm audit --high`) | ✅ | ✅ (block high+critical) | ✅ (block + SBOM) |
| **Coverage gate** (`vitest --coverage`) | ⬜ optional | ✅ ≥70% lib+actions | ✅ ≥85% critical / 80% global |
| **Integration tests** (ephemeral PG) | ⬜ | ✅ | ✅ |
| **E2E smoke** (Playwright) | ⬜ | ✅ 5–8 journeys | ✅ full matrix |
| **SAST** (CodeQL / Semgrep) | ⬜ | ✅ | ✅ |
| **Secret scanning** (gitleaks) | ⬜ recommended | ✅ | ✅ |
| **Branch protection** (required checks + 1 review) | ⬜ | ✅ | ✅ (2 reviews on sensitive paths) |
| **DAST** (ZAP baseline) | ⬜ | ⬜ | ✅ |
| **Container/image scan** (Trivy) | ⬜ | ⬜ | ✅ |
| **Migration safety** (no destructive without approval) | ⬜ | ⬜ | ✅ |
| **Load/concurrency gate** | ⬜ | ⬜ | ✅ |

### Suggested thresholds
- **Unit:** Demo — no hard %, keep green. Beta — **≥70%** lines & branches on `src/lib` + `src/actions`. Production — **≥85%** on critical modules (`payments`, `bookings`, `auth`, `crypto`, `otp`, `rate-limit`, `storage`, `session`), **≥80%** global.
- **Integration:** Beta — every action: happy + auth-fail + ownership-fail. Production — + invalid/missing/excessive payload + provider-down.
- **E2E:** Beta — 5–8 critical journeys (signup→verify→book→pay, host listing, admin verify). Production — full role matrix + cross-browser + mobile + RTL (arabic).
- **Security:** Beta — OWASP A01/A02/A03/A05/A07 automated + headers regression. Production — full Top 10 + CWE Top 25 coverage + annual pentest + DAST in pipeline.

---

## 11. Code review checklist

> Every reviewer ticks these before approving. Bold = blocking on sensitive paths
> (auth, payment, KYC, upload, permission).

**Security**
- [ ] **No secret in diff** (key, token, password, `.env` value); no key under `NEXT_PUBLIC_`.
- [ ] **Every mutation has server-side authorization** (role gate + ownership check; never trust client).
- [ ] **zod validation** on every server action input; fields picked explicitly (no mass assignment).
- [ ] **No injection surface**: no raw SQL, no string-built queries, no unsanitized `dangerouslySetInnerHTML`.
- [ ] Prices/amounts/state recomputed server-side; client values never trusted.
- [ ] Rate limiting on any new sensitive/abuse-prone action.
- [ ] New sensitive action emits an **audit log**.
- [ ] Generic error messages on auth/payment (no enumeration / no stack leak).
- [ ] New outbound HTTP uses a pinned base URL (no user-controlled host → SSRF).

**Quality**
- [ ] Cyclomatic complexity reasonable; functions single-purpose.
- [ ] No copy-paste duplication of a guard/validation (extract & reuse).
- [ ] Naming/idiom matches surrounding code; i18n keys added in **all three** dictionaries.
- [ ] Tests added/updated for the changed behavior; **QA_ROADMAP.md updated** if a sensitive surface changed.
- [ ] New user-visible product feature emits its `ProductEvent`(s) in the **same PR** (see `INSTRUMENTATION_ROADMAP.md` §IN4) — same discipline as the audit-log rule above for sensitive surfaces.

**Performance**
- [ ] No **N+1** (use `include`/`select`, batch); list queries hit an index.
- [ ] DB queries are indexed (check `@@index` for new filters/sorts).
- [ ] Caching used where appropriate, with correct invalidation.

**Architecture**
- [ ] Respects module boundaries (`core`/`stay`/`immo`); no payment field in `ImmoDetails`.
- [ ] Server Action vs API route choice consistent with conventions.
- [ ] Tech debt flagged with a `TODO-BETA`/`TODO-PRODUCTION` reference (see TODO files).

---

## 12. Release checklist

> Run before every deploy. Blocking items must be green.

**Tests & quality**
- [ ] All CI gates green on the release commit (build, lint, tsc, tests, audit, coverage for the phase).
- [ ] E2E smoke passed against staging (Beta+).

**Security**
- [ ] No new high/critical dependency vuln; secret scan clean.
- [ ] New env vars validated by `env.ts` fail-fast; secrets set in the target environment (not in repo).
- [ ] Prod mode invariants set: `KYC_ENC_KEY`, real `SMS_PROVIDER`, `TRUSTED_PROXY=true`, S3 config, Konnect keys.

**Data**
- [ ] **Backup taken** immediately before migration.
- [ ] Migration reviewed for destructive ops; **rollback plan** documented.
- [ ] `prisma migrate deploy` dry-run/staging-verified.

**Operations**
- [ ] Monitoring/alerting live for auth failures, payment failures, 5xx rate.
- [ ] Observability webhook configured (`OBSERVABILITY_WEBHOOK_URL`).
- [ ] **Rollback procedure** tested and one-command ready (previous image + DB plan).
- [ ] On-call/runbook updated; feature flags default-safe.
- [ ] Post-deploy smoke: login, booking, payment (sandbox), KYC OTP.

---

## 13. Risks if omitted

| If we skip… | Concrete risk | Blast radius |
|-------------|---------------|--------------|
| D1 booking-conflict test | A refactor silently breaks the SERIALIZABLE guard → two guests pay for the same dates | **Refunds, trust loss, payment-partner scrutiny** |
| D2/D3/D4 authz tests | A missing `requireOwnProperty`/role gate ships → IDOR / privilege escalation | **Full data breach of users' bookings/listings** |
| Webhook signature | Forged webhook confirms an unpaid booking | **Direct financial loss / fraud** |
| Session invalidation | Reset password doesn't kill stolen session → persistent account takeover | **Account takeover at scale** |
| Mass-assignment test | Profile form sets `role=ADMIN` | **Total compromise** |
| XSS regression | Stored script in a listing/review executes in hosts' browsers | **Session theft, defacement** |
| Coverage gate | Critical modules silently lose coverage over time | **Regressions reach prod undetected** |
| DB rollback/backup drill | Bad migration with no tested restore | **Irreversible data loss** |
| Rate-limit proxy trust | `x-forwarded-for` spoofing bypasses limits | **Brute force, OTP exhaustion** |
| EXIF strip / re-encode | Geotagged photos leak host home location; polyglot upload | **Privacy breach, RCE vector** |
| Reconciliation | Konnect/local drift unnoticed | **Silent money loss, accounting gaps** |

---

## 14. Execution roadmap (prioritized)

**Now (Demo) — P0/P1, ~7 small unit/integration tests, no new tooling:**
1. D1 booking-conflict concurrency test.
2. D2 booking IDOR + D3 property IDOR + D4 role-gate negatives.
3. D5 mock-payment exclusivity, D6 price integrity, D7 upload-action wiring.
4. Keep current CI green. _(Optional: add `vitest --coverage` non-blocking to start a baseline.)_
5. `MAP_INTERACTED` + `SIMULATOR_USED` unit tests — only 2 of 4 IN2 instrumentation events are currently tested (§4.13).

**Before Beta — quality gates + first integration/E2E + security regression:**
1. Add coverage gate (≥70% lib+actions) + Playwright E2E smoke (5–8 journeys) to CI.
2. Add SAST (CodeQL/Semgrep) + secret scan (gitleaks) + branch protection.
3. ✅ **Konnect webhook signature/HMAC verification** + replay test — done (`src/lib/konnect.ts`, `tests/konnect.test.ts`, `tests/api/webhook-konnect.spec.ts`).
4. Session lifecycle tests (expiry, invalidation on pw change, cookie flags).
5. Mass-assignment, open-redirect, CSRF/SameSite, SSRF allowlist, XSS output-encoding regression tests.
6. Integration tests per server action (happy + authz-fail) against ephemeral Postgres.
7. DB tests: unique-constraint, FK cascade, rollback.
8. Implement & test reset-password and cancellation/refund flows.

**Before Production — full assurance:**
1. Full OWASP Top 10 + CWE Top 25 coverage; DAST (ZAP) in pipeline; annual pentest.
2. Bank-grade payment suite: reconciliation, chargeback, partial-refund idempotency.
3. Load/concurrency/soak + chaos tests; load gate in CI.
4. Real KYC provider (document + liveness) tests; RGPD export/delete + audit retention purge.
5. Image re-encode/EXIF strip; S3 private ACL + content-type pinning tests.
6. Backup/restore + PITR drill; migration-safety gate; container/SBOM scan.
7. SLOs, tracing, alerting, on-call runbooks, canary + automated rollback.

---

_See `TODO-BETA.md` and `TODO-PRODUCTION.md` for the per-feature task registry._
