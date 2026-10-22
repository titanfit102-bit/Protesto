# Protesto

**Protesto** is a politically nonpartisan, privacy-first civic accountability project with an Albanian interface. It includes a fictional browser demonstration **and** a separate PostgreSQL-powered **private pilot** for reviewed civic submissions. Neither is an approved public production deployment.

## Modes

### A. Browser demonstration (no database)
Requires Node.js 22+. Run:

    npm run dev

Open http://127.0.0.1:4173. The demo features reports, filters, initiatives, peaceful gatherings, local browser storage, JSON export and fictional example records. It never submits data to a server.

### B. Private pilot (PostgreSQL)
Requires Node.js 22+, PostgreSQL 16+ and a **new isolated database**. Configure `DATABASE_URL` and `APP_ORIGIN` outside version control, then:

    npm install --no-audit --no-fund
    npm run db:migrate
    npm run db:user -- reporter@example.org reporter
    npm run db:user -- reviewer@example.org reviewer
    npm run pilot

For the user-provisioning commands set `PROTESTO_NEW_PASSWORD` securely in the process environment (12+ characters, different per user); never commit or paste secrets into chat. Open http://127.0.0.1:4174/pilot.html. See [operations](docs/OPERATIONS.md).

**Private pilot supports:** login using provisioned test accounts, case reports, initiatives, peaceful gatherings, PostgreSQL storage, an independent reviewer role, pending moderation, publish/reject, publication retraction and internal audit entries. All mutating operations require same-origin requests; no attendance tracking is collected. Publishing is blocked until an authorized reviewer approves a report, and reviewers cannot approve their own content.

## Verification

    npm install --no-audit --no-fund
    npm run verify

For PostgreSQL integration tests export `DATABASE_URL` and run migrations first. Pull requests run CI with a disposable Postgres 16 database. Do not treat passed automated checks as a security certification or real-user acceptance.

## What is still missing

- Independent accessibility audit and real mobile-device acceptance (Chromium E2E exists).
- Production identity, MFA, account recovery, email verification and gateway-level abuse protection (PostgreSQL quotas exist).
- Formal document provenance, redaction and institutional right-of-reply (early correction/appeal workflows exist).
- Document evidence storage, government data connectors, AI provenance pipeline and false-claim evaluation.
- Operational offsite backup scheduling and restore ownership, monitoring, privacy/legal review, incident response and production hosting.
- Public launch consent, domain configuration and separate authorization for merging the PR.

**Never submit sensitive personal information, confidential whistleblower content, allegations about private people or political preference data** to this unaudited prototype. The private pilot is for synthetic/test material only.

## Structure

    index.html + src/app.mjs       browser-only demonstration
    pilot.html + src/pilot.mjs     authenticated private pilot interface
    src/domain.mjs                 input validation and pure rules
    src/server/app.mjs             PostgreSQL API, login, cases, audit
    src/server/actions.mjs         moderated initiatives and gatherings
    src/server/security.mjs        password/session/CSRF helpers
    db/*.sql                       ordered idempotent pilot migrations
    test/*.test.mjs                unit, security and integration tests
    docs/*                        blueprint, operations and release gates

## Governance and safeguards

Apply the same standards to every political party and government. Only nonviolent lawful civic organization; no propaganda bots, individualized political targeting, gathering participant lists, doxxing or automatic accusations.

**Repo policy:** Changes remain on `feat/protesto-foundation` as draft PR. Do not merge into `main` or publicly deploy without the owner's separate approval.

## Evidence and corrections (private pilot)

- Every case with an initial HTTPS link receives a **pending source** record.
- A separate reviewer must inspect and accept at least one source before publication. A three-part checklist acknowledges source inspection, privacy review and consideration of right of reply.
- Case authors can attach more HTTPS sources while their case is pending (limit eight). Approval is recorded in the audit trail.
- Authenticated citizens can request a correction of published material. Independent reviewers may reject the request or accept it and withdraw the published case while recording the decision.
- These controls do **not** cryptographically verify documents, prove facts, or constitute a legally compliant right-of-reply program. The public platform is not launched.

See [Evidence and corrections](docs/EVIDENCE_AND_CORRECTIONS.md) and [release gates](docs/RELEASE_GATES.md).

## Browser E2E checks

\`npm run test:e2e\` executes real Chromium checks with a disposable development PostgreSQL database and test accounts. It requires \`CHROME_PATH\` and the pilot environment. GitHub Actions runs the check on draft PRs, not public hosting.

### Private data export

An authenticated user can download their own pilot cases, civic actions, correction requests and submitted source metadata in JSON. No password hashes, session tokens or another citizen's data are included. This is a partial data-access feature, not a complete GDPR compliance process.

## Encrypted backup and restore (private pilot only)

Requires PostgreSQL client binaries `pg_dump`/`pg_restore` compatible with the source database. Set the database connection and strong independent backup passphrase as environment variables (never in repo):

```
PROTESTO_BACKUP_FILE=/safe/backup/location/protesto.ptbk
PROTESTO_BACKUP_SECRET=<generated-secret-of-24-or-more-characters>
```

`npm run db:backup` creates a non-overwriting AES-256-GCM encrypted archive. `npm run db:verify-backup` verifies authentication but not restorable SQL. Only for a **new disposable database**, set `RESTORE_DATABASE_URL` and `PROTESTO_ALLOW_RESTORE=I_ACKNOWLEDGE_EMPTY_TEST_DATABASE`, then run `npm run db:restore-test`. The tool refuses nonempty targets and production mode. This is an operator-assisted pilot mechanism, not a scheduled/compliant production backup.

The integration drill `npm run test:backup` requires `PROTESTO_BACKUP_TEST=1`, a throwaway PostgreSQL CI database and database creation rights. It must **never** run against real data. A GitHub Actions isolated encrypted-restore drill passed in [run #39666863606](https://github.com/titanfit102-bit/Protesto/actions/runs/39666863606). This does not establish production backup readiness.

### Atomic backup publication and public ledger

Backup archives are now written to a private temporary file and published only when fully encrypted and flushed, using atomic hard-link creation that refuses pre-existing destination paths. Filesystems must support local hard links. If a process crashes mid-backup, temporary `.part` files may remain and should be handled via an operator cleanup policy after inspection; they are never considered validated archives.

`GET /api/public/ledger` and the pilot UI show previous publication/retraction status events without private review notes or identities. This **does not** replace a public, legally reviewed correction and appeals process. For current test evidence and blockers see `docs/STATUS.md`.

## Automated quality gates

GitHub Actions tests both the pilot and browser demo, checks JavaScript syntax, audits npm dependencies for high/critical findings, verifies basic accessibility and performs an isolated encrypted backup/restore drill. See [the verification matrix](docs/CI_VERIFICATION.md). Passing CI does not constitute legal, privacy or independent security certification.

**Current full CI evidence:** [run #39667630075](https://github.com/titanfit102-bit/Protesto/actions/runs/39667630075) passed runtime + development dependency audit, syntax checks, unit/API tests, browser/accessibility smoke and encrypted PostgreSQL restore. This does not authorize public deployment.

## Second-reviewer appeals and shared rate limits

The pilot now supports a one-time appeal by the author of a rejected correction. A **different reviewer** from the first decision (and separate from the correction author and case author) can uphold or overturn the decision. Overturning archives the published case with an immutable audit history; the original correction record remains unchanged.

The pilot requires a securely generated `PROTESTO_RATE_LIMIT_SECRET` (32+ characters) for deterministic PostgreSQL rate limiting across backend processes. IP/account login quotas and user write quotas are enforced with HMAC identifiers. Keep the secret outside the repository; no real identity or production app environment has been created.

**Latest implementation tests:** [Actions #39670591638](https://github.com/titanfit102-bit/Protesto/actions/runs/39670591638), 17/17 Node tests plus Chromium/restore gates. Independent accessibility, security, editorial and legal audits remain open.

## Dialogu Qytetar — Polis-inspired, original implementation (private pilot)

A reviewer can start a moderated discussion linked to a published civic case. Citizens can submit statements for independent moderation, then choose Pajtohem / Kundërshtoj / E kaloj. Voting requires a privacy acknowledgement and stores a *pseudonymous* statement-specific HMAC identifier, not raw public account identities. This is **not anonymous** and is **not a representative political opinion survey**.

No live results are shown. On topic closure, counts are published only for statements with 10+ responses. Individual vote rows are removed from the active database in that transaction; existing backups may still hold older copies. No political microtargeting, segmentation or AI inference.

The pilot now requires a distinct secret PROTESTO_DIALOGUE_SECRET (32+ characters) as well as PROTESTO_RATE_LIMIT_SECRET. Keep both outside GitHub. Detailed design, privacy and licensing: [Polis-inspired dialogue design](docs/POLIS_DESIGN_ADAPTATION.md). Original Polis AGPLv3 source is **not copied** into Protesto.

**Verified build:** [GitHub Actions run #39687784143](https://github.com/titanfit102-bit/Protesto/actions/runs/39687784143) passed **18/18 Node tests**, PostgreSQL migrations, original browser E2E and dedicated dialogue Chromium E2E, dependency audit, and encrypted PostgreSQL restore. This is a private synthetic pilot, not approval to collect live political opinions or deploy.


### Descriptive dialogue results

The private pilot also offers a public summary and download of **finalized aggregate** responses through GET /api/dialogue/report (JSON, format protesto-dialogue-aggregates/1). It excludes open discussions, sub-threshold statements and topics whose civic cases have been withdrawn, and never exports raw voter keys or account IDs. Treat it as descriptive participation within this pilot, not verified consensus across opinion groups or a population poll.

## OpenCode coding orchestration (guarded experiment)

The project now includes a **separate** OpenCode + GitHub Actions controller at `experiment/opencode-pilot` (draft PR #3). It preserves an ordered backlog in `automation/opencode-approved-tasks.json`. The architect can append approved work while an OpenCode job is running; the workflow is snapshot-pinned, never cancels current work, independently verifies generated files, and opens draft PRs without merging. Scope is limited to synthetic tests and additive pure modules with tests. It cannot edit existing application/auth/database modules autonomously.

Verified examples: [test PR #7](https://github.com/titanfit102-bit/Protesto/pull/7) and [first real module PR #9](https://github.com/titanfit102-bit/Protesto/pull/9). See [operating manual](docs/OPENCODE_TASK_QUEUE.md) and [tracking issue #8](https://github.com/titanfit102-bit/Protesto/issues/8) for reliability limitations and the approval process. No main merge, production deployment or metered provider configuration is authorized.
