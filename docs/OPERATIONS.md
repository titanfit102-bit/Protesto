# PROTESTO — PRIVATE PILOT OPERATIONS

## Preconditions
This implementation is for a *private pilot*, not an authorized public deployment. Only operate it with non-sensitive test content until security and legal gates are complete. Node.js 22+, PostgreSQL 16+, and one isolated database are required. Do not use an existing project's credentials, databases or infrastructure.

## Quick start

1. Use a new local environment or disposable cloud development machine.
2. Configure \`DATABASE_URL\` and \`APP_ORIGIN\` (never commit credentials). Example names appear in \`.env.example\`. The Node scripts read environment variables; the .env file is **not auto-loaded**.
3. Run \`npm install --no-audit --no-fund\`.
4. Run \`npm run db:migrate\`.
5. In a *private development environment*, export a unique strong \`PROTESTO_NEW_PASSWORD\` and run \`node tools/provision-user.mjs reporter@example.org reporter\`; separately provision a different user with role \`reviewer\`. Delete the exported password from the shell afterward.
6. Run \`npm run pilot\` and open \`http://127.0.0.1:4174/pilot.html\` on the local machine.
7. Run \`npm run verify\`. Database integration tests require \`DATABASE_URL\`. The CI workflow provisions a disposable PostgreSQL service.

The demo-only app remains \`npm run dev\` at \`http://127.0.0.1:4173\` and does not connect to the pilot database.

## Authentication and authorization
Accounts can only be provisioned using the CLI. There is no public registration. Users have reporter, reviewer and admin roles. Passwords are scrypt-derived with individual salts. Session token hashes are stored in PostgreSQL; the raw 256-bit session token appears only in an HttpOnly, SameSite=Strict cookie (Secure is required when NODE_ENV=production).

Every state-changing API request requires exact Origin equality and a custom header. Reviewers cannot approve their own cases. Publishing a pending report and recording review/audit entries happen in a single database transaction.

## Data handling
A new report remains pending until manually reviewed. Reviewers should check document origin, context, personal details, allegations and right-of-reply handling *outside* the software before publishing. This pilot has no redaction tooling, content appeal workflow, complaint inbox, legal intake or verified evidence archive. Therefore do not publish identifiable allegations or sensitive cases.

## Outage and recovery
The pilot now contains optional encrypted PostgreSQL backup and guarded restore tooling. **These scripts are not a scheduled offsite backup solution.** The full PostgreSQL restore drill is included in CI but is **not yet verified on the new revision because GitHub Actions failed before assigning a runner**. Treat the database as disposable until a real restore passes and production backup retention, recovery objectives and operational security are established.

For an isolated private pilot, set `DATABASE_URL`, `PROTESTO_BACKUP_FILE` (a unique output path), and `PROTESTO_BACKUP_SECRET` (a randomly generated independent 24+ character secret kept outside version control). With compatible `pg_dump`/`pg_restore` tools available, execute `npm run db:backup`. This uses AES-256-GCM authenticated streaming encryption and creates a private (0600) file without writing a plaintext dump. Use `npm run db:verify-backup` to authenticate the encrypted archive; this **does not** prove the database is restorable.

To test a restore, create a **new empty disposable** PostgreSQL database, set `RESTORE_DATABASE_URL` to it and `PROTESTO_ALLOW_RESTORE=I_ACKNOWLEDGE_EMPTY_TEST_DATABASE`, then execute `npm run db:restore-test`. The script first checks archive integrity, refuses a non-empty target and blocks use with `NODE_ENV=production`. A full restore drill must compare restored records and schema against the original. **Never restore into the primary database.** Store backups and encryption secrets in different protected locations; do not commit them to Git, upload them to public storage or reuse passwords.

## Rollout / rollback
Do not promote this PR to main or deploy publicly without owner approval. If the pilot is run privately and an error occurs: stop the pilot server, preserve error evidence without credentials, disable ingress and investigate before restarting. Use explicit reviewed migrations; never wipe or overwrite a real production database as a shortcut.

## Known constraints
- Login throttle uses process memory; it is not a distributed production-grade limiter.
- No email verification, SSO, MFA, recovery or self-service account closure.
- Basic editorial queue only; moderation standards and independent review are not yet formally audited.
- No browser E2E proof yet.
- No real data source integrations or AI investigator yet.

## Evidence review in the private pilot

A case with a URL is created with the source **pending**. The independent reviewer opens "Burimet dhe verifikimi", checks the link manually, records a reason and accepts/rejects it. Publication requires at least one accepted source and three explicit editorial acknowledgements. Later sources can be added by the author only while pending.

Correction requests appear in a separate reviewer queue. **Acceptance withdraws publication** rather than rewriting history silently; rejection retains the existing record. These queues are not equivalent to a complete institutional right-of-reply, legal appeal or public correction notice process.

## Browser automation

CI launches a preinstalled Chromium and a disposable PostgreSQL instance, covering login, source acceptance, review/publish, citizen correction and withdrawal. Run locally only in an isolated test database:

    npm run db:migrate
    CHROME_PATH=/path/to/chromium npm run test:e2e

Never run E2E tests against real user data or a production database: tests insert fictitious accounts and cases.

## Service monitoring

`GET /api/health` checks only that the HTTP process responds (liveness). `GET /api/ready` checks the PostgreSQL connection (readiness), returning HTTP 503 when the database is unavailable. Neither endpoint authenticates a user; do not place secrets or privileged telemetry in responses. Full production monitoring and paging remain open release gates.

## Shared rate limiting

The pilot now requires `PROTESTO_RATE_LIMIT_SECRET`, a separately stored stable random value of at least 32 characters. Never commit production secrets or rotate this key without planning: changing it resets anonymous quota identities. PostgreSQL `request_rate_limits` enforces atomic per-IP login quotas (12 per 15 minutes), per-email login quotas (15 per 15 minutes), and per-authenticated-user mutation quotas (120 per hour), shared across Node instances. Identifiers are HMAC-SHA256 hashes, not plain IPs/emails. Periodically delete expired rows via a reviewed database maintenance job; the prototype does not schedule one. A rejected request returns HTTP 429 with `Retry-After`. This is defense-in-depth and does not replace a gateway WAF, legitimate-user appeal process or proxy-aware identity strategy. Do not trust unverified forwarded headers. The pilot has no safe public release without further anti-abuse review.


## Civic dialogue private pilot

Set a *different*, cryptographically random 32+ character PROTESTO_DIALOGUE_SECRET in the runtime environment. This secret is required on startup because the application uses keyed, per-statement vote identifiers; do not reuse the rate-limit secret, commit either secret or confuse pseudonymization with anonymity.

In the authenticated pilot, an authorized reviewer selects a published case and creates a dialogue topic. A citizen submits a statement (pending until approved by a different reviewer). An authenticated user may vote after acknowledging the privacy notice; votes can change while the topic is open. A reviewer closes the topic, automatically generating aggregate counts only for statements with >=10 distinct respondents and deleting individual vote rows within the same database transaction.

**Do not use with real political/sensitive participation.** Complete legal/DPIA review where needed, consent and rights processes, backup retention, duplicate-account controls, participant disclosures, security testing, neutral moderation procedures and independent data stewardship first. The old vote records can survive in backups even when deleted from the live tables.

CI uses an entirely synthetic PROTESTO_DIALOGUE_SECRET. The new PostgreSQL migration 007 adds dialogue_topics, dialogue_statements, dialogue_reviews, dialogue_votes and dialogue_results. For methodology and licence boundaries see docs/POLIS_DESIGN_ADAPTATION.md.

## Operations/readiness tranche — private pilot
The admin-only endpoint `GET /api/ops/status` returns **aggregate counts**, never identifying records. Access requires a current admin session. This is an on-demand snapshot and **not a monitoring service**.

### Recommended operating controls before release (not yet configured)
- Own a 24/7 incident escalation contact, on-call backup owner, breach reporting protocol and tested access revocation workflow.
- Run automated encrypted backups to a separately authorized offsite destination, with retention and rotation of the recovery key managed outside the repository. Document restore RTO/RPO targets only after timed drills.
- Set thresholds for pending editorial cases/replies, failed dependency/database health probes and unusually large session/rate-limit counts; connect them to a privacy-safe external alerting system approved by the owner.
- Before applying a new migration to any non-disposable database, take and verify a backup, run rehearsal on an isolated copy, and plan a rollback migration; never forcibly replay an already applied migration with a changed checksum.
- Record code SHA, reviewer approval, backup id and timestamps in an append-only operations record. Do not include personal data in CI artifacts.

### Rollback / incident runbook
1. Disable external ingestion and public publishing, preserve evidence of incident without adding sensitive details to logs.
2. Revoke compromised sessions and credentials, rotate secrets with a controlled playbook; avoid automated mass data deletion.
3. Validate backup MAC and restore to a **separate empty database**; check row parity and schema checksum independently.
4. Apply an owner-approved deployment rollback, then test readiness, permissions, audit and public/private content isolation.
5. Record decisions and notify competent privacy/legal personnel if personal information may have been exposed.

The CI backup drill uses disposable test data. Offsite backups, actual alert delivery, incident response staffing and retention/deletion policy remain **OPEN P0**.
