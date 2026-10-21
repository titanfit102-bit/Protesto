# PROTESTO — RELEASE GATES

No real public launch unless all mandatory gates are satisfied and the owner separately approves public deployment and any costs.

| Gate | Evidence required | Current |
|---|---|---|
| Product | Real-user pilot validates critical reports workflow | OPEN |
| Data integrity | Migration, concurrent update, retention and restore tests | PARTIAL |
| Access control | Automated and manual authentication / RBAC verification | PARTIAL |
| Editorial safety | Independent review, corrections, appeals, right of reply | OPEN |
| Privacy/legal | Policies, DPIA where applicable, professional local review | OPEN |
| Platform | HTTPS, secure cookies, CSP, isolation, service monitoring | PARTIAL |
| QA | Domain, integration, browser E2E, accessibility and regression | PARTIAL |
| Operations | Backups, alerting, response owner, rollback playbook | OPEN |
| Sources / AI | Trustworthy ingestion, citations, hallucination checks | OPEN |
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
