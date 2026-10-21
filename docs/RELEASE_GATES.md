# PROTESTO — EVIDENCE-BASED RELEASE GATES

**Scope:** nonpartisan civic transparency platform, lawful peaceful participation, privacy-sensitive reporting. An automated passing test is evidence for the specific tested workflow, not a blanket approval for production.

| Gate | Minimum production evidence | Status |
|---|---|---|
| Browser demo correctness | Validated forms, navigation, filtering, storage and mobile behavior | VERIFIED for tested flows |
| Pilot core workflow | Authentication, PostgreSQL, RBAC, moderated evidence, publication/retraction and audit | VERIFIED for automated cases; manual audit pending |
| Data recovery test | Encrypted archive, tamper rejection, empty-database restore, row parity | VERIFIED in disposable CI database; operational backups still OPEN |
| Dependency audit | No high/critical npm findings in the scoped dependency set | VERIFIED for runtime and development dependencies in run #39667630075 (after upgrading puppeteer-core) |
| JavaScript syntax | All JS module files syntax-checked in CI | VERIFIED |
| Browser accessibility smoke | Unique IDs, accessible control labels/names, landmarks, basic keyboard focus, dialog focus | VERIFIED as smoke tests; full WCAG/accessibility audit OPEN |
| Formal editorial safeguards | Provenance, redaction, right of reply, independent dispute/appeal workflow | PARTIAL / P0 |
| Privacy and legal | Legal basis, data handling notices/rights, retention, necessary local counsel review | OPEN / P0 |
| Identity/abuse | MFA where appropriate, distributed throttling, recovery/revocation, abuse review | PARTIAL / P0 |
| Production security | Threat model, secrets management, independent security assessment, TLS validation | PARTIAL / P0 |
| Operations | Secure offsite backup/retention, scheduled restore drills, monitoring, rollback, incident owner | PARTIAL / P0 |
| External sources and AI | Reviewed source connectors, citations/provenance, model safety and human sign-off | NOT IMPLEMENTED / P1 |
| Public deployment | Owner authorizes merge and launch separately | NOT AUTHORIZED |

## Latest verified automated pipeline

[Actions run #39666863606](https://github.com/titanfit102-bit/Protesto/actions/runs/39666863606) passed all stages for commit \`96b89f6a6f561072139498fbe7bccfe34cecafe2\`, including Chromium browser and backup/restore. The expanded audit originally surfaced 7 high-severity development dependency advisories; upgrading puppeteer-core resolved the findings, and [run #39667630075](https://github.com/titanfit102-bit/Protesto/actions/runs/39667630075) passed the full audit and all other CI stages.

## What CI cannot complete

GitHub Actions cannot itself establish that public allegations are factually correct, conduct legal/DPIA review, validate true local-government responses, obtain editorial consent, certify real backup operations, or authorize publication. These are external or human-controlled release gates.

## Definition of done for production

All P0 gates require reproducible evidence and independent review appropriate to risk, a functioning staging and production environment, documented owners and incident procedures, and the project's owner's explicit approval. Historical CI runs with failures should remain visible; a newer passing run is the current code verification baseline.

## New evidence — editorial appeals and shared quotas

In [run #39670591638](https://github.com/titanfit102-bit/Protesto/actions/runs/39670591638), all 17 Node tests, PostgreSQL migration replay, headless browser smoke and encrypted restore drill passed. An independent second-reviewer appeal flow and shared PostgreSQL rate-limit implementation are tested. **Still PARTIAL for production:** centralized reverse-proxy rate limiting, safe account recovery, operational escalation, external appeal remedies, verified evidence redaction, incident response and privacy/legal checks.
