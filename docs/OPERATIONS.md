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
