# PROTESTO — RELEASE GATES

No real public launch unless all mandatory gates are satisfied and the owner separately approves public deployment and any costs.

| Gate | Evidence required | Current |
|---|---|---|
| Product | Real-user pilot validates critical reports workflow | OPEN |
| Data integrity | Migration, concurrent update, retention and restore tests | PARTIAL |
| Access control | Automated and manual authentication / RBAC verification | PARTIAL |
| Editorial safety | Independent source review and corrections exist; appeals and formal right of reply still missing | PARTIAL |
| Privacy/legal | Policies, DPIA where applicable, professional local review | OPEN |
| Platform | HTTPS, secure cookies, CSP, isolation, service monitoring | PARTIAL |
| QA | Domain, PostgreSQL integration and Chromium E2E automated; accessibility and independent audit pending | PARTIAL |
| Operations | Backups, alerting, response owner, rollback playbook | OPEN |
| Sources / AI | Manually reviewed URL references; document provenance and AI checks not yet available | PARTIAL |
| Decision | Explicit merge and public deployment authorization | OPEN |

## Measurable acceptance test examples
- Non-logged-in user cannot submit reports.
- Reporter cannot read the moderation queue or publish content.
- Reviewer cannot publish their own report.
- Repeated review decisions cannot create duplicate publication entries.
- Public pages do not expose pending reports.
- Sensitive fields and credentials are not present in server logs or client bundles.
- Backup restored in a separate environment matches expected data.
- All published claims link to reviewed sources; corrections are traceable.
- Every critical flow works on mobile and desktop with keyboard-only access.

## Status language
A passing unit test = a tested module, *not* a finished product. An integrated pilot with test accounts = pilot functionality, *not* production. Production-ready requires every relevant gate supported by evidence. Never use an arbitrary feature-count percentage as evidence of completeness.

## Browser E2E details

The GitHub workflow uses a disposable PostgreSQL service and Chromium to test the pilot lifecycle and browser-only demo. Passing smoke tests does not establish legal compliance, content verification, resilience, production accessibility or safe public operation.

## Encrypted backup gate, October 21, 2026

Backup encryption/decryption logic has standalone local unit-test evidence. Full PostgreSQL dump→encrypted archive→isolated restore parity is implemented as `npm run test:backup` and configured in GitHub Actions, but **has not yet run successfully on the new revision** because job initialization failed before any steps. This is **PARTIAL**, not verified operational recovery. Requires a green disposable-DB restore drill and independent offsite policy before production.

## Follow-up verification: 2026-10-21

Local Node crypto checks: 3/3 passed on recreated current crypto routines, including interruption and concurrent archive creation. End-to-end PostgreSQL restore and new public ledger checks cannot be counted as verified because GitHub Actions is failing at runner allocation; see [Issue #2](https://github.com/titanfit102-bit/Protesto/issues/2). Full production readiness remains **BLOCKED**.
