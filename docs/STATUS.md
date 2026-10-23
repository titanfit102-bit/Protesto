# PROTESTO — CURRENT_STATE (canonical recovery checkpoint)

**Verified/reconciled:** 2026-10-24 | **Release gate: NO-GO for Production or real sensitive civic data**  
**Documentation branch:** [`docs/protesto-continuity`](https://github.com/titanfit102-bit/Protesto/tree/docs/protesto-continuity)  
**Full history and detailed F01–F12 audit:** [`docs/MASTER_HANDOFF.md`](./MASTER_HANDOFF.md)  
**Repository:** https://github.com/titanfit102-bit/Protesto

> **NEW CHAT:** Read this file from the **HEAD of `docs/protesto-continuity`**, then MASTER_HANDOFF; recheck GitHub PRs, branch HEADs, exact CI and `main` before proceeding. This docs branch was originally based on PR #58 and is **not** the latest code branch. No progress or "PASS" claim may be transferred to newer untested code.

## Latest VERIFIED application checkpoint

| Subject | Grounded fact |
|---|---|
| Latest candidate | [Draft PR #65](https://github.com/titanfit102-bit/Protesto/pull/65), open/unmerged; based on PR #64 |
| Code branch | `feat/protesto-retention-isolation-ci` |
| **Code HEAD SHA** | `2b6ae0d251e48326a515ff7cf0ff8f60409ebfa1` |
| Automated run | [Actions #40032488977](https://github.com/titanfit102-bit/Protesto/actions/runs/40032488977) **completed/success**: **72/72 PASS, 0 FAIL, 0 SKIP** Node/PostgreSQL; disposable F06 database + role/attestation tests, Chromium, migrations, fail-closed release gate, npm audit and encrypted synthetic backup/restore PASS |
| CI checkout proof | PR #65 HEAD and Actions PR merge commit `3efe50bedf3155f249ca70fb3012fb56be046ab1` have the same Git tree `015c7f4d45256939d455a2284acea24c2f772510` (independently fetched); synthetic CI scope only |
| Dependencies | `package-lock.json` **present**, frozen installs use `npm ci` in #59; full runtime/toolchain pinning still partial |
| `main` | `1e34611bdb48195e7deadb8e33d26ddac3338c4d`, original README, `protected:false` and repository rulesets `[]`; no merge |
| Topology | #1 foundation + #31–#65 stacked Draft PR lineage; PR #65 changes exactly **2 files** vs #64 (`src/ops/retention.mjs`, `test/operational-retention.test.mjs`). No PR merged |
| Deployment | PUBLIC source repo, **no approved Production service** or real-data pilot |

The last independent GPT Work report uploaded in conversation is **external material, not a committed project document**; its verifiable engineering findings and provenance are summarized in MASTER_HANDOFF. Dynamic Work probes were **not independently rerun** in this review.

## Current engineering priorities — implemented vs open

1. **F01 / P1 privacy (IMPLEMENTED, TESTED scope):** [Draft PR #60](https://github.com/titanfit102-bit/Protesto/pull/60) clears private DOM/forms/dialogue module state on logout/session refresh and ignores stale requests. E2E A→logout→B with public ledger 503 **PASS** at `69ecbf5fc3972758b595cb2cac416fce38c4a730`. Residual delayed-response, 401 and broader cross-module scenarios warrant later expansion before real-data pilot; no Production approval.
2. **F02 / P1 correctness (IMPLEMENTED AND VERIFIED synthetic):** [Draft PR #61](https://github.com/titanfit102-bit/Protesto/pull/61) stores exact accepted correction/appeal reasoning (no prefix/truncation) and records decision provenance in existing audit entries. New PostgreSQL boundary tests for 979/980/1000, 981/982/1000, rejected and 1001 invalid, Unicode, case state and audit/rollback checks **PASS**, exact SHA/CI above.
3. **F03 / P1 lifecycle (SCOPED SYNTHETIC FIX IMPLEMENTED / VERIFIED):** owner responded `vazhdo` to the precise synthetic-only F03 policy/implementation proposal. [Draft PR #62](https://github.com/titanfit102-bit/Protesto/pull/62) adds migration 017 `cancelled` with timestamp/actor, atomically cancels still-open child topics and deletes their pseudonymous votes in all 3 archived-case paths; emits audit events, no new aggregates, preserves older closed-topic aggregates internally, suppresses public reads after parent withdrawal. Synthetic DB tests for all 3 archive paths, approved/pending topics, 404/late vote 409, audit and closed result retention **PASS** (CI #40014007571). **No real data erasure, approval of general retention policy or deployment**. Further live backup lifecycle, stronger contention stress and privacy/legal sign-off remain OPEN.
4. **F05 / P1 (SCOPED FIX IMPLEMENTED / CI VERIFIED):** [Draft PR #63](https://github.com/titanfit102-bit/Protesto/pull/63) uses compatible async `crypto.scrypt`, dummy KDF for absent/inactive/malformed hash, and max 4 simultaneous KDF calls/server; performs unblocked account snapshot then rechecks identical active ID/hash under `FOR UPDATE` before MFA counter/session creation. Synthetic PostgreSQL test **PASS** for disabled/rotated account after initial read, two parallel identical TOTP attempts (exactly one success), replay denial, generic 401, cookie; unit async/password compatibility PASS. Remaining for F05: load/saturation/adversarial timing review. **F04 / P1 (SCOPED FIX IMPLEMENTED / CI VERIFIED):** [Draft PR #64](https://github.com/titanfit102-bit/Protesto/pull/64) adds private-pilot bounded PostgreSQL connection/statement/lock/query/idle-transaction deadlines, handles idle-client errors without raw secret logging, and gracefully closes HTTP before DB pool, with a 20s HTTP grace period. Existing `/api/ready` retained. F04 synthetic test suite includes forced PostgreSQL statement timeout, advisory-lock timeout, terminated idle client recovery, readiness and SIGTERM **PASS**. Remaining: broader production-like outage, pool exhaustion/restart/recovery and workload-specific budget review.
5. **F06 / P0 ambient-DB deletion route (SCOPED SYNTHETIC FIX IMPLEMENTED/CI VERIFIED; LIVE RETENTION NO-GO):** [Draft PR #65](https://github.com/titanfit102-bit/Protesto/pull/65) removes the earlier dangerous ambient-`DATABASE_URL` test. Synthetic CI creates a new random DB per run and separate non-superuser PostgreSQL role with **NO direct DELETE** on sessions, rate limits or civic tables. `purgeExpiredOperationalRows()` checks actual connected database/role and one-time SHA-256 run attestation **within its transaction**, then invokes a narrowly bounded SECURITY DEFINER expiry routine. Negative tests: wrong pool, forged env/token, invalid batch, direct DELETE refusal, idempotence and active/civic preservation. **72/72 PASS** in Actions #40032488977. The original broad-root `--apply` is now refused; CLI default remains read-only. This is NOT a hosted isolation guarantee, Production cleanup authorization, backup retention policy or proof against malicious network tunneling. **Never run against real/shared data. F08 OPEN**.
6. **F09/F07:** broader encrypted restore parity and human review/protection/integration of cumulative 124-file diff.
7. **F10/F12:** login button contrast **3.791884:1** vs required **4.5:1** for 12px text; toolchain reproducibility and update policy.
8. **F11:** canonical MASTER_HANDOFF stale lockfile statement corrected on the documentation branch; older external/other docs retain dated historical snapshots pending separate approval.

**Evidence status:** F01/F02/F03 have scoped implemented fixes and exact-CI synthetic proof, but all three remain unmerged and are **not Production certified**. F04–F10/F12 remain open or partial (F11 canonical handoff chronology was corrected). External audit dynamic measurements were not all independently replayed. No real Production exposure, data loss, erasure or deployment was proven.

## Authorizations / completion boundary

- **Standing permission:** maintain only `docs/STATUS.md` and `docs/MASTER_HANDOFF.md`, only in branch `docs/protesto-continuity`, after material verified change. Read back and record actual docs SHA.
- **Standing permission** remains two continuity docs only. Owner additionally authorized scoped F01–F05 Draft PR work and **F06 synthetic-only retention safety** by replying `vazhdojm` directly to the explicit package request. No blanket authorization for F07–F12, merge, live data, deployment, branch rules or spending.
- No OpenCode, no other projects, no real civic/political user data, no secrets in the public repo, no unapproved expenses or deployments.
- Keep four separate assessments: implementation PARTIAL, synthetic verification PARTIAL vs Production, release readiness **BLOCKED**, operational/professional maturity PARTIAL. Do not fabricate percent completion.

## Exact resume action

Verify PR #65 exact SHA, CI #40032488977, current GitHub lineage and this docs branch. **F01–F06 have narrowly scoped synthetic fixes in open Draft PRs #60–#65; NONE merged.** F06 accidental-deletion path is addressed in a dedicated ephemeral CI database/role, but **no live retention or real-data processing is approved**. **NEXT (READ-ONLY):** inspect F08 lack of a fail-closed Production startup interlock and draft exact security/operational acceptance criteria. F08 application changes require separate owner authorization. F07 branch protections/PR reviews, F09 full data parity, F10 accessibility contrast, F12 toolchain and all external privacy/legal/Production gates remain open. No further unrelated code edits, merge, deploy, real data or cost.


## Historical preservation

Prior `STATUS.md` versions and audit checkpoints remain available through Git commit history; see the [pre-continuity historical status](https://github.com/titanfit102-bit/Protesto/blob/4aec08ac16207af4c36ee0e1f0f84e5f2c0c67d5/docs/STATUS.md) and [pre-independent-audit snapshot](https://github.com/titanfit102-bit/Protesto/blob/216466d0c343661a54d192772c852ae86230df1a/docs/STATUS.md). Detailed chronology, architecture, reviews, PR dependencies, risk register and acceptance criteria are maintained in MASTER_HANDOFF and existing specialized docs; no history was intentionally deleted.

