# PROTESTO — CURRENT_STATE (canonical recovery checkpoint)

**Verified/reconciled:** 2026-10-23 | **Release gate: NO-GO for Production or real sensitive civic data**  
**Documentation branch:** [`docs/protesto-continuity`](https://github.com/titanfit102-bit/Protesto/tree/docs/protesto-continuity)  
**Full history and detailed F01–F12 audit:** [`docs/MASTER_HANDOFF.md`](./MASTER_HANDOFF.md)  
**Repository:** https://github.com/titanfit102-bit/Protesto

> **NEW CHAT:** Read this file from the **HEAD of `docs/protesto-continuity`**, then MASTER_HANDOFF; recheck GitHub PRs, branch HEADs, exact CI and `main` before proceeding. This docs branch was originally based on PR #58 and is **not** the latest code branch. No progress or "PASS" claim may be transferred to newer untested code.

## Latest VERIFIED application checkpoint

| Subject | Grounded fact |
|---|---|
| Latest candidate | [Draft PR #62](https://github.com/titanfit102-bit/Protesto/pull/62), open/unmerged; based on PR #61 |
| Code branch | `feat/protesto-archived-dialogue-cancellation` |
| **Code HEAD SHA** | `bd3c502db868f1d02c689f1fcaf8c81de641df43` |
| Automated run | [Actions #40014007571](https://github.com/titanfit102-bit/Protesto/actions/runs/40014007571) **completed/success**: **66/66 PASS, 0 FAIL, 0 SKIP** Node/PostgreSQL; F03 integration, 17 migrations twice/idempotency, fail-closed release audit, Chromium E2E, npm audit and synthetic encrypted backup/restore PASS |
| CI evidence boundary | Exact PR #62 branch SHA and workflow linked; separate CI merge checkout tree equality was **not independently reconfirmed** at this checkpoint (historical PR #59 tree proof preserved in MASTER_HANDOFF) |
| Dependencies | `package-lock.json` **present**, frozen installs use `npm ci` in #59; full runtime/toolchain pinning still partial |
| `main` | `1e34611bdb48195e7deadb8e33d26ddac3338c4d`, original README, `protected:false` and repository rulesets `[]`; no merge |
| Topology | #1 foundation + #31–#62 stacked Draft PR lineage; PR #62 differs from #61 by **10 files** (including 017 and expanded tests). Historical 223 commits/124 files comparison is for PR #59 only. No PRs merged |
| Deployment | PUBLIC source repo, **no approved Production service** or real-data pilot |

The last independent GPT Work report uploaded in conversation is **external material, not a committed project document**; its verifiable engineering findings and provenance are summarized in MASTER_HANDOFF. Dynamic Work probes were **not independently rerun** in this review.

## Current engineering priorities — implemented vs open

1. **F01 / P1 privacy (IMPLEMENTED, TESTED scope):** [Draft PR #60](https://github.com/titanfit102-bit/Protesto/pull/60) clears private DOM/forms/dialogue module state on logout/session refresh and ignores stale requests. E2E A→logout→B with public ledger 503 **PASS** at `69ecbf5fc3972758b595cb2cac416fce38c4a730`. Residual delayed-response, 401 and broader cross-module scenarios warrant later expansion before real-data pilot; no Production approval.
2. **F02 / P1 correctness (IMPLEMENTED AND VERIFIED synthetic):** [Draft PR #61](https://github.com/titanfit102-bit/Protesto/pull/61) stores exact accepted correction/appeal reasoning (no prefix/truncation) and records decision provenance in existing audit entries. New PostgreSQL boundary tests for 979/980/1000, 981/982/1000, rejected and 1001 invalid, Unicode, case state and audit/rollback checks **PASS**, exact SHA/CI above.
3. **F03 / P1 lifecycle (SCOPED SYNTHETIC FIX IMPLEMENTED / VERIFIED):** owner responded `vazhdo` to the precise synthetic-only F03 policy/implementation proposal. [Draft PR #62](https://github.com/titanfit102-bit/Protesto/pull/62) adds migration 017 `cancelled` with timestamp/actor, atomically cancels still-open child topics and deletes their pseudonymous votes in all 3 archived-case paths; emits audit events, no new aggregates, preserves older closed-topic aggregates internally, suppresses public reads after parent withdrawal. Synthetic DB tests for all 3 archive paths, approved/pending topics, 404/late vote 409, audit and closed result retention **PASS** (CI #40014007571). **No real data erasure, approval of general retention policy or deployment**. Further live backup lifecycle, stronger contention stress and privacy/legal sign-off remain OPEN.
4. **F05 (READ-ONLY deep audit complete; code NOT IMPLEMENTED):** `verifyPassword` uses synchronous `scryptSync`; known/active accounts consume KDF work while unknown/inactive accounts do not; `SELECT ... FOR UPDATE` holds user row lock through derivation/TOTP/session creation. **Proposed separate scope:** async `scrypt` with valid fixed-format dummy hash for unknown accounts; bounded password input and concurrent KDF load; first read without row lock, then transaction reread/lock and confirm active, hash unchanged before MFA counter update/session insert. Existing MFA one-time counter and rate limits must not regress. Detailed test matrix in MASTER_HANDOFF. **F04 remains open:** pg pool lacks error listener/explicit timeouts and graceful close; `/api/ready` already exists but could stall. No code changed for F05/F04.
5. **F06/F08:** real-DB identity/least privilege for synthetic retention; release verdict is not a startup interlock.
6. **F09/F07:** broader encrypted restore parity and human review/protection/integration of cumulative 124-file diff.
7. **F10/F12:** login button contrast **3.791884:1** vs required **4.5:1** for 12px text; toolchain reproducibility and update policy.
8. **F11:** canonical MASTER_HANDOFF stale lockfile statement corrected on the documentation branch; older external/other docs retain dated historical snapshots pending separate approval.

**Evidence status:** F01/F02/F03 have scoped implemented fixes and exact-CI synthetic proof, but all three remain unmerged and are **not Production certified**. F04–F10/F12 remain open or partial (F11 canonical handoff chronology was corrected). External audit dynamic measurements were not all independently replayed. No real Production exposure, data loss, erasure or deployment was proven.

## Authorizations / completion boundary

- **Standing permission:** maintain only `docs/STATUS.md` and `docs/MASTER_HANDOFF.md`, only in branch `docs/protesto-continuity`, after material verified change. Read back and record actual docs SHA.
- **Standing permission** remains limited to the two continuity docs. Owner separately approved F01/F02 isolated Draft PR fixes and the **specific F03 synthetic-only cancellation/vote handling package** after the precise proposal. **No blanket authority** to change unrelated code/schema, branch rules, real database, backups, production or merge.
- No OpenCode, no other projects, no real civic/political user data, no secrets in the public repo, no unapproved expenses or deployments.
- Keep four separate assessments: implementation PARTIAL, synthetic verification PARTIAL vs Production, release readiness **BLOCKED**, operational/professional maturity PARTIAL. Do not fabricate percent completion.

## Exact resume action

Reconfirm PR #62, the actual newest GitHub head/CI and this docs checkpoint. **F01/F02/F03 remain implemented and synthetically verified only in open Draft PRs #60–#62**. **F05 read-only deep audit and exact regression/patch scope are now prepared**, but F05 code is NOT changed; next step after **specific owner code authorization** is to create a Draft PR stacked on #62 for async scrypt + dummy verification + two-phase account check and MFA preservation; synthetic database/security tests, full CI and readback. F04 remains next in a separate tranche. Independently harden F03 contention coverage and real-data backup/retention policy before any live use; no merge, production, real data or costs.

## Historical preservation

Prior `STATUS.md` versions and audit checkpoints remain available through Git commit history; see the [pre-continuity historical status](https://github.com/titanfit102-bit/Protesto/blob/4aec08ac16207af4c36ee0e1f0f84e5f2c0c67d5/docs/STATUS.md) and [pre-independent-audit snapshot](https://github.com/titanfit102-bit/Protesto/blob/216466d0c343661a54d192772c852ae86230df1a/docs/STATUS.md). Detailed chronology, architecture, reviews, PR dependencies, risk register and acceptance criteria are maintained in MASTER_HANDOFF and existing specialized docs; no history was intentionally deleted.

