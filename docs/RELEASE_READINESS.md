# PROTESTO — Integrated release candidate audit (2026-10-22)

## 1. Project fingerprint
A privacy-sensitive Albanian civic transparency **private pilot**: Node 22 + vanilla browser modules, PostgreSQL 16, role-based reviewers, case/source editorial workflow, moderated citizen dialogue, corrections, appeals and reviewed public copies. Code visibility is public; the application has **not** been publicly deployed.

## 2. Target standard
Reliable synthetic private pilot with reproducible migrations, limited public data projection, secure identity/session boundaries, human editorial decisions, accessible workflows, nonviolent civic participation and recoverable test data. Public real-world allegations require substantial independent legal, editorial, privacy and operational controls.

## 3. Verified implementation evidence
Stacked Draft PRs #34–#41 add privacy-gated public copies, local PDF comparison, opt-in encrypted reviewer TOTP, atomic anti-abuse and session revocation, private citizen replies with independent moderation, outbound URL hardening, admin-only operational counts and disposable CI staging/viewport checks. **Only the CI logs for each exact SHA justify marking it tested.** Historical individual PRs also remain unmerged. This document does not claim an integrated production release.

## 4. Remaining partial / missing / unknown
- **PARTIAL (P0):** TOTP is opt-in, not globally enforced. No formally approved account recovery or key rotation.
- **PARTIAL (P0):** User reports, replies and source text receive human redaction gates, but sensitive personal information can still be entered in approved text. No automated PII guarantee or independent privacy review.
- **PARTIAL (P0):** Reviewer-declared document SHA-256 gives content comparison only; no trusted original archive, issuer signature verification or chain of custody.
- **PARTIAL (P0):** Corrective appeals and citizen responses exist technically, but verified institution identity and formal legal right-of-reply service are absent.
- **MISSING (P0):** Hosted staging acceptance, production readiness penetration assessment, independent legal/GDPR/DPIA review.
- **MISSING (P0):** Actual offsite encrypted backups, monitoring alerts, tested incident response owner, SLA/retention policy.
- **UNKNOWN:** Independent WCAG review with real assistive technologies, formal public policy governance, real-user acceptance.
- **N/A:** Any release scoring for personal political persuasion, voter targeting, or covert mobilization (outside product scope).

## 5. Maturity map (qualitative, evidence-based)
Implementation: substantial pilot functionality, with core gaps named above.
Verification: repeatable Node/API/PostgreSQL/Chromium test paths; manual external audit still unperformed.
Release readiness: **BLOCKED (P0)**.
Professional maturity: modular, documented and reproducible; formal operations/governance incomplete.
Avoid artificial percentage precision or treating PR number as completion.

## 6. Release gate
**NO PUBLIC DEPLOYMENT, NO REAL SENSITIVE DATA, NO MERGE TO MAIN WITHOUT EXPLICIT OWNER APPROVAL.** A green Actions run is a technical milestone only. This repository does not contain an automatic production-release command.

## 7. Ordered next steps
1. Inspect the final #42 CI logs and complete an independent code/security review against the exact candidate SHA.
2. Perform a focused threat model, manual accessibility walkthrough and privacy protection review using synthetic fixtures.
3. Define legally compliant moderation, identity checks, right of reply, retention/deletion and institutional contact procedures.
4. Authorize and provision separately secured staging, genuine backups, monitoring, MFA/recovery, incident ownership; test with fake records.
5. Only then discuss owner-approved merge/release procedure separately from PR review.

## 8. Done when
All P0 gates are evidenced by test artifacts **and independent human review**, production configuration is isolated, backups/restore are operational, stakeholders approve the public data policy, and the owner explicitly authorizes release.

## Security-review checkpoint — source metadata privacy
The post-#42 audit identified and fixed a raw source title/URL disclosure route. See Draft PR #43 and migration 012. The public sources route is now fail-closed for historical accepted records missing independently approved fields. This is an **internal code review**, not an external independent security certification. Production release remains blocked.

## Civic initiatives and gatherings: separate publication copies
Following the source metadata finding, the internal audit also found `/api/actions/public` returning raw user-provided action title/description/area after review. Migration 013 and Draft PR #44 introduce distinct reviewer-approved public copies with explicit privacy checks; historical published rows missing public copies remain hidden (no unsafe backfill). Real-world PII risk still requires independent editorial and GDPR review.

## Correction appeal stale-state audit
The internal review found that a pending appeal could still be rejected after its parent case was archived, leaving a misleading post-withdrawal editorial decision. Draft PR #45 locks the parent case and appeal together, blocks **both** decisions once the publication is inactive, and removes the stale appeal from the active queue without deleting its history. The regression tests verify the absence of audit and row mutations. Separate appeal retention policy remains legally unreviewed.
