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

## Development tranche — independent appeals and shared throttling (2026-10-21)

- Added a one-time citizen appeal for a rejected correction, using a distinct second reviewer. The original editorial rejection remains on record. Acceptance archives a still-published case and records retraction plus audit in one transaction; rejection preserves the prior publication.
- Appeals are private to the submitter and qualified reviewers; the original correction reviewer, appeal author, and affected case author may not judge the appeal.
- Added PostgreSQL-backed, atomic, cross-instance rate limiting for login by remote network address (12 / 15 minutes), login by normalized account (15 / 15 minutes), and authenticated write attempts (120 / hour). Keys are HMAC-SHA256; the private pilot requires a separate stable 32+ character PROTESTO_RATE_LIMIT_SECRET.
- New migrations: 005_correction_appeals.sql and 006_shared_rate_limits.sql. Existing schema is not altered destructively.
- **Verified:** [GitHub Actions run #39670591638](https://github.com/titanfit102-bit/Protesto/actions/runs/39670591638), commit `97d827425740247688b9631612fd6b87cb758484`: 17 Node test cases passed, PostgreSQL integration includes acceptance/refusal and independent review, Chromium smoke passed, dependency audit passed, migration replay passed, encrypted Postgres restoration passed.
- Current restrictions: no public application deployment or merge. Rate limiting alone is not full abuse prevention. Appeal process does not implement a legally certified remedy, external arbitrator, notification deadline or independent governance.

## Next hardening
1. Revocable device sessions and password reset/MFA with audited operational process.
2. Formal public correction history, independent moderator SOP, evidence redaction and appeal escalation.
3. End-to-end browser tests specifically for the appeal UI and abusive traffic conditions.
4. Backup retention policy, verified offsite storage, monitoring, legal/privacy review and private pilot.


## 2026-10-22 — Polis-inspired Dialogu Qytetar, phase 1

**Implemented:** original civic dialogue module linked to published civic cases; reviewer-created neutral topics, citizen statements pending independent moderation, three-way responses, explicit privacy acknowledgment, no live aggregates, results only after topic close and per-statement minimum of ten participants, and deletion of all active individual vote rows in the same transaction as finalization. No statistical opinion clusters, targeting or AI are used.

**Technical source:** db/007_civic_dialogue.sql, src/server/dialogue.mjs, src/pilot-dialogue.mjs, test/dialogue.integration.test.mjs, test/dialogue.browser.e2e.mjs and docs/POLIS_DESIGN_ADAPTATION.md. Polis AGPL code was not copied.

**Verification:** [GitHub Actions #39687784143](https://github.com/titanfit102-bit/Protesto/actions/runs/39687784143) passed **18/18 Node tests**, PostgreSQL migration/replay, Chromium original and dialogue browser E2E, security audit, JS checks and encrypted PostgreSQL restore.

**Limitations:** a ten-response threshold and finalized-only tally do not confer anonymity or statistically representative polling. Vote identifiers are keyed pseudonyms linked to accounts by the server's secret; vote records may survive on earlier backup copies. Critical open items: processing lawful basis/DPIA, informed participant notices, pseudonym and backup retention, countering fake accounts, editorial disputes, anti-harassment and unbiased discussion rules, independent threat assessment, manual accessibility testing and real user acceptance.

**Next phases:** structured, independently reviewed institutional-response tracking plus source-cited aggregate reporting; only later consider any privacy-audited opinion clustering or human-reviewed AI. Never turn dialogue into individual political persuasion or targeting.


## Additional dialogue reporting (2026-10-22)
- Added descriptive public report GET /api/dialogue/report and a visible downloadable JSON report for finalized eligible statements, with self-selection caveats and links to the topic and source accepted by reviewers.
- Integration tests ensure open topics, sub-threshold statements and cases subsequently archived are excluded. No private participant identities are exported.
- This is **not** an AI report, PCA analysis, political targeting mechanism or statistical proof of agreement across demographic groups. It is a transparent descriptive tally for consenting pilot participants.
- [GitHub Actions run #39688457772](https://github.com/titanfit102-bit/Protesto/actions/runs/39688457772) completed its Node, migration, Chromium, audit and encrypted recovery steps successfully on the tested commit. The final documentation-only commit should have its own CI status checked.

## OpenCode orchestration milestone — 2026-10-22

OpenCode+GitHub Actions now supports a **bounded, persistent V2 task backlog** on experiment/opencode-pilot (controller PR #3). Only a verified free model is allowed. Agent works without GitHub write credentials; separate job checks artifacts and creates isolated draft PRs into feat/protesto-foundation. User may submit new tasks while one is active, without cancellation. Queue updates are snapshot-based and existing per-task branches avoid regeneration.

- Pilot proof: OpenCode-generated filter regression tests [Draft PR #7](https://github.com/titanfit102-bit/Protesto/pull/7).
- Actual source-code proof: privacy-limited dialogue summary pure module and test suite [Draft PR #9](https://github.com/titanfit102-bit/Protesto/pull/9), [Actions #39768946834](https://github.com/titanfit102-bit/Protesto/actions/runs/39768946834) green.
- Both PRs remain UNMERGED and require architectural/code review before integration. Generated module is **not yet wired into the live pilot interface**.
- GitHub backlog can hold historical and waiting tasks, but standard PR concurrency and a maximum of 4 new tasks per run prevent a guarantee of infinite autonomous processing. See docs/OPENCODE_TASK_QUEUE.md and issue #8. No production data or model API keys used.
