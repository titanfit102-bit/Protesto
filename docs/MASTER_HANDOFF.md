# PROTESTO — MASTER HANDOFF (canonical continuity record)

**Continuity branch:** `docs/protesto-continuity` — [browse the branch](https://github.com/titanfit102-bit/Protesto/tree/docs/protesto-continuity)  
**Quick checkpoint:** [`docs/STATUS.md`](./STATUS.md)  
**Full handoff:** [`docs/MASTER_HANDOFF.md`](./MASTER_HANDOFF.md)  
**Repository:** https://github.com/titanfit102-bit/Protesto  
**Protocol authorized:** 2026-10-23. **Initial source-code checkpoint:** PR #58 at `4aec08ac16207af4c36ee0e1f0f84e5f2c0c67d5`.  
**Evidence boundary:** reconstruction from available project-conversation context, the owner's 2026-10-23 handoff, repository documentation and GitHub read-only inspection. Not a verbatim export of every historical chat. Data below are tagged **VERIFIED**, **DECIDED**, **PLANNED**, **PARTIAL**, **UNKNOWN** or **BLOCKED** as appropriate.

> **START HERE IN A NEW CHAT:** Read `docs/STATUS.md` from the HEAD of **this branch**, then this file. Check the latest actual PRs, commits, workflow runs and branch tree in GitHub (not just these notes); compare them with the recorded code checkpoint. Read the other source documents referenced here as needed. Continue from the exact open task within the current authorization boundary. Do not infer that the continuity branch's latest commit is a tested application commit.

## 1. Identity and final product vision — DECIDED

**Protesto** is an independent, politically nonpartisan Albanian civic-transparency/accountability platform, separate from all other projects. It aims to connect a civic report with evidence, independent human moderation, a carefully redacted public dossier, corrections/retractions, lawful peaceful participation, documented official/institutional responses, and an evidenced outcome over time. Public accountability must not be confused with an unverified accusation, political persuasion, or a representative poll.

Core principles:
- Neutral editorial criteria; verifiable sources and explicit uncertainty; peaceful, lawful participation.
- Original reports, evidence and reviewer notes stay private; only independently reviewed **public copies** may be exposed.
- Author cannot unilaterally approve their submission. Conflicts of interest, correction, independent appeals, withdrawals and audit history matter.
- No gathering attendance registry, participant geolocation tracking, voter profiling, covert coordination, political microtargeting, automated allegation publication, or rage-optimized feeds.
- AI document assistance, if built later, requires cited evidence, provenance, human sign-off and appropriate safeguards. AI is not currently an authoritative fact checker.
- Dialogue aggregate thresholds prevent certain small-group disclosures but **do not** ensure anonymity or representative public opinion.

**Source of product truth:** [`MASTER_BLUEPRINT.md`](./MASTER_BLUEPRINT.md), [`DECISION_LOG.md`](./DECISION_LOG.md), [`POLIS_DESIGN_ADAPTATION.md`](./POLIS_DESIGN_ADAPTATION.md). Some introductory sections are historical and describe an earlier implementation; reconcile them against code and the newer checkpoint.

## 2. Owner requirements and operational authorization — DECIDED

- Work only in `titanfit102-bit/Protesto`; never reuse another project's branches, databases, secrets or deployment.
- No OpenCode. Prefer ChatGPT/GitHub with exact code/CI evidence; report completed work separately from plans, assumptions and external controls.
- **Explicit authorization is required before creating/editing/deleting application code or other repository artifacts unless a particular action/scope was already approved.** No blanket permission to alter code is implied by the continuity protocol.
- **Standing authorization (2026-10-23):** create and maintain ONLY `docs/STATUS.md` and `docs/MASTER_HANDOFF.md` on branch `docs/protesto-continuity` after every **material, verified** project change, without asking again. No other file or branch modification is included in this standing authorization.
- Never merge to `main`, retarget or merge a PR, deploy, activate real-data handling/deletion, change production, incur costs, or touch another project without separate owner authorization. Do not open a PR merging the continuity branch to `main` until a separately approved integration plan exists.
- Development modifications, when specifically authorized, use isolated branches, test evidence and Draft PRs. No unapproved destructive actions. Synthetic fixtures only for tests.
- Keep the repository's public visibility in mind: no credentials, tokens, private citizen data, operational secrets, private addresses, or sensitive unpublished allegations in these public documents.
- User requests precise status/progress and a resumable next action; do not invent arbitrary completion percentages. A justified future weighted acceptance matrix may produce a transparent score; CI success never means Production readiness.
- The owner wants active development to continue **alongside** documentation updates, not be replaced by administrative handoff work.

## 3. Architecture and technologies — VERIFIED from the branch/code

- **Mode A — fictional browser-only demo:** HTML, CSS, native JavaScript ES modules and `localStorage`, no backend/database; not a multiuser or public-service deployment.
- **Mode B — private synthetic pilot:** Node.js >=22, same-origin HTTP/API and PostgreSQL 16+, parameterized SQL, 16 versioned migrations (`db/001_initial.sql` through `db/016_independent_topic_review.sql`), original browser pilot UI.
- Roles `reporter`, `reviewer`, `admin`; operator-provisioned accounts; scrypt password hashes; random hashed session tokens/HttpOnly SameSite cookies; strict origin/header CSRF checks; revocation; atomic HMAC-keyed PostgreSQL throttling.
- Reviewer TOTP MFA is **opt-in**, not universally required; secret AES-GCM encryption and anti-replay. No fully approved account recovery or key rotation.
- Editorial case/source review; separate approved public source, title, description and location; independent decisions and audit logs; initiatives/gatherings, citizen responses, corrections and second-reviewer appeals.
- Civic dialogue: original Polis-inspired concept (no incorporated Polis AGPL source), moderated topics/statements, agree/disagree/pass, no live results, final aggregate only with 10+ respondents per statement, active individual vote rows deleted on closure. Backup copies and pseudonymous identifiability remain open privacy issues.
- Experimental locally declared PDF SHA-256 fingerprints are **not** chain-of-custody/authenticity proof; no trusted file vault or automatic source ingestion.
- Encrypted synthetic PostgreSQL backup/restore drills, disposable CI staging rehearsal, admin-only aggregate ops status, fail-closed Production release gate. None is live offsite/hosted Production operations.
- `package.json` pilot version `0.4.0`; `pg` and `puppeteer-core`. A committed npm lockfile was **not found** at the checkpoint (reproducibility gap).
- Key layout: `.github/workflows/verify.yml`, `db/`, `src/server/`, `src/ops/`, `test/`, `tools/`, `docs/`, `pilot.html`, `index.html`.

## 4. Implemented and verified functional groups (synthetic scope)

| Area | Implementation | Evidence boundary |
|---|---|---|
| Browser demo, forms, search, local storage, mobile view | Implemented | Chromium/E2E demo checks; fictional/local only |
| Cases and moderated publication/retraction | Implemented | PostgreSQL/API + Chromium pilot journey |
| Accepted/rejected sources, reviewer decisions, publication copies | Implemented | Automated role/privacy regression paths; human provenance unverified |
| Editorial privacy partitions, public allowlists, ledger | Implemented | Scoped integration/role tests; semantic PII review still human |
| Corrections, independent appeals, citizen responses | Implemented | Integration and concurrency/role tests; no formal institutional legal remedy |
| Peaceful gatherings/initiatives | Implemented | Reviewed public copies and quotas; no attendance capture |
| Dialogue topics/statements/votes/final aggregates | Implemented | Synthetic integration + Chromium; nonrepresentative and privacy/legal review outstanding |
| Sessions, basic MFA, rate limiting, CSRF | Implemented / PARTIAL | Tested scoped invariants; account recovery, MFA policy, WAF pending |
| Subject data export | PARTIAL | Owner-only categories + truncation signal; **not complete GDPR rights** |
| Expiry retention helper | PARTIAL | Read-only default; synthetic-only guarded `--apply` limited to expired `sessions` and `request_rate_limits`; **no content erasure** |
| Encrypted archive/restore and offline preview | Test-only | Disposable PostgreSQL/Chromium CI; not actual offsite backup/staging |
| Official institutional authentication/replies, source ingest, AI citations, public map | NOT IMPLEMENTED | Future work requiring legal, provenance and privacy safeguards |

**Do not conflate:** source code present ≠ tested flow ≠ approved pilot ≠ Production.

## 5. Exact GitHub baseline, PR topology and CI — VERIFIED 2026-10-23

- Repository is **PUBLIC** as code; the application has **not** been publicly deployed.
- `main` at `1e34611bdb48195e7deadb8e33d26ddac3338c4d`, containing the initial README only; GitHub inspection found `main` **unprotected** at this checkpoint. No merge performed.
- Foundation: [Draft PR #1](https://github.com/titanfit102-bit/Protesto/pull/1) `feat/protesto-foundation` on `main`, unmerged.
- Main cumulative stack: [Draft PR #31](https://github.com/titanfit102-bit/Protesto/pull/31) based on foundation, followed in successive base/head chain by PRs **#32–#59**; #31–#57 were checked as Draft/unmerged at prior audit, #58 at continuity initialization, and #59 at this checkpoint. Historical #4–#30 include overlapping/experimental branches, some OpenCode-related; never merge them blindly. #28–#30 overlap work integrated in #31.
- Major PR groups:
  - #31–#35 integration of dialogue/corrections/ledger, separate public source metadata, experimental PDF hashes and publication privacy.
  - #36–#42 reviewer TOTP, shared abuse/session protection, moderated replies, URL/ARIA, admin ops, disposable staging, release gating.
  - #43–#49 approved public sources/actions/case area/topic+statement copies, archival-guarded appeals, independent topic review.
  - #50–#55 parent-row transactional locks, quota/late-submission protections, fail-closed secondary public APIs, consistent public SQL snapshots.
  - [#56](https://github.com/titanfit102-bit/Protesto/pull/56): expanded own-data export with explicit incomplete coverage.
  - [#57](https://github.com/titanfit102-bit/Protesto/pull/57): retention register and synthetic-only operational expiry helper; SHA `e64f75163be41dd24e464d068e059188668969cc`, [CI success #39937755492](https://github.com/titanfit102-bit/Protesto/actions/runs/39937755492), 62/62 Node tests at that SHA.
  - **Prior code checkpoint:** [Draft PR #58](https://github.com/titanfit102-bit/Protesto/pull/58), `feat/protesto-utf8-url-ci-hardening`, base `feat/protesto-operational-retention-safety`, **HEAD `4aec08ac16207af4c36ee0e1f0f84e5f2c0c67d5`**, open/unmerged. Adds chunk-safe strict UTF-8 JSON parsing, trailing-dot hostname normalization, tests, and a future-stack GitHub Actions branch glob.
- **Prior CI verified at exact PR #58 SHA:** [GitHub Actions run #39980887111](https://github.com/titanfit102-bit/Protesto/actions/runs/39980887111), `completed/success`; fetched job logs show **64 tests, 64 pass, 0 fail**, npm audit **0 vulnerabilities** at that run, and successful migration, browser/E2E, offline preview and synthetic encrypted restore job steps. This is *not* evidence of production safety.
- Compared PR #57 -> #58: six commits ahead, zero behind, five changed files (HTTP parser, outbound URL filter, two test files, CI workflow).
- **Current verified code candidate:** [Draft PR #59](https://github.com/titanfit102-bit/Protesto/pull/59), `feat/protesto-reproducible-deps` stacked on #58 `feat/protesto-utf8-url-ci-hardening`; **HEAD `b1c52f0e8074f8b73d0c8dd80f72d2953b4bdacc`**, open Draft / unmerged. It changes **only** `.github/workflows/verify.yml` and newly adds `package-lock.json` relative to #58 (three commits ahead, zero behind). Real npm registry resolution was performed on disposable GitHub Actions run #39984696626 (bootstrap), producing npm lockfile v3 with 40 packages. The temporary diagnostic capture step was **removed** from the final workflow; final install uses `npm ci --no-audit --no-fund`.
- **CI verified at exact PR #59 SHA:** [GitHub Actions run #39984965787](https://github.com/titanfit102-bit/Protesto/actions/runs/39984965787), completed/success; fetched logs show **64/64 Node tests, 0 failures**, successful frozen `npm ci`, npm audit reporting **0 vulnerabilities at the time**, idempotent migrations, syntax checks, Chromium E2E/accessibility smoke, offline preview and synthetic encrypted backup restore. The passing CI is **not** Production, legal or independent security clearance.

- **Continuity branch `docs/protesto-continuity`** was created directly from PR #58 verified code SHA. Its further docs-only commits **will not have application CI evidence by inheritance**. Refer to the independently verified PR #58 SHA for tested code; always recheck subsequent source commits.
- Existing docs matrix and original `STATUS.md` are partly stale (older PR references). The original complete STATUS history is preserved in Git at [pre-continuity code checkpoint](https://github.com/titanfit102-bit/Protesto/blob/4aec08ac16207af4c36ee0e1f0f84e5f2c0c67d5/docs/STATUS.md), and older states remain in Git history.

## 6. Confirmed architectural decisions and rationale

[27 numbered ADRs](./DECISION_LOG.md) are the authoritative decision log. Distilled reasoning: dual demo/pilot isolation; native web for scoped prototype; transactional PostgreSQL for editorial integrity; independent review and fail-closed publication; restricted privacy projections; no public sign-up in private pilot; no attendee identity tracking; cautious pseudonymous dialogue with suppression; no AI assertions without citations; GitHub Draft PR with owner-controlled merge; no Production after CI alone. Changes to those decisions require separate owner approval and ADR update.

The **continuity protocol** itself is an owner decision dated 2026-10-23: two docs only on the dedicated branch, kept fresh after material verifiable changes, with GitHub re-verification and no code/Production authority.

## 7. Open issues and risk register

**P0 / Production BLOCKED:**
1. Independent technical threat model/security assessment and penetration review; hosted TLS/gateway/WAF/secrets/rotation validation.
2. Legal/privacy owner, lawful basis and DPIA where applicable, real data-rights workflow, category-specific retention, legal hold, backup lifecycle, public notice.
3. Formal neutral editorial governance, independent evidence provenance, privacy-safe redaction and institutional right-of-reply/appeal with verified institution identities.
4. MFA/recovery enrollment and revocation policies, abuse handling, independent moderation oversight.
5. Genuine isolated hosted Staging, offsite encrypted backups and timed restore, monitoring/incident ownership and drills, accessibility WCAG/manual assistive-technology acceptance.
6. Owner-approved branch integration, release safety criteria and explicit deploy approval; no sensitive allegations or political opinion data live before gates.

**P1 engineering/product work:**
- `main` branch protection currently absent; define required checks and review before any approved merge.
- npm dependency lockfile and `npm ci` are **implemented/verified in Draft PR #59**; this fixes npm dependency graph reproducibility for its tested environment, **not** complete toolchain or external action/container immutability (Node 22 minor, Postgres 16 tag, Chromium, `actions/*@v4`).
- Workflow now uses `pull_request` branch pattern `feat/protesto-*` (from PR #58), but `workflow_dispatch` on default `main` is not available there until separately approved integration.
- CI and unit/API tests are nonexhaustive; continue adversarial role/race/accessibility tests against synthetic DB.
- Retention environment guard is a scoped CI-only safeguard, **not a substitute for true process/network/database isolation or approved content-deletion policy**.
- Official response tracking, source/provenance archive, mobile/editor experience and safe AI/map features are planned, not yet built.
- Stacked multi-PR architecture needs an independently reviewed integration plan. Never bulk-merge overlapping PRs.

**UNKNOWN / do not infer:** full inaccessible chat transcripts; any undocumented historical decisions; penetration test, certified WCAG review, real institutional partnerships, live pilot users, approved DPIA, offsite backups, Production deployment, legal compliance or real civic issue resolution.

## 8. Roadmap to completion (plan, not completed work)

**Phase 0 — consolidate technical baseline:** independently audit code/PR stack, eliminate priority regressions, pin dependencies, improve automated coverage and reproducibility, reconcile docs and design safe integration/review.  
**Phase 1 — identity, privacy, security, governance:** account lifecycle/recovery and reviewer MFA policy; formal redaction, evidence and due-process SOPs; secure retention subject-rights design; external human/legal audits.  
**Phase 2 — institutional accountability:** verified institution directory/identity, formal reply procedures, deadline and case-response tracking, source and decision provenance, validated outcomes; avoid falsely labeling citizen comments as official statements.  
**Phase 3 — accessible product UX:** citizen/editor dashboards, Albanian UX, mobile and assisted-technology validation, improved search and safety notices.  
**Phase 4 — controlled operational staging:** isolated hosted staging when separately authorized, no sensitive fixtures, backups/restore, alerts, incident drills, performance/load/race tests and internal limited acceptance.  
**Phase 5 — owner-approved public MVP:** all relevant P0 evidence/review complete, explicitly approved minimal launch scope, gradual rollout, monitoring, rollback and real moderation operations.  
**Phase 6 — carefully reviewed expansion:** broader municipalities/institution coverage, authoritative source connectors, cited human-reviewed AI, privacy-safe aggregated analytics and optional maps. No political profiling/manipulation.

A "100%" claim requires a defined weighted acceptance matrix for the chosen target (synthetic pilot vs public MVP vs national vision), with real test/review evidence and release gates. Numbers of commits, PRs and green tests are not completion percentages.

## 9. Current active work and exact next action

**Completed at this checkpoint:** PR #58 HTTP/URL/CI fixes and scoped CI; PR #59 npm lockfile plus frozen `npm ci` with successful exact-SHA CI. Continuity branch was originally created from PR #58 code SHA and independently records the newer #59 candidate.  
**Continuity operation:** maintain the short `STATUS.md` and this full `MASTER_HANDOFF.md` in the authorized docs branch, each with precise code checkpoint and verified evidence.  
**Next development task (READ-ONLY, unless separately authorized):** inspect GitHub branch protection, stacked Draft PR integration/review prerequisites and required checks before any merge planning; then perform deeper retention process/database isolation and remaining toolchain reproducibility analysis. The owner has not authorized new application-code changes, `main` merge, deploy, payments or real civic data processing. Present a focused proposal before any further source edits.

## 10. Rules for ongoing updates

1. On each substantive project step, **READ** current GitHub PR head/status, branch references and exact CI run; distinguish newly observed facts from historical checkpoint.
2. Determine material change: merged/proposed code or PR, important verified CI outcome, architectural decision, risk, blocker, objective, authorization, roadmap or interruption. If nothing material changed, do **not** generate gratuitous docs commits.
3. Update **only** `docs/STATUS.md` (always short and actionable) and, when long-term context changes, `docs/MASTER_HANDOFF.md`; append links/deltas rather than copying full history. Existing ADR/blueprint/release documents remain authoritative; editing them requires separate explicit authorization.
4. Commit to **`docs/protesto-continuity` only**. Confirm GitHub write succeeded; read back the exact files and confirm their actual branch commit. Do not claim saved otherwise.
5. Record tested **code SHA** independently from continuity **docs SHA**. A docs commit does not mean new code passed CI. If CI is pending or failed, say so.
6. If paused/interrupted, mark task `IN_PROGRESS` or `BLOCKED`, with last successful checkpoint, any unconfirmed writes, exact resume action and blockers. No invented completion.
7. In each substantive progress response, briefly state **completed / remaining / next action / handoff status**.
8. These updates occur during active work/turns; this is not an independently running background job or a real-time GitHub watcher.

## 11. Recovery and source links

1. Open repository https://github.com/titanfit102-bit/Protesto and branch [`docs/protesto-continuity`](https://github.com/titanfit102-bit/Protesto/tree/docs/protesto-continuity) explicitly, **not `main`**.
2. Read **`docs/STATUS.md` first** for checkpoint, status, blockers and exact task; then this full handoff.
3. Verify the latest GitHub PR and CI directly, especially [PR #58](https://github.com/titanfit102-bit/Protesto/pull/58), any successors, plus `main` and any newer changes after this document's recorded SHA.
4. Consult [`DECISION_LOG.md`](./DECISION_LOG.md), [`MASTER_BLUEPRINT.md`](./MASTER_BLUEPRINT.md), [`INTEGRATION_AUDIT_MATRIX.md`](./INTEGRATION_AUDIT_MATRIX.md), [`RELEASE_READINESS.md`](./RELEASE_READINESS.md), [`RELEASE_GATES.md`](./RELEASE_GATES.md), [`CI_VERIFICATION.md`](./CI_VERIFICATION.md), [`OPERATIONS.md`](./OPERATIONS.md), [`DATA_RETENTION_AND_ERASURE_REGISTER.md`](./DATA_RETENTION_AND_ERASURE_REGISTER.md) as task requires.
5. If a newer commit/PR/run conflicts with the checkpoint, treat GitHub as source of current technical truth and record the delta before any new implementation.
6. Continue authorized technical work from the next uncompleted action. **No reset to zero; no assumption of comprehensive previous transcript access; no automatic merge/deploy.**

**One-line bootstrap for a new conversation:** "Vazhdo Protesto. Lexo GitHub branch `docs/protesto-continuity`, fillimisht `docs/STATUS.md`, pastaj `docs/MASTER_HANDOFF.md`. Verifiko PR/CI aktuale dhe vazhdo sipas autorizimeve, pa merge/deploy."
