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
- `package.json` pilot version `0.4.0`; `pg` and `puppeteer-core`. **CURRENT:** PR #59 commits `package-lock.json` (40 resolved packages) and uses successful `npm ci` in Actions. **HISTORICAL BEFORE #59:** the npm lockfile was missing. Toolchain pinning remains PARTIAL.
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

### Integration safety audit checkpoint — 2026-10-23 (VERIFIED read-only; proposals not approved)

- **Actual main protection state:** `main` `protected:false`; repository rulesets listing returned `[]`. The more detailed `/branches/main/protection` endpoint returned `403 Resource not accessible by integration` (not a license to assume hidden individual settings). No rules were created or changed.
- **Full active lineage rechecked:** [PR #1](https://github.com/titanfit102-bit/Protesto/pull/1) on `main`, followed by the continuous exact `base`/`head` sequence [#31](https://github.com/titanfit102-bit/Protesto/pull/31) through [#59](https://github.com/titanfit102-bit/Protesto/pull/59). **30 PRs** in this main lineage, all open Draft/unmerged, each `mergeable:true` relative to its current PR base. Relative mergeability is **not** a green-light for trunk or Production.
- **Historic alternatives inspected:** #3 closed/unmerged; #4–#7, #9, #11–#30 open Draft/unmerged, primarily based on the foundation branch. #2, #8 and #10 did not resolve as pull requests. Existing audit matrix maps #28–#30 functional overlap with cumulative #31; no independent merges, archive or bulk closure without file-by-file review/owner approval.
- **Reviews/checks:** no formal review submissions on PR #1, #31 or #59 (queried directly). Latest #59 tree has no `CODEOWNERS` and one Actions workflow `.github/workflows/verify.yml`; the workflow's `verify` job has passed at the tested #59 SHA. Historical exact-SHA CI success also observed for #1 and #31; review absence means integration governance is still incomplete.
- **Cumulative scale:** `main...PR59` reports **223 commits ahead, 0 behind, 124 files changed**, vs only two changed files within PR #59 relative to PR #58. The cumulative code change requires independent whole-candidate inspection and a deliberate ordered integration procedure.
- **Integration PLAN, NOT EXECUTED:** (a) arrange independent owner/admin governance and protect `main` with a PR requirement, required `verify` check sourced from GitHub Actions, independent approval(s), resolved conversations and restricted force-push/deletion; (b) verify that expected status checks actually execute on the intended protected target before making them mandatory; (c) inspect cumulative diff, each functional tranche and old overlaps, and review external P0 gates; (d) agree on a single bottom-up staged-PR or separately reviewed consolidated-candidate strategy; (e) recheck checks and reviewed tree at final integration SHA; (f) merge/deploy only with **separate explicit owner authorization**. No PR bases were retargeted, no code changed, and no protection was enabled in this audit.
- The companion short operational snapshot is `docs/STATUS.md` on `docs/protesto-continuity`. This change affects **audit findings only**, not the verified application SHA. The protection-policy design is a proposal, not a user-approved architectural decision.

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

### Retention/PostgreSQL operations source audit — 2026-10-23 (READ-ONLY)

**Scope:** examined `src/ops/retention.mjs`, `src/ops/staging-boundary.mjs`, `tools/privacy-retention.mjs`, `tools/staging-gate.mjs`, `tools/migrate.mjs`, `src/server/rate-limits.mjs`, `src/server/security.mjs`, schema for `sessions`/`request_rate_limits`, `test/operational-retention.test.mjs`, Actions workflow, `tools/backup.mjs`, `tools/restore.mjs` and `test/backup.integration.mjs`. Source was latest PR #59 exact SHA `b1c52f0e8074f8b73d0c8dd80f72d2953b4bdacc`, with previously verified success on [CI #39984965787](https://github.com/titanfit102-bit/Protesto/actions/runs/39984965787). Inspection only; **did not execute deletion/restoration or write application code**.

**Positive mechanisms already implemented / limited verification:**
- Default retention CLI calls `expiredOperationalCounts` and reports counts only; `--apply` requires a synthetic staging predicate and explicit `PROTESTO_RETENTION_APPROVED=1`.
- Destructive SQL explicitly targets expired rows (by `expires_at<=now()`) **only** in `sessions` and `request_rate_limits`, in a transaction, with row locks, `SKIP LOCKED` and 1–1000 row bound per table. There is no generic civic-content erase command here.
- Synthetic `test/operational-retention.test.mjs` checks rejected flag/environment paths, read-only counts, expired vs live records and preservation of a synthetic `civic_cases` record. `test/backup.integration.mjs` exercises separate encrypted backup/restore safety on disposable CI; this is not operational data lifecycle certification.

**New open security/design finding (P1 development, P0 before real-data operations):**
- `isolatedStagingBoundary(env)` trusts caller-supplied environment strings such as `GITHUB_ACTIONS`, staging flags and `DATABASE_URL` at `127.0.0.1:5432/protesto`, without independently verifying actual database server identity or network isolation. A tunnel or forward can present a non-disposable endpoint at that address. It rejects only `NODE_ENV === "production"`, not every other non-test environment.
- The exported function `purgeExpiredOperationalRows(pool,{env})` takes **a PostgreSQL connection pool separately from the environment being validated**, with no identity match proof between actual connected database and checked `env.DATABASE_URL`. No direct live exploit was executed or observed; the risk is demonstrated by function/API structure.
- A superuser `postgres` account is used for the CI fixture; the inspected source does not establish a separate least-privilege retention role or database-level isolation attestation for mutating runs. Do not claim production DB privileges have been audited or that these flags are strong production authorization.

**Proposed correction criteria (PLAN ONLY; separate code-change authorization required):**
1. A disposable synthetic database explicitly provisioned and isolated for the specific run with a distinct low-privilege retention principal authorized to delete only expired operational records; avoid blanket `postgres` privileges in mutation path.
2. A guard that checks the **actual PostgreSQL connection and authenticated server/database identity** in the same transaction before any DELETE, instead of accepting only caller-supplied env and host strings. Where strong service identity proof cannot be obtained, prohibit automatic destructive operations outside a demonstrably ephemeral isolated environment.
3. Explicit `NODE_ENV=test` and origin/CI guards as supplementary checks, never sole security boundary; ensure pool and configured target match, preferably by constructing the connection within the validated, isolated process.
4. New synthetic negative/positive tests: mismatched env vs pool, forwarded-loopback assumption, insufficient DB permissions, no writes to civic tables, lock contention, expired/live row separation, repeated safe execution and missing approvals. Do **not** deliberately connect these tests to real DBs or delete real data.
5. Design backup/restore identity and permission boundaries separately; require owner/legal review before any live retention or erasure schedule. `docs/DATA_RETENTION_AND_ERASURE_REGISTER.md` is an existing P0 policy draft, not an approved legal retention regime.

**Owner authorization state:** read-only audit and standing two-doc continuity updates allowed; **no authorization for new code changes, PR merges, deploy, live data deletion, new expenses or other repositories**. Current code SHA and previous CI verdict are unchanged; handoff checkpoint updated to preserve the finding. Continue technical planning without confusing proposals with implemented safeguards.

### Independent external GPT Work audit reconciliation — 2026-10-23 (READ-ONLY review)

**Provenance:** owner uploaded `PROTESTO_INDEPENDENT_DEEP_AUDIT_2026-10-23(1).md`, a separate report claiming local synthetic/Chromium probes. The report itself was **not** added to GitHub; future chats may lack the original attachment. Treat its claims as third-party hypotheses; the present reconciliation compared each finding with PR #59 source, schema, tests, GitHub metadata/CI and independently recalculated numerical contrasts and prefix lengths. **No new production, live data, PostgreSQL integration, Chromium E2E, DB restore or CI run was executed for this review.** Work's dynamic tests were not independently replayed.

**Exact code reference:** open Draft [PR #59](https://github.com/titanfit102-bit/Protesto/pull/59), HEAD `b1c52f0e8074f8b73d0c8dd80f72d2953b4bdacc`. Existing Actions [#39984965787](https://github.com/titanfit102-bit/Protesto/actions/runs/39984965787) is still `completed/success`; checkout was GitHub merge commit `c059e3a0b279ce72c9fafdf2458181eebf9e55b8`, whose Git **tree** equals PR #59 HEAD tree `cb942053a0b63ceb97f318d6d885ef924b5da68e` (independently verified from Git commit objects). This supports the same **content** in that CI, but not any future changing base/merge commit. All later code must be retested. `main` remains unmerged and release remains NO-GO.

#### Findings, confidence and strict acceptance targets

| ID / priority | Independent current-code verification | Minimum correction and proof required |
|---|---|---|
| **F01 / P1 / first** | **SOURCE-CONFIRMED privacy defect:** `src/pilot.mjs` logout/load displays newly authenticated UI before safe refresh; it neither resets private DOM/forms nor invalidates stale async writes; a failed `/api/public/ledger` prevents private refresh. Work reports Chromium A→B draft and persisted-case disclosure on a shared page; **not re-run in this review**. | Implement central private UI/form/module-state reset for logout, identity change, auth expiry/401; session generation/abort strategy to reject late A responses. Synthetic Chromium E2E A/logout/B with successful network, 503 on public feed, delayed A GET, 401 mid-refresh; no A marker in DOM or inputs regardless of network outcome. Do not alter server public allowlists for this fix. |
| **F02 / P1 / second** | **DETERMINISTIC mismatch:** `dossiers.mjs` accepts 1000-char reviewer note but writes `"Korrigjim i pranuar: "` (21 chars) + note into `retraction_history.note varchar(1000)`; `appeals.mjs` adds `"Apelimi i pranuar: "` (19 chars). 1000-char inputs reach 1021/1019; boundary for existing prefixed storage 979/981. DB error itself not reproduced here. | Preserve full validated reviewer reason and action provenance (prefer store note intact and express decision type in event metadata, rather than silent truncation). Synthetic PostgreSQL tests for 979/980/1000 and 981/982/1000, accepted/rejected, Albanian Unicode, rollback/audit/state invariants. No alteration of historical checksum migrations. |
| **F03 / P1 / policy-dependent** | **SOURCE-CONFIRMED lifecycle gap:** `dialogue.mjs` normal close requires published parent case; vote DELETE is after that guard. `test/dialogue-concurrency.integration.test.mjs` explicitly expects archived parent → 409 while topic remains `open`. Existing votes can persist; no claim of public leakage. | FIRST owner-approved privacy/lifecycle decision covering archived/cancelled open topics, vote disposition, audits, no public aggregate, backups/legal retention. THEN synthetic DB concurrency tests for direct archive, accepted correction, accepted appeal, late voting/close, and no re-publication. No live data deletion without separate approval. |
| **F04 / P1** | `tools/pilot-server.mjs` pool configured only with URL/max: no `pool.on('error')`, configured connect/query/lock timeouts or fully awaited graceful shutdown. Node `requestTimeout` is not a DB execution deadline. Work's delayed-DB HTTP demonstration not rerun. | Define safe connection, statement and lock timeout budgets per workload and cleanup; pool error listener, readiness on degradation, bounded shutdown/recovery. Child process/synthetic PostgreSQL fault/lock/saturation tests. Avoid uncancelled `Promise.race` timeouts. |
| **F05 / P1** | `app.mjs` skips `verifyPassword` for unknown accounts and `security.mjs` uses `scryptSync` on known accounts inside HTTP route. Timing oracle and event-loop blocking structurally real; Work's exact latency medians not independently reproduced. | Async scrypt for both known and unknown users using matching-parameter dummy password hash; preserve hash compatibility, rate limits, TOTP replay; test disabled users, invalid passwords/OTP, concurrency and event-loop progress. Do not use fragile millisecond CI thresholds. Inspect reverse proxy/IP assumptions before hosting. |
| **F06 / P1; P0 before live deletes** | **Previously known:** retention approval is environment-string/loopback based, pool passed separately, no authenticated DB identity attestation or least-privilege retention principal. Existing default CLI read-only and expired-row-only SQL safeguards remain useful. | Bind actual isolated connection identity and per-run disposable DB to mutation authorization; use limited privileges; negative mismatch/forwarded/permission tests. No real `--apply`, cron or erasure. |
| **F07 / P1 before integration** | **Previously known/GitHub-confirmed:** 55 open PRs; `main protected:false`, repo rulesets `[]`, no review submissions for sampled PR #1/#31/#59. Cumulative candidate is 223 commits/124 files beyond main. No `CODEOWNERS`; optional governance mechanism, not itself a breach. | Owner/admin-approved ruleset, valid required `verify` check and independent review tailored to available team; cumulative diff audit; explicit chosen stacked/consolidated integration path. No merge, retarget or ruleset mutation without authorization. |
| **F08 / P1** | `src/ops/release-gate.mjs` returns `releaseAllowed:false`, but `tools/pilot-server.mjs` does not call it and sets `production` according to `NODE_ENV`; `createPilotServer` only enforces HTTPS for that flag. Report is NOT a startup interlock; no evidence a deployment exists. | Define clearly fail-closed private-pilot startup behavior or separately governed release entrypoint; validate production-mode rejection with synthetic test, no new magic env flag construed as human approval. |
| **F09 / P1 before real recovery** | `test/backup.integration.mjs` compares row counts for **9** tables and a few selected fields; schema has **20** including `schema_migrations`. Does **not** prove data-loss incident. | Add representative synthetic fixtures and deterministic content/invariant comparison across required tables, especially appeals, retractions, sessions, audit/reviews, dialogue/votes/results, rate limits; FK/check checks, tamper/wrong-secret and empty target. Reconcile backup copies of votes under F03 policy. |
| **F10 / P2; release a11y gate** | CSS `.btn.primary` has white on `#ed4356`, 12px bold; independently recomputed WCAG ratio **3.791884:1**, under 4.5:1 normal-text AA. Accessibility smoke lacks contrast checks. | Target an accessible shade (e.g. test `#d6374b` → ~4.659:1 before choosing final design), preserve brand context; Chromium computed-style contrast test on normal/active states and manual keyboard/zoom/screen-reader review. |
| **F11 / P2 docs** | Canonical `MASTER_HANDOFF.md` included outdated “lockfile not found” text even as current PR #59 section correctly documented lockfile. Historical blueprint/CI/release docs also contain old “current/latest” references. | Under standing docs-only authorization, corrected canonical Master sentence to distinguish historical absence from **current** lockfile. Other docs cannot be edited without separate authorization; historical snapshots should be labelled, not silently rewritten. |
| **F12 / P2** | #59 npm dependency tree reproducible, but `ubuntu-latest`, Node `22`, `postgres:16`, preinstalled Chromium and Actions `@v4` are moving versions; `package.json engines >=22` is broad. | Inventory/test supported toolchain versions, capture full tool versions/artifacts and adopt controlled updates with pinning proportionate to maintenance and security updates, not indiscriminate permanent freezes. |

**Prioritization and release gates (PLAN only):**

1. **Fix F01 / isolate sensitive client state**; browser privacy E2E tests first. Verify no private A state appears for B on success, 503, expired session or delayed response.
2. **Fix F02 / retraction note correctness**; run exact PostgreSQL boundary tests and audit/state invariants.
3. **Resolve F03 owner/legal policy first**; then implement parent case → dialogue lifecycle with no public outcomes after archival and controlled pseudonymous-vote handling.
4. Harden login and DB operation (F05, F04), then release/retention boundaries (F08, F06), preserving all existing authorization controls.
5. Strengthen backup parity (F09) and safe PR review/integration/branch governance (F07), followed by contrast and toolchain maintenance (F10/F12).
6. Only after synthetic stability and external P0 human/privacy/operational gates, build minimal verified institutional reply → deadline → outcome flow; AI/maps/scale are later.

**Test rule after authorized implementation:** failing regression before fix → targeted test → complete Node/PostgreSQL suite with zero skipped DB-critical tests → Chromium scenarios → migrations and backup/drills if touched → exact final PR SHA AND merged-test tree verification → preserve CI logs. A run without `DATABASE_URL` may skip critical integration tests while reporting exit 0: do not treat it as full DB verification.

**Authority:** current permission is to READ/PLAN and maintain only `docs/STATUS.md` and `docs/MASTER_HANDOFF.md` on `docs/protesto-continuity`. The audit itself grants no authority to edit code, scripts, tests, schema, old docs, protection settings, PRs or infrastructure. No real citizen data processing or irreversible cleanup permitted. This audit's status is an evidence-based engineering assessment, **not** a new penetration, legal, production or privacy certification. Every issue remains OPEN until code+proof at new SHA exists.

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
**Next development task (READ-ONLY until specifically authorized):** first specify regression tests and narrowly scoped proposed corrections for **F01** (private browser state leaks between accounts) and **F02** (accepted correction/appeal retraction note overflow). **F03** (votes trapped by archived parent case) needs an explicit privacy/lifecycle policy decision before any code change or data deletion. Next address F04/F05 resilience and auth timing, F06/F08 operational boundaries, F09 recovery proof, F07 merge governance, then F10/F12 accessibility/toolchain. This order supersedes the earlier read-only branch/retention audit plan, which has already been completed. Only two continuity documents have standing write authorization; no new code branches, merges, deploy, real data or spending are implicitly approved.

### 2026-10-23 — F01 privacy correction verified in Draft PR #60

- **Authorized scope implemented:** [Draft PR #60](https://github.com/titanfit102-bit/Protesto/pull/60) on #59, branch `feat/protesto-client-session-isolation`, tested HEAD `69ecbf5fc3972758b595cb2cac416fce38c4a730`; exact GitHub Actions [#40009351146](https://github.com/titanfit102-bit/Protesto/actions/runs/40009351146) **completed/success** (64/64 Node tests, Chromium end-to-end, PostgreSQL checks, npm audit and synthetic encrypted backup/restore).
- **Files modified relative to #59:** `src/pilot.mjs`, `src/pilot-dialogue.mjs`, `test/browser.e2e.mjs`. Logout/login session transitions now reset private forms, queues, embedded editorial controls and dialogue state, hide private sections during authentication/refresh, and invalidate response reads from prior session generations.
- **Synthetic Chromium regression**: reporter A saves a case and leaves an unsent private draft, logs out, reviewer B signs in while `/api/public/ledger` is forced to return 503. Asserts A's private drafts and cards are gone and B's identity is displayed, then restores network and continues the existing editorial journey. Full Actions browser checks **passed**, without accessing real citizen data.
- **Evidence limit:** F01 is **implemented and verified for newly added test cases**; additional A delayed-response/401 and full module-specific private-form cases are not all independently stress-tested. Do not call Production-ready or fully certified. PR #60 remains Draft/open/unmerged. No changes to main or Production.
- **NEXT:** separately scoped F02 correction/appeal historical retraction note overflow with synthetic PostgreSQL boundary tests on top of #60, then update documentation with actual SHA/CI. F03 still requires explicit policy before destructive lifecycle changes.

### 2026-10-23 — F02 editorial note integrity correction verified in Draft PR #61

- **Current verified candidate:** [Draft PR #61](https://github.com/titanfit102-bit/Protesto/pull/61), `feat/protesto-retraction-note-boundaries` stacked on #60, HEAD `1bfe8db99cb37dc8ce48466864260895fc4c6115`, **open/Draft/unmerged**. Exact [Actions #40010017504](https://github.com/titanfit102-bit/Protesto/actions/runs/40010017504) completed **success**; fetched logs: **65/65 Node tests passed, 0 failed, 0 skipped**; actual PostgreSQL integration regression `PostgreSQL: full correction and appeal reasoning survives 1000-character boundaries` passed, as did existing Chromium E2E, dialogue E2E, migrations, npm audit and synthetic backup/restore.
- **Delta vs PR #60 (only three files):** `src/server/dossiers.mjs`, `src/server/appeals.mjs`, new `test/retraction-note-boundaries.integration.test.mjs`. The accepted-retraction audit inserts now store the **original full validated reviewer note** in `retraction_history.note varchar(1000)` instead of adding a 21/19-character prefix. Decision type is already in `audit_entries.action` (`correction.accepted` / `appeal.accepted`) and review-state columns. Existing migration files were not changed.
- **New synthetic PostgreSQL acceptance test:** correction accepted notes of 979, 980, 1000 characters; appeal accepted notes of 981, 982, 1000; rejected decisions at 1000; invalid overlong 1001 inputs return 422 without case/archive/audit mutation; Albanian Unicode `ë` must survive exact; accepted case becomes archived and exact note and audit recorded, rejected case remains published with no retraction history.
- **Evidence limit:** the test proves those synthetic DB/API paths; no independent full production governance/privacy certification. F02 considered **implemented / VERIFIED for scoped cases**, not a real-world release authorization. PR #60 remains unmerged; cumulative candidate #61 contains both F01 and F02.
- **NEXT decision (NOT IMPLEMENTED):** F03 on open dialogue topics with an archived parent: current close path rejects and cannot delete previously recorded pseudonymous votes. Requires a **new owner-approved privacy/lifecycle policy**, considering cancellation vs closure, associated audit, no public results after archive, backup/legal holds and transactional locking before any code edit. Never run live deletion.
- **Other open work:** F04/F05 DB fault tolerance and login timing; F06 retention identity; F07 branch protection/integration; F08 startup interlock; F09 recovery parity; F10 accessibility; F12 toolchain. Existing independent-review and release P0 gates remain NO-GO.

### F03 lifecycle policy design checkpoint — 2026-10-23 (READ-ONLY, NOT AUTHORIZED)

Confirmed at current PR #61 source SHA `1bfe8db99cb37dc8ce48466864260895fc4c6115`:
- `db/007_civic_dialogue.sql` restricts `dialogue_topics.state` to `open`/`closed`, with no explicit `cancelled` state.
- The normal topic close operation requires `civic_cases.state='published'`, produces `dialogue_results` aggregates when eligible and deletes `dialogue_votes` only in that successful transaction. This does not run after case archival.
- **Three separate editorial archival paths** can archive a case: direct reviewer `/api/archive/:id` in `src/server/app.mjs`; accepted correction in `src/server/dossiers.mjs`; accepted appeal in `src/server/appeals.mjs`. Each needs coverage. The public reading paths already suppress withdrawn-parent content but hidden votes may persist in PostgreSQL/backups.

**Proposed policy for owner/privacy review only (not a settled decision):** distinguish cancelled-by-case-withdrawal from normally closed topics. When a published case is archived, cancel all still-open child topics within the **same database transaction** and record a precise audit event, never create new aggregate results for cancelled topics and never publish withdrawn material. If and only if an independently approved retention/erasure policy authorizes it, delete pseudonymous individual votes for cancelled topics transactionally; address restoration/backup lifecycle/legal holds explicitly. Already closed topics and any historical aggregates require a separate specified handling rule (at minimum public suppression on parent archive, already implemented). A new `cancelled` state would require an additive v017 migration and downstream query/UI/test changes; do not mutate migration 007 historical checksum. An alternative approach reusing `closed` hides cancellation semantics and is not preferred without a detailed rationale.

**Potential acceptance matrix after owner policy + code authorization:** all three archive pathways, case/topic/vote race order `civic_cases` then `dialogue_topics` to match normal voting/closing locks, idempotent repeated archive, absence of post-archive public report/aggregates, complete appropriate audit events, synthetic votes retained/erased strictly per approved policy, backup/restore implications. Run PostgreSQL concurrency/integration and Chromium smoke, exact new PR SHA and no critical skips. No real data deletion/deploy is allowed without further explicit permission.

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
