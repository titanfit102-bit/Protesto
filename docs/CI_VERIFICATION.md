# PROTESTO — GITHUB ACTIONS VERIFICATION MATRIX

## Workflow

\`.github/workflows/verify.yml\` runs on pull requests to main or manual dispatch. The runner uses Node.js 22 and a disposable PostgreSQL 16 service. The repository is currently public, but the app has **not** been publicly deployed.

| Stage | Command / method | Intended proof |
|---|---|---|
| Install | \`npm install --no-audit --no-fund\` | Install compatible toolchain |
| Package audit | \`npm audit --audit-level=high\` | Gate high/critical runtime and development dependency advisories |
| JavaScript parse check | \`find src tools test -type f -name '*.mjs' ... node --check\` | Catch syntax errors in all modules |
| Database migrations | \`npm run db:migrate\` twice | Idempotence and checksum/version verification |
| Pure + API integration tests | \`npm run verify\` | Data validation, session security, CSRF, roles, corrections and PostgreSQL workflows |
| Chromium E2E | \`npm run test:e2e\` | Reporter, reviewer, source, publication, correction, retraction, demo persistence, mobile, keyboard |
| Accessibility smoke | \`test/accessibility.smoke.mjs\`, imported by E2E | Basic names, labels, landmarks, IDs, keyboard/dialog focus |
| PostgreSQL recovery drill | \`PROTESTO_BACKUP_TEST=1 npm run test:backup\` | Encryption, tamper refusal, empty target restore and data parity |

### Limitations

- The audit depends on the npm registry advisory database at execution time; no vulnerability scan guarantees complete security.
- Dependency versions are not currently locked in a committed \`package-lock.json\`. Reproducible installs and supply-chain pinning are a follow-on engineering gate.
- Accessibility smoke checks are **not** a full automated WCAG audit and cannot replace screen-reader/manual testing.
- E2E uses synthetic records and disposable accounts. Do not run it against a live production database.
- A passed isolated restore test is not proof of automated offsite backups, key management or scheduled disaster recovery in production.
- Human moderation, legal/privacy assessment, institutional verification and public deployment approvals are outside CI.
- Previous red runs remain useful history. Use the most recent **successful run that matches the exact commit** when making verification claims.

## Evidence

- [Successful pre-expansion verification — run #39665497810](https://github.com/titanfit102-bit/Protesto/actions/runs/39665497810) (16 unit/integration tests, Chromium and encrypted PostgreSQL restore).
- [Successful syntax, runtime audit and accessibility-smoke extension — run #39666863606](https://github.com/titanfit102-bit/Protesto/actions/runs/39666863606).
- Latest PR: [Draft pull request #1](https://github.com/titanfit102-bit/Protesto/pull/1).

- [Complete verification after remediation — run #39667630075](https://github.com/titanfit102-bit/Protesto/actions/runs/39667630075): all-dependency npm audit, JavaScript syntax, 16 Node tests, Chromium E2E/accessibility smoke, PostgreSQL migration replay, encrypted isolated restore. Auditing the development dependencies exposed 7 high-severity advisories in older puppeteer-core transitive packages; upgrade to `^25.15.0` passed in this run.
