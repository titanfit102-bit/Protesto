# PROTESTO — CURRENT_STATE (canonical recovery checkpoint)

**Verified/reconciled:** 2026-10-23 | **Release gate: NO-GO for Production or real sensitive civic data**  
**Documentation branch:** [`docs/protesto-continuity`](https://github.com/titanfit102-bit/Protesto/tree/docs/protesto-continuity)  
**Full history and detailed F01–F12 audit:** [`docs/MASTER_HANDOFF.md`](./MASTER_HANDOFF.md)  
**Repository:** https://github.com/titanfit102-bit/Protesto

> **NEW CHAT:** Read this file from the **HEAD of `docs/protesto-continuity`**, then MASTER_HANDOFF; recheck GitHub PRs, branch HEADs, exact CI and `main` before proceeding. This docs branch was originally based on PR #58 and is **not** the latest code branch. No progress or "PASS" claim may be transferred to newer untested code.

## Latest VERIFIED application checkpoint

| Subject | Grounded fact |
|---|---|
| Latest candidate | [Draft PR #61](https://github.com/titanfit102-bit/Protesto/pull/61), open/unmerged; based on PR #60 |
| Code branch | `feat/protesto-retraction-note-boundaries` |
| **Code HEAD SHA** | `1bfe8db99cb37dc8ce48466864260895fc4c6115` |
| Automated run | [Actions #40010017504](https://github.com/titanfit102-bit/Protesto/actions/runs/40010017504) **success**; **65/65 PASS, 0 FAIL, 0 SKIP** Node/PostgreSQL tests, Chromium E2E (including F01 scenario), npm audit, migrations/replay and synthetic encrypted restore |
| CI checkout proof | Merge commit `c059e3a0b279ce72c9fafdf2458181eebf9e55b8` has the **same Git tree** as code HEAD: `cb942053a0b63ceb97f318d6d885ef924b5da68e` |
| Dependencies | `package-lock.json` **present**, frozen installs use `npm ci` in #59; full runtime/toolchain pinning still partial |
| `main` | `1e34611bdb48195e7deadb8e33d26ddac3338c4d`, original README, `protected:false` and repository rulesets `[]`; no merge |
| Topology | #1 foundation + #31–#59 continuous Draft stack; cumulative comparison PR #59 vs main: 223 commits ahead, 124 files changed |
| Deployment | PUBLIC source repo, **no approved Production service** or real-data pilot |

The last independent GPT Work report uploaded in conversation is **external material, not a committed project document**; its verifiable engineering findings and provenance are summarized in MASTER_HANDOFF. Dynamic Work probes were **not independently rerun** in this review.

## Current engineering priorities — NOT implemented yet

1. **F01 / P1 privacy (IMPLEMENTED, TESTED scope):** [Draft PR #60](https://github.com/titanfit102-bit/Protesto/pull/60) clears private DOM/forms/dialogue module state on logout/session refresh and ignores stale requests. E2E A→logout→B with public ledger 503 **PASS** at `69ecbf5fc3972758b595cb2cac416fce38c4a730`. Residual delayed-response, 401 and broader cross-module scenarios warrant later expansion before real-data pilot; no Production approval.
2. **F02 / P1 correctness (IMPLEMENTED AND VERIFIED synthetic):** [Draft PR #61](https://github.com/titanfit102-bit/Protesto/pull/61) stores exact accepted correction/appeal reasoning (no prefix/truncation) and records decision provenance in existing audit entries. New PostgreSQL boundary tests for 979/980/1000, 981/982/1000, rejected and 1001 invalid, Unicode, case state and audit/rollback checks **PASS**, exact SHA/CI above.
3. **F03 / P1 privacy lifecycle (POLICY BLOCKED):** independently rechecked PR #61: all three case archive pathways leave open child dialogue topics unchanged, normal close rejects archived parent, and their pseudonymous vote rows may persist. Public report hides archived parent data. **ADR-026** deletes individual votes on normal close; **DATA_RETENTION_AND_ERASURE_REGISTER** explicitly says **NO additional deletion until a new policy decision**. Recommended policy (NOT APPROVED): cancelled state via additive migration v017, atomic cancellation of child open topics on all three archive paths, no new aggregate publication; vote deletion/retention, already-closed aggregates and backups require owner/legal privacy approval before implementing. No live deletion authorized.
4. **F05/F04 (READ-ONLY verified design):** login uses `scryptSync` only for existing/active accounts while holding PostgreSQL transaction/row lock; plan async matching-work verification with dummy hash and MFA atomicity intact, plus bounded concurrency tests. Pool has `max:10` but lacks error listener and explicit connection/query/lock/idle-in-transaction timeouts; **`/api/ready` already does `SELECT 1` and returns 503 on DB errors** (not absent). Plan bounded availability/fault and graceful shutdown tests. No code changes authorized in this scope.
5. **F06/F08:** real-DB identity/least privilege for synthetic retention; release verdict is not a startup interlock.
6. **F09/F07:** broader encrypted restore parity and human review/protection/integration of cumulative 124-file diff.
7. **F10/F12:** login button contrast **3.791884:1** vs required **4.5:1** for 12px text; toolchain reproducibility and update policy.
8. **F11:** canonical MASTER_HANDOFF stale lockfile statement corrected on the documentation branch; older external/other docs retain dated historical snapshots pending separate approval.

**Evidence status:** F01–F12 are supported by inspected source/schema, GitHub configuration, direct contrast/prefix calculations or test-coverage gaps. They are **OPEN** until regressions and authorized fixes pass at a new exact code SHA. Some Work-reported HTTP/Chromium/mock timing experiments were not independently reproduced. No actual Production data loss, exposure, erasure or deployment is proven.

## Authorizations / completion boundary

- **Standing permission:** maintain only `docs/STATUS.md` and `docs/MASTER_HANDOFF.md`, only in branch `docs/protesto-continuity`, after material verified change. Read back and record actual docs SHA.
- **Standing permission** remains limited to the two continuity docs; user approved the narrowly scoped **F01/F02 correction work** in this conversation, with isolated Draft PRs/tests only. No blanket authority to change unrelated code/schema, rebase/merge, branch rules, real database or production.
- No OpenCode, no other projects, no real civic/political user data, no secrets in the public repo, no unapproved expenses or deployments.
- Keep four separate assessments: implementation PARTIAL, synthetic verification PARTIAL vs Production, release readiness **BLOCKED**, operational/professional maturity PARTIAL. Do not fabricate percent completion.

## Exact resume action

Reconfirm GitHub PR #61 and latest continuity checkpoint. **F01/F02 are implemented and synthetically verified** in Draft PRs #60/#61. **F03 architecture/policy review is complete but BLOCKED by owner/privacy policy**: choose whether cancellation deletes pseudonymous vote rows, how to treat already-closed aggregates and backups, and authorize any additive schema/code edits separately. Do not infer new deletion rights from a generic 'continue'. Pending that decision, F05/F04 source review and initial acceptance design are also complete; the next authorized-development proposal is an isolated F05 async-authentication tranche, followed by F04 DB pool resilience, with separate code-change authorization. Continue read-only hardening or request the explicit F03 policy choices. For authorized changes require synthetic PostgreSQL transaction/race tests across all 3 case archival paths, zero critical skips, Chromium E2E and exact final PR-SHA CI. No merge/deploy.

## Historical preservation

Prior `STATUS.md` versions and audit checkpoints remain available through Git commit history; see the [pre-continuity historical status](https://github.com/titanfit102-bit/Protesto/blob/4aec08ac16207af4c36ee0e1f0f84e5f2c0c67d5/docs/STATUS.md) and [pre-independent-audit snapshot](https://github.com/titanfit102-bit/Protesto/blob/216466d0c343661a54d192772c852ae86230df1a/docs/STATUS.md). Detailed chronology, architecture, reviews, PR dependencies, risk register and acceptance criteria are maintained in MASTER_HANDOFF and existing specialized docs; no history was intentionally deleted.

