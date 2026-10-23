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

1. **READ-ONLY:** verify GitHub PR #59 or newer candidate, exact code HEAD/CI and continuity branch; reconcile any changes since this checkpoint.
2. Audit current GitHub branch protection, stacked-PR integration procedure, check requirements and safe merge/review sequencing; separately inspect synthetic retention isolation and residual environment/toolchain risks.
3. Propose only narrowly scoped further edits if required; no application changes, `main` mutation, PR retargeting or Production without separate explicit authorization.
4. After any material **verified** project change, update this file (short delta) and `MASTER_HANDOFF.md` if long-term context changed, **only on `docs/protesto-continuity`** under the standing authorization. Verify read-back before claiming the checkpoint was saved.

## Preservation of historical status

The previous `docs/STATUS.md` contained valuable 2026-10-21/22 development history but had an obsolete opening claim that PR #1 was current. Its **full original text** remains retrievable at the immutable, exact [pre-continuity snapshot](https://github.com/titanfit102-bit/Protesto/blob/4aec08ac16207af4c36ee0e1f0f84e5f2c0c67d5/docs/STATUS.md); history is not deleted from Git. ADRs, release matrices and CI history remain in existing dedicated docs, linked from [MASTER_HANDOFF](./MASTER_HANDOFF.md).

## Continuity rules (DECIDED)

The owner authorized ongoing edits **only** to `docs/STATUS.md` and `docs/MASTER_HANDOFF.md` **only** on `docs/protesto-continuity`, after material verified changes. No authorization for code changes, other documents, branch merges, deploy, public data, spending or other projects. Do not fabricate inaccessible chat history, completed tests or percentages. If a write fails, state **HANDOFF NOT SAVED** and the exact resume steps. On restarting in a new chat: read this branch's STATUS first, then MASTER_HANDOFF, then reverify current GitHub and continue development at the exact next authorized step.
