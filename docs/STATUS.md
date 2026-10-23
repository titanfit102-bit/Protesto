# PROTESTO — CURRENT_STATE (canonical recovery checkpoint)

**Verified/reconciled:** 2026-10-23 | **Release gate: NO-GO for Production or real sensitive civic data**  
**Documentation branch:** [`docs/protesto-continuity`](https://github.com/titanfit102-bit/Protesto/tree/docs/protesto-continuity)  
**Full history and detailed F01–F12 audit:** [`docs/MASTER_HANDOFF.md`](./MASTER_HANDOFF.md)  
**Repository:** https://github.com/titanfit102-bit/Protesto

> **NEW CHAT:** Read this file from the **HEAD of `docs/protesto-continuity`**, then MASTER_HANDOFF; recheck GitHub PRs, branch HEADs, exact CI and `main` before proceeding. This docs branch was originally based on PR #58 and is **not** the latest code branch. No progress or "PASS" claim may be transferred to newer untested code.

## Latest VERIFIED application checkpoint

| Subject | Grounded fact |
|---|---|
| Latest candidate | [Draft PR #64](https://github.com/titanfit102-bit/Protesto/pull/64), open/unmerged; based on PR #63 |
| Code branch | `feat/protesto-pg-pool-resilience` |
| **Code HEAD SHA** | `844f74daf2f548ae73edb16bba9675a2e5462adc` |
| Automated run | [Actions #40027445853](https://github.com/titanfit102-bit/Protesto/actions/runs/40027445853) **completed/success**: **72/72 PASS, 0 FAIL, 0 SKIP** Node/PostgreSQL; 4 new F04 pool/query/lock/idle-disconnect/SIGTERM tests, Chromium pilot+dialogue, 17 migrations, fail-closed release gate, npm audit and encrypted synthetic backup/restore PASS |
| CI checkout proof | PR #64 head SHA and Actions pull-request merge commit `23a74aceb33b1b8ac3cb8d95dfcde15866baca83` have identical Git tree `1e1f2d45bf92b6f7225661463bc9f51e5bc07dc9` (verified from commit objects); synthetic CI only |
| Dependencies | `package-lock.json` **present**, frozen installs use `npm ci` in #59; full runtime/toolchain pinning still partial |
| `main` | `1e34611bdb48195e7deadb8e33d26ddac3338c4d`, original README, `protected:false` and repository rulesets `[]`; no merge |
| Topology | #1 foundation + #31–#64 stacked Draft PR lineage; PR #64 differs from #63 by exactly **3 files** (private runtime pool helper, pilot server, regression test). Historical PR #59 223 commits/124 files comparison is not a current count. None merged |
| Deployment | PUBLIC source repo, **no approved Production service** or real-data pilot |

The last independent GPT Work report uploaded in conversation is **external material, not a committed project document**; its verifiable engineering findings and provenance are summarized in MASTER_HANDOFF. Dynamic Work probes were **not independently rerun** in this review.

## Current engineering priorities — implemented vs open

1. **F01 / P1 privacy (IMPLEMENTED, TESTED scope):** [Draft PR #60](https://github.com/titanfit102-bit/Protesto/pull/60) clears private DOM/forms/dialogue module state on logout/session refresh and ignores stale requests. E2E A→logout→B with public ledger 503 **PASS** at `69ecbf5fc3972758b595cb2cac416fce38c4a730`. Residual delayed-response, 401 and broader cross-module scenarios warrant later expansion before real-data pilot; no Production approval.
2. **F02 / P1 correctness (IMPLEMENTED AND VERIFIED synthetic):** [Draft PR #61](https://github.com/titanfit102-bit/Protesto/pull/61) stores exact accepted correction/appeal reasoning (no prefix/truncation) and records decision provenance in existing audit entries. New PostgreSQL boundary tests for 979/980/1000, 981/982/1000, rejected and 1001 invalid, Unicode, case state and audit/rollback checks **PASS**, exact SHA/CI above.
3. **F03 / P1 lifecycle (SCOPED SYNTHETIC FIX IMPLEMENTED / VERIFIED):** owner responded `vazhdo` to the precise synthetic-only F03 policy/implementation proposal. [Draft PR #62](https://github.com/titanfit102-bit/Protesto/pull/62) adds migration 017 `cancelled` with timestamp/actor, atomically cancels still-open child topics and deletes their pseudonymous votes in all 3 archived-case paths; emits audit events, no new aggregates, preserves older closed-topic aggregates internally, suppresses public reads after parent withdrawal. Synthetic DB tests for all 3 archive paths, approved/pending topics, 404/late vote 409, audit and closed result retention **PASS** (CI #40014007571). **No real data erasure, approval of general retention policy or deployment**. Further live backup lifecycle, stronger contention stress and privacy/legal sign-off remain OPEN.
4. **F05 / P1 (SCOPED FIX IMPLEMENTED / CI VERIFIED):** [Draft PR #63](https://github.com/titanfit102-bit/Protesto/pull/63) uses compatible async `crypto.scrypt`, dummy KDF for absent/inactive/malformed hash, and max 4 simultaneous KDF calls/server; performs unblocked account snapshot then rechecks identical active ID/hash under `FOR UPDATE` before MFA counter/session creation. Synthetic PostgreSQL test **PASS** for disabled/rotated account after initial read, two parallel identical TOTP attempts (exactly one success), replay denial, generic 401, cookie; unit async/password compatibility PASS. Remaining for F05: load/saturation/adversarial timing review. **F04 / P1 (SCOPED FIX IMPLEMENTED / CI VERIFIED):** [Draft PR #64](https://github.com/titanfit102-bit/Protesto/pull/64) adds private-pilot bounded PostgreSQL connection/statement/lock/query/idle-transaction deadlines, handles idle-client errors without raw secret logging, and gracefully closes HTTP before DB pool, with a 20s HTTP grace period. Existing `/api/ready` retained. F04 synthetic test suite includes forced PostgreSQL statement timeout, advisory-lock timeout, terminated idle client recovery, readiness and SIGTERM **PASS**. Remaining: broader production-like outage, pool exhaustion/restart/recovery and workload-specific budget review.
5. **F06 / P0 accidental-data-deletion risk / P1 synthetic architecture (READ-ONLY AUDIT COMPLETE, NOT FIXED):** `test/operational-retention.test.mjs` runs whenever `DATABASE_URL` is present, creates its `pg.Pool` from that ambient URL but passes a fabricated approved `env()` containing CI/loopback flags into `purgeExpiredOperationalRows`; **the actual connected pool is never attested**, and SQL deletes expired rows globally up to 250 per category, not only the fixture rows. This may remove other users' expired technical records if a test is run against a shared/real DB. **NEVER run `npm test`/`npm run verify` with a non-disposable `DATABASE_URL`** until hardened. No evidence of actual deletion; CI uses synthetic PostgreSQL. No distinct least-privilege retention role/grants in 17 migrations, CI connects as `postgres`; URL/flags/loopback alone do not prove a disposable DB. Default CLI stays read-only, expiry SQL remains table-limited, batch-bounded and transactional. **F08 OPEN:** release report is not a startup interlock.
6. **F09/F07:** broader encrypted restore parity and human review/protection/integration of cumulative 124-file diff.
7. **F10/F12:** login button contrast **3.791884:1** vs required **4.5:1** for 12px text; toolchain reproducibility and update policy.
8. **F11:** canonical MASTER_HANDOFF stale lockfile statement corrected on the documentation branch; older external/other docs retain dated historical snapshots pending separate approval.

**Evidence status:** F01/F02/F03 have scoped implemented fixes and exact-CI synthetic proof, but all three remain unmerged and are **not Production certified**. F04–F10/F12 remain open or partial (F11 canonical handoff chronology was corrected). External audit dynamic measurements were not all independently replayed. No real Production exposure, data loss, erasure or deployment was proven.

## Authorizations / completion boundary

- **Standing permission:** maintain only `docs/STATUS.md` and `docs/MASTER_HANDOFF.md`, only in branch `docs/protesto-continuity`, after material verified change. Read back and record actual docs SHA.
- **Standing permission** remains limited to the two continuity docs. Owner explicitly continued the narrowly scoped F01/F02, F03 synthetic-only, F05 async-auth and **F04 PostgreSQL resilience Draft PR/test packages**, each following the concrete prior proposal. There is **no blanket code authorization** for F06–F12 or further changes; no merge, real data, production, branch rules or spending.
- No OpenCode, no other projects, no real civic/political user data, no secrets in the public repo, no unapproved expenses or deployments.
- Keep four separate assessments: implementation PARTIAL, synthetic verification PARTIAL vs Production, release readiness **BLOCKED**, operational/professional maturity PARTIAL. Do not fabricate percent completion.

## Exact resume action

Reconfirm PR #64 exact HEAD, CI and docs branch. **F01–F05 have scoped fixes, synthetically verified in Draft PRs #60–#64; none merged. F06 read-only audit CONFIRMED the ambient-DATABASE_URL destructive-test defect.** **NEXT:** propose an F06 safety-first Draft PR: (1) make destructive tests impossible against non-attested dedicated disposable DBs; (2) bind retention authorization to actual connected database/per-run identity and least-privilege role; (3) add negative mismatch/privilege/forwarded-loopback tests. **Code changes require separate specific owner authorization**. F08 fail-closed startup review can proceed READ-ONLY, without deployment. F07/F09/F10/F12 and legal/privacy/integration P0 gates remain open. Never run destructive tests or cleanup against real/shared DB; no merge, deploy or spend.

## Historical preservation

Prior `STATUS.md` versions and audit checkpoints remain available through Git commit history; see the [pre-continuity historical status](https://github.com/titanfit102-bit/Protesto/blob/4aec08ac16207af4c36ee0e1f0f84e5f2c0c67d5/docs/STATUS.md) and [pre-independent-audit snapshot](https://github.com/titanfit102-bit/Protesto/blob/216466d0c343661a54d192772c852ae86230df1a/docs/STATUS.md). Detailed chronology, architecture, reviews, PR dependencies, risk register and acceptance criteria are maintained in MASTER_HANDOFF and existing specialized docs; no history was intentionally deleted.

