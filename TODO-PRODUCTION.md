# TODO-PRODUCTION — controls & tests required before public Production

> **Production = public, untrusted traffic, real funds, real identities, GDPR.**
> Assume an audit by a cybersecurity team, investors, a payment partner, and
> users who fully trust the platform. Do **everything in `TODO-BETA.md` first**,
> then everything below. Companion to `QA_ROADMAP.md` (§14).
>
> When you implement an item: check it off, link the test, flip the matching
> `QA_ROADMAP.md` row to `✅`.

## CI/CD & quality gates
- [ ] Coverage gate raised: **≥85%** on critical modules (`payments`, `bookings`, `auth`, `crypto`, `otp`, `rate-limit`, `storage`, `session`), **≥80%** global.
- [ ] **DAST** (OWASP ZAP baseline) against staging in the pipeline.
- [ ] **Container/image scan** (Trivy) + **SBOM** generation + license check.
- [ ] **Migration-safety gate**: destructive migrations require explicit approval label.
- [ ] **Load/concurrency gate**: performance budget enforced in CI (p95 latency, error rate).
- [ ] Require **2 reviews** on sensitive paths (auth, payment, KYC, permissions).

## Authentication & sessions
- [ ] MFA / step-up auth for sensitive actions (optional but recommended).
- [ ] Concurrent-session management + device revocation + "log out everywhere".
- [ ] Full E2E auth matrix (login/logout/reset/OTP) cross-browser + mobile + RTL (arabic).

## KYC & identity
- [ ] Integrate a **real KYC provider** (document verification + liveness) and test the integration.
- [ ] Synthetic-identity / duplicate-document fraud tests.
- [ ] CIN data-retention & access policy; encryption key rotation procedure tested.

## Payments (bank-grade)
- [ ] **Reconciliation** job: detect Konnect↔local state drift; alert; never silent loss. + test.
- [ ] **Chargeback / dispute** flow (state + audit + escrow handling) + test.
- [ ] **Partial / failed refund** idempotency (retry-safe, consistent state) + test.
- [ ] Immutable, append-only money-event audit; **≥90-day retention** (RGPD) + purge job test.
- [ ] PCI-scope review (even with hosted Konnect): confirm no card data ever touches Darna.

## Uploads & storage
- [ ] **S3 private ACL** + content-type pinning + signed read URLs + test (no public/overwritable objects).
- [ ] Antivirus/malware scan on uploads (e.g. ClamAV) for non-image abuse.
- [ ] CDN cache-control + integrity for served media.

## Messaging (if shipped)
- [ ] Real inbox authz (only participants can read a thread) + abuse reporting + rate limit.
- [ ] Stored-XSS and link-safety tests on message bodies.

## API & abuse
- [ ] Global API rate limiting / WAF in front of public endpoints.
- [ ] Bot/abuse protection (CAPTCHA or equivalent) on public forms (contact, wakil, register).
  - [x] **Register + login**: Cloudflare Turnstile integrated (dual-mode, `CAPTCHA_MODE=turnstile`, `src/lib/turnstile.ts`).
  - [ ] ⚠️ **Replace Turnstile TEST keys with REAL keys before prod.** Dev uses the Cloudflare always-pass dummy keys (`NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x000…AA` / `TURNSTILE_SECRET_KEY=1x000…AA`) which validate everything and protect NOTHING. Generate a real Managed widget on the Cloudflare dashboard (free), set the prod env vars (keep `CAPTCHA_MODE=turnstile`), and verify a real challenge is enforced.
  - [ ] Extend Turnstile (or equivalent) to the remaining public forms: contact, wakil.
- [ ] Fuzzing of all server-action inputs (excessive/nested/typed payloads).

## Database & data integrity
- [ ] **Backup/restore drill** + Point-In-Time-Recovery verified on a real snapshot.
- [ ] **Data-corruption detection**: integrity sweep (orphaned escrow, booking without property, dangling FK).
- [ ] AuditLog retention purge job (≥90 days) + test.
- [ ] Connection pooling validated under load (PgBouncer/pooler `directUrl` split — see `prisma/schema.prisma`).

## Security (full assurance)
- [ ] **Full OWASP Top 10 + CWE Top 25** automated coverage (see `QA_ROADMAP.md` §5).
- [ ] **Annual external pentest** + remediation tracking.
- [ ] Security headers & CSP report-only → enforce, with violation reporting endpoint.
- [ ] Dependency supply-chain: pin + verify, Dependabot, signed releases.
- [ ] Secret management via a vault (not `.env` on hosts); rotation runbook.

## Reliability / SRE
- [ ] **SLOs** defined (availability, latency, payment success rate) + error budgets.
- [ ] Distributed tracing + structured log aggregation + dashboards.
- [ ] Alerting + **on-call** rotation + incident runbooks.
- [ ] **Canary / blue-green deploy** + automated rollback on health-check failure.
- [ ] Load + soak + **chaos** tests (kill Redis, DB failover, provider timeout).
- [ ] Graceful degradation tests: Redis down (rate-limit fallback), provider down (Konnect/Resend/SMS).

## Compliance / trust
- [ ] **RGPD**: data export + right-to-erasure flows + tests.
- [ ] Cookie consent + privacy policy + ToS versioning.
- [ ] Audit-trail integrity (tamper-evidence) for regulated events.
