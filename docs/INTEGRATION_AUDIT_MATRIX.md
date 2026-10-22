# PROTESTO — Integrated candidate evidence and review matrix

**Checkpoint:** 2026-10-23. The audited implementation SHA precedes this documentation-only commit; the live PR HEAD must be read from GitHub. **Scope:** synthetic, PostgreSQL-backed private pilot for Albanian civic accountability, not a public live system. **This is an internal source/CI review, not an independent security, privacy, legal or accessibility assessment.**

## 1. Immutable evidence and branch topology

| Item | Checked fact | Evidence |
|---|---|---|
| Candidate | Draft [PR #55](https://github.com/titanfit102-bit/Protesto/pull/55), `feat/protesto-atomic-public-read-snapshots`, audited implementation SHA `906aef9970cab066f4e468c50dafb4fea4444773` (before this document's commit); **not merged** | PR #55 metadata |
| Baseline | `feat/protesto-foundation` at `ab4cb221d1320d50b9a489c64a7380d227c3cd4c` | GitHub ref |
| Main | `main` at `1e34611bdb48195e7deadb8e33d26ddac3338c4d` | GitHub ref |
| Ancestry | Compared candidate against foundation: **ahead 80 commits, behind 0**; **76 changed files** (compare result). Compared #31 against candidate: ahead 63, behind 0 | GitHub compare_commits |
| CI at audited implementation SHA | [Run #39867893831](https://github.com/titanfit102-bit/Protesto/actions/runs/39867893831) **success**; 58/58 Node tests, 16 PostgreSQL migrations and repeated migration, Chromium pilot/dialogue E2E, npm audit reporting zero findings at run time, synthetic encrypted backup verification and isolated restore | Workflow result and job logs |
| Artifact | `Protesto-Preview-Offline` (1,351,470 bytes at verification), not a deployment, retention per workflow 14 days | Actions artifact list and `.github/workflows/verify.yml` |
| Live release | **Not authorized**. `evaluateReadiness` returns `releaseAllowed:false` even with CI evidence | `src/ops/release-gate.mjs` |

**Critical distinction:** passing the integrated suite proves the tested synthetic paths at the audited implementation revision. It does not establish factual accuracy of citizen allegations, legal permission, correct security configuration, real-world usability, or complete race-freedom. A PostgreSQL one-statement snapshot is consistent at query start; archival may occur immediately afterward.

## 2. Draft PR dependency map

**Primary linear review stack:** [#31](https://github.com/titanfit102-bit/Protesto/pull/31) → #32 → #33 → #34 → #35 → #36 → #37 → #38 → #39 → #40 → #41 → #42 → #43 → #44 → #45 → #46 → #47 → #48 → #49 → #50 → #51 → #52 → #53 → #54 → **[#55](https://github.com/titanfit102-bit/Protesto/pull/55)**. The GitHub PR base branches form this chain; all **25 PRs are open Draft and unmerged** at this checkpoint.

| PR group | Main changes represented in the candidate | Verification scope |
|---|---|---|
| #31 | Combined public dialogue aggregate, correction/archival decision guard and public ledger hardening | Integrated PostgreSQL/API + unit tests; follow-up fixes in the same lineage |
| #32–#35 | Source disclosure gates, synthetic PDF hash attestations, independent reviewed case text and local digest comparison | Source/public projection, source-fingerprint and document integrity tests |
| #36–#38 | Reviewer TOTP option, shared anti-abuse/session revocation, redacted citizen response workflow | TOTP, session revocation, pilot and citizen response integration |
| #39–#42 | Outbound link hygiene, browser/accessibility smoke, private operations status, disposable staging rehearsal and fail-closed release audit | URL tests, Chromium smoke, staging boundary and release-gate checks |
| #43–#48 | Public-safe source metadata, action text, appeal archival guard, dialogue report data gates, public case area and separately reviewed topic/statement text | Privacy projection and archival tests, PostgreSQL migrations 012–015 |
| #49 | A **different** reviewer approves public dialogue topics and public copy | Dual-review API/browser scenarios, migration 016 |
| #50–#53 | PostgreSQL parent-row locks for source/case and dialogue transitions; atomic citizen submissions and scoped author quotas | Synthetic contention tests for case archival, votes, correction/appeal/action/topic quotas |
| #54–#55 | Secondary public source route rechecks case eligibility; topic-detail and citizen-response public reads use a single query snapshot | Interleaving/one-query tests, reviewed-field allowlists, 404 on withdrawn/incomplete cases |

**Overlapping historical Drafts:** [#28](https://github.com/titanfit102-bit/Protesto/pull/28), [#29](https://github.com/titanfit102-bit/Protesto/pull/29) and [#30](https://github.com/titanfit102-bit/Protesto/pull/30) each target foundation independently. Their implementations are represented in the #31 integrated branch, so do **not** merge them separately without a file-by-file reconciliation. Older experimental branches/PRs are not part of the reviewed #31–#55 stack.

**Integration rule:** no bulk merge, no rebase, no retargeting and no automatic closure based only on this document. A human reviewer must verify the exact SHA, cumulative 76-file diff and per-PR dependencies first. If integration is later approved, choose and document **one** explicit merge strategy; do not independently merge overlapping feature PRs and the consolidated stack.

## 3. Access-control and privacy projection matrix

Legend: **VERIFIED (automated)** = a specific implemented and exercised invariant, not third-party certification; **PARTIAL** = exists but lacks a necessary production control; **UNKNOWN** = no adequate evidence in this checkpoint.

| Workflow or API surface | Expected invariant | Evidence / status | Open question / release risk |
|---|---|---|---|
| Case submission and review (`/api/cases`, `/api/review/:id`) | Authenticated author; independent reviewer; case begins pending; publication needs accepted reviewed sources, redacted text and attestations | **VERIFIED (automated)** — `test/pilot.integration.test.mjs`, `src/server/app.mjs` | Human source authenticity and legal editorial policy **PARTIAL** |
| Public cases (`/api/public/cases`) | Return only `public_title`, `public_description`, `public_area`, approved public source link and allowlisted metadata while published | **VERIFIED (automated)** — privacy and pilot tests | Human-approved copy can still contain PII **PARTIAL** |
| Public source listing (`/api/dossiers/:id/sources`) | Nonprivileged request sees only accepted, reviewed public metadata for an actively published/fully approved case; original fields remain protected | **VERIFIED (automated)** — `test/public-source-eligibility.integration.test.mjs` and source publication tests | Third-party proof of source authenticity **PARTIAL** |
| Actions and peaceful gatherings (`/api/actions/public`) | Reviewed public copies only, pending/rejected hidden, role-separated publication, per-author hourly quota | **VERIFIED (automated)** — action/publication and editorial quota tests | Legal review of real-world gathering and personal information **PARTIAL** |
| Corrections and appeals | Author-scoped requests, independent reviewers, rejected-correction appeal, no editorial decision on archived parent, immutable audit | **VERIFIED (automated)** — correction policy, appeal and pilot integration tests | Formal institution right-of-reply and legal remedy procedure **PARTIAL** |
| Public status ledger (`/api/public/ledger`) | Published/archived event allowlist, canonical timestamps, no private reviewer notes or reporter identity | **VERIFIED (automated)** — `test/public-ledger.test.mjs` and pilot tests | Legally vetted public correction wording **PARTIAL** |
| Dialogue topic proposal/review | Separate public topic copy; proposed topic invisible until different reviewer explicitly approves; case and topic state guards | **VERIFIED (automated)** — `test/dialogue.integration.test.mjs` and Chromium dialogue E2E | Moderation governance, verified identities and impartiality audit **PARTIAL** |
| Dialogue statements/votes | Distinct approved `public_body`, no pending statements, privacy acknowledgement, pseudonymous vote keys, no live counts | **VERIFIED (automated)** — dialogue integration/Chromium | Sensitive political opinion implications, consent and retention **PARTIAL** |
| Public dialogue topic detail (`/api/dialogue/topics/:id`) | One PostgreSQL statement/snapshot; redact originals; show counts only when closed and ≥10 participants | **VERIFIED (automated)** — `test/public-read-snapshot.integration.test.mjs` | Population representativeness **N/A** — platform explicitly disclaims it |
| Public dialogue report (`/api/dialogue/report`) | Closed/approved only; ≥10 participants; accepted reviewed source URL; no raw identity or open-topic counts | **VERIFIED (automated)** — dialogue report/integration tests | Human review of statements and downstream statistical interpretations **PARTIAL** |
| Citizen response GET (`/api/dossiers/:id/responses`) | One parent/child snapshot; accepted and reviewed text only; no disclosure after withdrawal | **VERIFIED (automated)** — responses and snapshot tests | Actual institutional identity/right-of-reply **PARTIAL** |
| Login, sessions, CSRF, write quotas | Scrypt passwords, HttpOnly session cookie, exact-origin POST, shared PostgreSQL quota, session revocation | **VERIFIED (automated)** for tested paths — security/session/pilot tests | Reviewer MFA opt-in, recovery, gateway defenses, secret rotation **PARTIAL** |
| Reviewer TOTP | Enrollment and code verification logic present and exercised in synthetic tests | **VERIFIED (automated)** for opt-in workflow | Universal enforced reviewer MFA **PARTIAL**; do not claim mandatory MFA |
| Operations/backup | CI staging isolated to synthetic DB; authenticated operations status; encrypted backup, tamper rejection, test restore | **VERIFIED (automated)** for disposable setup | Live staging, offsite schedule, alerts and incident response **NO EVIDENCE / P0** |
| Accessibility | Chromium/mobile viewport and basic accessibility smoke | **VERIFIED (automated)** for smoke tests | Independent WCAG + assistive technology acceptance **UNKNOWN** |

**Public/private field principle:** never infer that a record is safe solely from an accepted/reviewed status. Public projections must independently require a valid parent publication state and approved copies. Reviewer queue endpoints intentionally expose private drafts **only to authorized reviewer roles** and require a governance/privacy review before real use.

## 4. Current verification boundary

- Audited implementation CI job at SHA `906aef9970cab066f4e468c50dafb4fea4444773`: **completed/success**, **58 passed, 0 failed Node tests**, PostgreSQL 16 versioned migrations/idempotence, npm dependency audit with no reported findings, Chromium pilot+dialogue E2E, backup/restore drill.
- These are **local ephemeral CI tests**, not live hosted staging, independent penetration testing, authentic institutional workflow trials or a real disaster recovery exercise.
- A `success` result does not make the application safe for actual allegations, whistleblower submissions or identifiable political-opinion data.
- This audit verified the **GitHub ancestry and subset of code-level route/security contracts**, not an exhaustive line-by-line review of all 76 changed files. Full independent code and threat-model review remains necessary.
- **UNKNOWN:** protection rules requiring reviews on foundation/main, production secrets policy applied outside repo, live deployment/monitoring state. Do not infer these from a green synthetic workflow. **No production deployment was initiated here.**
- Historical failed CI attempts are part of the audit trail; require a **green run at the exact integration-candidate SHA**, not an earlier success for a different tree.

## 5. Four distinct maturity assessments

| Dimension | Current assessment | What would change it |
|---|---|---|
| **Implementation** | Substantial private pilot, **PARTIAL** against a full public launch standard | Close identified missing controls, do not merely increase PR count |
| **Verification** | Strong repeatable **automated/synthetic** coverage, **PARTIAL** for production | Independent security, manual accessibility, privacy and hosted-stage evidence |
| **Release readiness** | **BLOCKED — P0** | All external gates closed **and** specific owner authorization |
| **Professional/operational maturity** | Documented modular pilot, **PARTIAL** | Responsible operators, monitored environment, backup custody and incident runbooks drilled |

No numeric percentage is assigned: there is no verified weighted denominator for the outstanding legal, organizational and operational work.

## 6. P0 external gates (all remain open for release)

These are enumerated by `src/ops/release-gate.mjs` and are **not** satisfied by GitHub Actions:

1. Independent security assessment: authenticated/anonymous API authorization, session/MFA, CSRF, IDOR, race/abuse, public-data leaks, dependency and deployment threats.
2. Privacy/legal assessment and DPIA where required: lawful basis, consent/notice, data subject access/erasure, retention of votes/backups, cross-border transfers and handling of sensitive reports.
3. Approved impartial editorial/institutional governance: identity verification, independent moderation, legitimate right of reply, conflict resolution and appeal escalation.
4. Enforced reviewer MFA with safe recovery/key rotation and controlled account provisioning.
5. Real separately isolated **hosted staging** tested with synthetic records only; acceptance including accessibility/real devices.
6. Encrypted **offsite operational backups**, monitoring/alerting, scheduled restore proof and retention controls.
7. Named incident owner, escalation/runbook and measured drills.
8. **Explicit owner approval** for any integration into foundation/main **and separately for any public deployment or real-data processing**.

**P1 after P0:** reviewer-friendly audit tooling, maintainability and dependency change policy, broader assistive-technology acceptance, code-owner governance, migration/rollback exercises and user support standards. **Out of scope:** political microtargeting, persuasion bots, nonconsensual political profile inference and attendance tracking.

## 7. Human integration checklist (not executed)

- [x] Identify exact candidate SHA, 25 Draft PR stack and baseline ancestry.
- [x] Confirm green CI at exact SHA and audit the verification steps.
- [x] Identify separate overlapping #28–#30 branches and avoid duplicate merge.
- [ ] Commission / complete a code and security review of the **cumulative 76-file diff**, with particular attention to `src/server/app.mjs`, `dialogue.mjs`, `dossiers.mjs`, `responses.mjs`, `appeals.mjs`, auth/TOTP, backups, migrations, and public projections.
- [ ] Produce an independent route-by-role test matrix covering anonymous, author, reporter, reviewer, conflicting reviewer, admin, archived, rejected, unreviewed and concurrent states; attach observed evidence, not assumptions.
- [ ] Evaluate legal/privacy/institutional governance and verify live-data restrictions.
- [ ] Verify actual branch protections/review requirements; confirm no surprise direct merge/deploy hooks.
- [ ] Prepare an owner-approved integration strategy for the stacked PRs, including the overlapping historical PRs and a safe, reversible migration plan. **Do not execute yet.**
- [ ] Repeat full CI on the exact proposed merge candidate and review all logs, artifacts and hidden deployment triggers.
- [ ] Obtain **separate explicit owner decisions** before merging into foundation, merging main, activating staging outside synthetic CI or public release.

**Release decision at this checkpoint:** **NO-GO**. Technical pilot candidate ready for a focused human integration/security review only; not authorized for merge or public launch.

## 8. Source of truth / maintenance

Primary evidence: [PR #55](https://github.com/titanfit102-bit/Protesto/pull/55), [CI run #39867893831](https://github.com/titanfit102-bit/Protesto/actions/runs/39867893831), `docs/RELEASE_READINESS.md`, `docs/RELEASE_GATES.md`, `src/ops/release-gate.mjs`, `tools/release-audit.mjs`, `.github/workflows/verify.yml`, and source/test modules named above. Revalidate hashes and statuses whenever a branch changes; this document is a **point-in-time** report, not a standing approval.
