# PROTESTO — CURRENT_STATE / VERIFIED CHECKPOINT

**Checkpoint date:** 2026-10-23  
**Canonical continuity branch:** [`docs/protesto-continuity`](https://github.com/titanfit102-bit/Protesto/tree/docs/protesto-continuity)  
**Full project handoff:** [`docs/MASTER_HANDOFF.md`](./MASTER_HANDOFF.md)  
**Repository:** https://github.com/titanfit102-bit/Protesto  
**Record type:** short recovery snapshot. **Do not mistake this documentation branch for the live application release or tested source SHA.**

## Current verified source-of-truth

| Item | Latest verified state |
|---|---|
| Development candidate | [Draft PR #59](https://github.com/titanfit102-bit/Protesto/pull/59), **open / unmerged**, based on PR #58 |
| Application code branch | `feat/protesto-reproducible-deps` |
| **Verified code SHA** | `b1c52f0e8074f8b73d0c8dd80f72d2953b4bdacc` |
| CI | [Run #39984965787](https://github.com/titanfit102-bit/Protesto/actions/runs/39984965787): **completed / success** at exact code SHA |
| Node test result | **64 passed / 0 failed** (fetched job logs for that CI run) |
| Other successful CI stages | **npm ci** from committed lockfile; dependency audit (0 reported vulnerabilities at run time); migrations/replay; JavaScript checks; Chromium E2E/accessibility smoke; offline preview; synthetic encrypted PostgreSQL restore |
| Default branch | `main` at `1e34611bdb48195e7deadb8e33d26ddac3338c4d`, initial README only; **unchanged/unprotected** at the checkpoint |
| GitHub code visibility | **PUBLIC repository**, but **NO public application deployment** |
| Release gate | **NO-GO / P0 BLOCKED** for Production and collection of real sensitive civic/political data |

**Continuity change:** `docs/protesto-continuity` was originally branched from tested PR #58 code SHA `4aec08ac16207af4c36ee0e1f0f84e5f2c0c67d5`, while PR #59 now represents the latest independently tested code. Subsequent docs-only commits on this branch are **not newly tested application code**. To know the latest documentation commit, inspect the live HEAD of this branch in GitHub.

## Work completed (VERIFIED for documented synthetic scope)

- Browser-only fictional Albanian demo and a separate Node.js/PostgreSQL 16 private pilot, with 16 DB migrations.
- Authenticated case submission, role-separated manual source review, approved redacted publication/retraction and audit.
- Initiatives and peaceful gatherings, corrections, independent appeals, moderated citizen responses and public ledger.
- Original civic dialogue with approved topic/statement copies and private-threshold final aggregates; no population-representative polling.
- Session/CSRF controls, shared HMAC-keyed throttling, optional reviewer TOTP, bounded own-data export.
- Synthetic encrypted backup/restore and fail-closed release checks.
- **PR #58**: UTF-8 chunk-safe JSON decoder, normalized public host filter, branch-glob CI coverage and regression tests; checked via exact-SHA CI #39980887111.
- **PR #59**: npm-generated lockfile (40 packages) + CI `npm ci`; only two changed files vs #58, exact-SHA run #39984965787 **success**, 64/64 Node tests, migrations/Chromium/backup drill and npm audit success. The bootstrap generation step was removed from the final workflow.

## Important open risks

**P0 Production blockers:** specialist security/privacy/legal review (DPIA where applicable); formal evidence custody/redaction and neutral editorial right-of-reply; institutional identity verification; mandatory appropriate MFA/recovery; hosted isolated staging; offsite backups/monitoring/incident drills; manual accessibility evaluation; owner approval for release. No Production authorization exists.

**Next technical gaps (P1):** unprotected `main`; remaining toolchain reproducibility (runner Node.js minor, PostgreSQL image tag, Chromium availability, GitHub Action tags); large stacked Draft PR chain / explicit safe integration plan; deeper validation of retention process isolation and adversarial API/race/privacy coverage. New institutional-response tracking, official provenance integrations, AI evidence assistance and public map remain planned, not implemented.

## Exact next action

1. **READ-ONLY / scope proposal:** prioritize **F01 browser cross-account private state** and **F02 retraction note overflow** from the independently reviewed audit; write test-first regression/acceptance criteria and obtain separate owner authorization before editing application code.
2. **Policy decision before implementation:** F03 archived parent/open dialogue vote lifecycle (private cancellation vs closure, disposition of pseudonymous votes, backup retention). Do **not** delete real records or silently create a real-data retention policy.
3. After F01/F02 scope approval, implement via isolated Draft PR(s), synthetic Chromium and PostgreSQL tests, verify exact CI/tree, and update the two continuity documents. Then tackle F04/F05 operational resilience/login timing, F06/F08 isolation/release boundary, F09 recovery verification, F07 review/integration governance, and F10/F12 quality gates.
4. Recheck all PR HEADs, `main`, CI and docs branch before any work. Changes to application files, branch protections, PR bases, merges, deploy, real data or spending still require separate authorization. Standing authorization covers **only these two continuity docs**.

## Integration safety audit — verified 2026-10-23 (READ-ONLY)

- **GitHub baseline unchanged:** `main` at `1e34611bdb48195e7deadb8e33d26ddac3338c4d`, `protected:false`; repository Rulesets API returned `[]`. Detailed `/branches/main/protection` query returned **403 Resource not accessible by integration**, so deeper settings are not independently readable. **No protections were changed.**
- **PR topology:** individually checked Draft/unmerged PR #1 (base `main`), then PR **#31 through #59** as a continuous sequence of matching `base`/`head` branches; each was GitHub-reported `mergeable:true` relative to its own base. **Do not infer review readiness or authorization to merge into `main`.**
- **Alternative historical PRs:** #3 was closed without merge; #4–#7, #9, #11–#30 are open Drafts based on foundation. PR identifiers #2, #8, #10 were not pull requests in lookup. Historical #28–#30 overlap functionality in integrated #31 lineage per existing integration audit matrix. Do not bulk-merge older drafts.
- **Human review / ownership:** PR #1, #31 and #59 each have **0 recorded formal review submissions**; no tracked `CODEOWNERS` file found in latest PR #59 tree. A successful CI run does not substitute for independent review.
- **Cumulative candidate:** PR #59 at exact code SHA above is **223 commits ahead / 0 behind `main`**, with **124 changed files**; changes include the complete stacked pilot and are much broader than PR #59's own two-file delta against PR #58.
- **PLANNED, NOT APPROVED OR EXECUTED:** owner/admin-approved `main` protection/ruleset (PR required, independent reviews, required **verify** CI check, no forced updates/deletion and resolved conversations), independent audit of cumulative diff and per-PR dependencies, review of overlapping drafts, explicit integration strategy, and re-run tests on exact candidate/merge commit. No merge, rebase, retarget, deployment or ruleset modification is authorized by this review.
- **Immediate next:** continue read-only investigation of branch protection/review prerequisites and synthetic retention isolation; propose an integration plan for owner approval only when supported by verified evidence.

## Retention / PostgreSQL operations audit — 2026-10-23 (VERIFIED code review, READ-ONLY)

**Source checkpoint:** Draft PR #59, `b1c52f0e8074f8b73d0c8dd80f72d2953b4bdacc`; CI run [#39984965787](https://github.com/titanfit102-bit/Protesto/actions/runs/39984965787) still completed/success. **No deletion, restore, schema change, code edit, deployment or credential use was performed in this audit.**

- **Verified positive safeguards:** `tools/privacy-retention.mjs` is read-only without `--apply`; `src/ops/retention.mjs` permits mutation only with explicit `PROTESTO_RETENTION_APPROVED=1` plus `isolatedStagingBoundary`, and deletes **only expired `sessions` and `request_rate_limits`**, transactionally, with `FOR UPDATE SKIP LOCKED`, batch limit 1–1000 per table. The checked synthetic integration test asserts that active rows and a civic case survive and that unapproved mutations are refused.
- **P1 confirmed design limitation / P0 live-ops blocker:** `src/ops/staging-boundary.mjs` treats environment flags, a loopback URL and database name as isolation evidence; this **does not authenticate the underlying PostgreSQL server** (e.g. forwarded/tunneled service on the same loopback endpoint). The guard rejects `NODE_ENV=production` but does not require `NODE_ENV=test`. The exported `purgeExpiredOperationalRows(pool,{env})` accepts an already-created pool independently from the `env` whose `DATABASE_URL` is checked, without attesting that both reference the same isolated test DB. This is source-proven architectural risk, **not a demonstrated live exploit or deletion**.
- **Permissions not verified:** the isolated Actions service uses synthetic `postgres` credentials; no evidence was found here of a dedicated least-privilege expiry-only PostgreSQL role or independent disposable-database attestation in the mutation path. Production DB access and role grants remain UNKNOWN.
- **Proposed next engineering tranche, NOT AUTHORIZED/IMPLEMENTED:** enforce a dedicated ephemeral synthetic PostgreSQL identity/role with grants only for `sessions` and `request_rate_limits`; bind guarded mutation to the **actual** connected pool/database, not merely caller-provided environment; require the exact test-run environment and validate strong isolation/identity; add negative tests for mismatched pool-vs-env and a loopback tunnel, plus no mutation of civic rows. Review backup/restore target isolation separately. Do not enable live expiry jobs.
- No general GDPR deletion or retention schedule exists; [`DATA_RETENTION_AND_ERASURE_REGISTER.md`](./DATA_RETENTION_AND_ERASURE_REGISTER.md) remains a non-approved P0 draft. The CI pass proves tested synthetic paths, not an independent environment-security assessment.

**Next action:** prepare a narrowly scoped implementation design for the above retention identity/isolation safeguards and role/negative test matrix, then request **separate** code-edit authorization; continue read-only assessment where useful. The integration governance findings documented earlier remain open.

## Independent GPT Work report reconciliation — 2026-10-23 (VERIFIED static, no code changes)

**External source:** owner-provided `PROTESTO_INDEPENDENT_DEEP_AUDIT_2026-10-23(1).md`; observations are **untrusted until compared** to current code. Verified again against PR #59 HEAD `b1c52f0e8074f8b73d0c8dd80f72d2953b4bdacc` and unchanged CI [#39984965787](https://github.com/titanfit102-bit/Protesto/actions/runs/39984965787); checkout merge commit `c059e3a0b279ce72c9fafdf2458181eebf9e55b8` and PR head share Git tree `cb942053a0b63ceb97f318d6d885ef924b5da68e`. **No new CI, Chromium E2E or PostgreSQL integration was executed by this review.**

| Finding | Verification and severity for intended real-data pilot |
|---|---|
| F01 / P1 | **Confirmed source bug**: `src/pilot.mjs` fails to clear private forms/DOM and identity-stale async state on logout/switch; public-feed errors interrupt refresh. Work's Chromium reproduction not independently repeated. **First fix.** |
| F02 / P1 | **Deterministic contract mismatch**: accepted correction/appeal prefixes (21/19 chars) plus accepted 1000-char note overflow `retraction_history.note varchar(1000)`; actual DB failure not independently rerun. **Second fix.** |
| F03 / P1 | **Confirmed lifecycle gap**: archived case prevents topic close and its vote purge; existing regression deliberately expects 409/open topic. Requires owner-approved privacy/lifecycle decision before code change. |
| F04 / P1 | No pg pool idle error listener, configured DB connection/query/lock deadlines or robust shutdown in `tools/pilot-server.mjs`; Work's synthetic delay not independently rerun. |
| F05 / P1 | Login performs synchronous `scryptSync` only for existing accounts; timing/event-loop risk proven from source; Work's measured 50ms/4ms not independently repeated. |
| F06 / P1 (P0 live destructive ops) | Previously known: retention flags/loopback are not DB identity attestation, and injected pool can differ from validated env; no real deletion tested. |
| F07 / P1 pre-integration | Previously known: `main protected:false`, empty rulesets, 55 open PRs; review requirements not established. |
| F08 / P1 | Reporting `releaseAllowed:false` is not wired to production startup; not proof of a real deployment. |
| F09 / P1 before real recovery | Restore test compares counts for 9 of 20 tables plus selected fields, not full data parity; no evidence of actual data loss. |
| F10 / P2 (release accessibility blocker) | Independently computed CSS white vs `#ed4356` = **3.791884:1**, fails 4.5:1 for 12px bold; existing accessibility smoke has no contrast metric. |
| F11 / P2 | Existing documents have historical-vs-current drift; canonical MASTER_HANDOFF lockfile claim corrected under authorized docs-only scope; other docs remain historical until independently authorized. |
| F12 / P2 | npm graph frozen in #59, but Ubuntu/Node major/Postgres major/Chromium/Actions tags remain floating; not a failure of #59 CI. |

**Decision:** Work's 12 issues are supported as code observations, measured discrepancy or evidence gaps; its dynamic Chromium/DB-spy experiments have **not been independently repeated** in this review. None is proof of real-world breach, backup corruption or Production deployment. Release remains **NO-GO**; favor test-first F01/F02 over adding new features. No new repository application branch, code edit, merge or deploy authorized.

## Preservation of historical status

The previous `docs/STATUS.md` contained valuable 2026-10-21/22 development history but had an obsolete opening claim that PR #1 was current. Its **full original text** remains retrievable at the immutable, exact [pre-continuity snapshot](https://github.com/titanfit102-bit/Protesto/blob/4aec08ac16207af4c36ee0e1f0f84e5f2c0c67d5/docs/STATUS.md); history is not deleted from Git. ADRs, release matrices and CI history remain in existing dedicated docs, linked from [MASTER_HANDOFF](./MASTER_HANDOFF.md).

## Continuity rules (DECIDED)

The owner authorized ongoing edits **only** to `docs/STATUS.md` and `docs/MASTER_HANDOFF.md` **only** on `docs/protesto-continuity`, after material verified changes. No authorization for code changes, other documents, branch merges, deploy, public data, spending or other projects. Do not fabricate inaccessible chat history, completed tests or percentages. If a write fails, state **HANDOFF NOT SAVED** and the exact resume steps. On restarting in a new chat: read this branch's STATUS first, then MASTER_HANDOFF, then reverify current GitHub and continue development at the exact next authorized step.
