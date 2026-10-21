# PROTESTO — CURRENT VERIFIED STATUS

**Updated:** 2026-10-21  
**Repository:** titanfit102-bit/Protesto — **PUBLIC repository**, private-pilot application (not deployed)  
**Working branch:** feat/protesto-foundation  
**Pull request:** #1, DRAFT, unmerged. Main branch unchanged.

## Current CI evidence

- Last complete green run before expanded full dependency audit:
  [GitHub Actions #39666863606](https://github.com/titanfit102-bit/Protesto/actions/runs/39666863606)
  for commit \`96b89f6a6f561072139498fbe7bccfe34cecafe2\`.
- Checks that passed: all 16 Node tests, repeatable PostgreSQL migrations, Chromium pilot and demo E2E including accessibility smoke and keyboard focus, JavaScript syntax, runtime dependency audit at high severity, AES-256-GCM encrypted archive and isolated PostgreSQL restore with matching data.
- The earlier runner problem is **resolved** and recorded as [Issue #2](https://github.com/titanfit102-bit/Protesto/issues/2) (closed).
- **Full dependency security audit also passed**: [Actions run #39667630075](https://github.com/titanfit102-bit/Protesto/actions/runs/39667630075), commit `743f29c65a3d650f2bf3df1f6269e94ec2e87453`; Chromium and encrypted PostgreSQL restore also passed on that commit. This followed upgrading `puppeteer-core` to `^25.15.0` after finding 7 high-severity development dependency advisories in an earlier audit run.
- Historical failed runs remain in GitHub for audit purposes; they do **not** have to be rewritten as passed. Later green checks supersede earlier failures for the same tested behavior.

## Implemented

- Albanian browser-only civic demo with fictional source data.
- Separate PostgreSQL private pilot with manually provisioned accounts, roles, sessions, CSRF protection, cases, sources, corrections, initiatives and peaceful gatherings.
- Editorial case review and audit trail, independently accepted source URL required before publication.
- Archival/retraction with private audit notes and minimal public status ledger.
- GDPR-oriented own-data export as an early feature, **not** a complete legal process.
- Encrypted PostgreSQL pilot backup, integrity verification, guarded restore into empty test databases.
- Automated tests for logic, API authorization/integration, browser flows, simple accessibility heuristics, backup and source schema.

## Four distinct maturity assessments

| Dimension | Evidence-based assessment |
|---|---|
| Implementation | Working demo and private pilot; many target platform modules remain absent |
| Verification | Core test flows verified in CI; accessibility smoke is not a comprehensive accessibility audit |
| Release readiness | **BLOCKED** for public production |
| Professional maturity | Modular structure and documented gates; operations, abuse prevention, compliance and editorial governance unfinished |

## P0 / P1 outstanding

**P0 (required before public use):** independent security and accessibility audits; MFA/abuse defense and account lifecycle; authoritative source provenance, redaction and formal right-of-reply/appeals; privacy and legal review; backup retention/offsite storage with operational restore drill; production monitoring/incident response and explicitly approved public deployment.

**P1 (product expansion):** official information requests and institutional response tracking; legitimate evidence ingestion; source-cited AI with human review; responsible privacy-safe maps; private pilot outcomes and governance.

## Execution boundary

No merge into main, public application deployment, expenses or changes to other repositories occurred in these commits. Repository **code visibility is currently public**, which is different from deploying a working public website. Do not commit secrets or sensitive documents.

## Next engineering tranche

Prioritize meaningful release blockers rather than counting extra features as completion: improved identity and anti-abuse, accessible UX audit, formal correction/appeals workflow, source provenance, and real operational recovery policy. External legal judgment, human content verification and a genuine production environment cannot be certified by GitHub Actions alone.
