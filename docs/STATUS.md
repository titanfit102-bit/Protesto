# PROTESTO — CURRENT_STATE (canonical recovery checkpoint)

**Verified/reconciled:** 2026-10-23 | **Release gate: NO-GO for Production or real sensitive civic data**  
**Documentation branch:** [`docs/protesto-continuity`](https://github.com/titanfit102-bit/Protesto/tree/docs/protesto-continuity)  
**Full history and detailed F01–F12 audit:** [`docs/MASTER_HANDOFF.md`](./MASTER_HANDOFF.md)  
**Repository:** https://github.com/titanfit102-bit/Protesto

> **NEW CHAT:** Read this file from the **HEAD of `docs/protesto-continuity`**, then MASTER_HANDOFF; recheck GitHub PRs, branch HEADs, exact CI and `main` before proceeding. This docs branch was originally based on PR #58 and is **not** the latest code branch. No progress or "PASS" claim may be transferred to newer untested code.

## Latest VERIFIED application checkpoint

| Subject | Grounded fact |
|---|---|
| Latest candidate | [Draft PR #59](https://github.com/titanfit102-bit/Protesto/pull/59), open/unmerged; base PR #58 |
| Code branch | `feat/protesto-reproducible-deps` |
| **Code HEAD SHA** | `b1c52f0e8074f8b73d0c8dd80f72d2953b4bdacc` |
| Automated run | [Actions #39984965787](https://github.com/titanfit102-bit/Protesto/actions/runs/39984965787) **success**; 64/64 Node tests, 0 failed, no DB critical skips, PostgreSQL migrations/replay, Chromium E2E smoke, npm audit and synthetic encrypted restore |
| CI checkout proof | Merge commit `c059e3a0b279ce72c9fafdf2458181eebf9e55b8` has the **same Git tree** as code HEAD: `cb942053a0b63ceb97f318d6d885ef924b5da68e` |
| Dependencies | `package-lock.json` **present**, frozen installs use `npm ci` in #59; full runtime/toolchain pinning still partial |
| `main` | `1e34611bdb48195e7deadb8e33d26ddac3338c4d`, original README, `protected:false` and repository rulesets `[]`; no merge |
| Topology | #1 foundation + #31–#59 continuous Draft stack; cumulative comparison PR #59 vs main: 223 commits ahead, 124 files changed |
| Deployment | PUBLIC source repo, **no approved Production service** or real-data pilot |

The last independent GPT Work report uploaded in conversation is **external material, not a committed project document**; its verifiable engineering findings and provenance are summarized in MASTER_HANDOFF. Dynamic Work probes were **not independently rerun** in this review.

## Current engineering priorities — NOT implemented yet

1. **F01 / P1 privacy:** private DOM/form state remains after logout/account switch; public-feed failure can leave old private cards visible. **NEXT:** design narrowly scoped patch and synthetic Chromium E2E (A→logout→B, with 503, 401 and late requests). No user A data may remain visible for B.
2. **F02 / P1 correctness:** correction/appeal accepted notes of 1000 chars grow to 1021/1019 after prefixes but `retraction_history.note` is `varchar(1000)`. Plan lossless fix and PostgreSQL boundary/rollback/audit tests; never silently truncate.
3. **F03 / P1 privacy lifecycle:** after case archival, dialogue topic closure returns 409 and earlier pseudonymous votes may remain. **Owner/privacy lifecycle decision required BEFORE implementation**; never execute live deletions by inference.
4. **F05/F04:** synchronous login scrypt and known/unknown timing; missing PostgreSQL pool error handling, DB timeouts/fault recovery.
5. **F06/F08:** real-DB identity/least privilege for synthetic retention; release verdict is not a startup interlock.
6. **F09/F07:** broader encrypted restore parity and human review/protection/integration of cumulative 124-file diff.
7. **F10/F12:** login button contrast **3.791884:1** vs required **4.5:1** for 12px text; toolchain reproducibility and update policy.
8. **F11:** canonical MASTER_HANDOFF stale lockfile statement corrected on the documentation branch; older external/other docs retain dated historical snapshots pending separate approval.

**Evidence status:** F01–F12 are supported by inspected source/schema, GitHub configuration, direct contrast/prefix calculations or test-coverage gaps. They are **OPEN** until regressions and authorized fixes pass at a new exact code SHA. Some Work-reported HTTP/Chromium/mock timing experiments were not independently reproduced. No actual Production data loss, exposure, erasure or deployment is proven.

## Authorizations / completion boundary

- **Standing permission:** maintain only `docs/STATUS.md` and `docs/MASTER_HANDOFF.md`, only in branch `docs/protesto-continuity`, after material verified change. Read back and record actual docs SHA.
- **No standing permission** for other code/files, schema, tests, PR branches, rebase/merge, branch rules, live database or production actions. Request specific authorization before implementing F01/F02 or any other code changes.
- No OpenCode, no other projects, no real civic/political user data, no secrets in the public repo, no unapproved expenses or deployments.
- Keep four separate assessments: implementation PARTIAL, synthetic verification PARTIAL vs Production, release readiness **BLOCKED**, operational/professional maturity PARTIAL. Do not fabricate percent completion.

## Exact resume action

Reconfirm GitHub PR #59 and this docs checkpoint; take **F01 then F02** to an authorized regression-first implementation proposal on isolated Draft branch(es). F03's vote/case lifecycle first requires a policy decision; defer irreversible behavior. When code edits are separately approved, run targeted+full synthetic CI including zero-skipped DB tests and browser scenarios, record new HEAD/merge tree evidence and update both continuity docs. If no code-edit permission exists, continue read-only threat/acceptance design.

## Historical preservation

Prior `STATUS.md` versions and audit checkpoints remain available through Git commit history; see the [pre-continuity historical status](https://github.com/titanfit102-bit/Protesto/blob/4aec08ac16207af4c36ee0e1f0f84e5f2c0c67d5/docs/STATUS.md) and [pre-independent-audit snapshot](https://github.com/titanfit102-bit/Protesto/blob/216466d0c343661a54d192772c852ae86230df1a/docs/STATUS.md). Detailed chronology, architecture, reviews, PR dependencies, risk register and acceptance criteria are maintained in MASTER_HANDOFF and existing specialized docs; no history was intentionally deleted.

