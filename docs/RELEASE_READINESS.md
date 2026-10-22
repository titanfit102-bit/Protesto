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

## Public dialogue report and reply privacy review (2026-10-22)
A code audit identified the aggregate report exposing original `civic_cases.title` and `case_sources.url` despite separate approved public copies. The report now selects approved `civic_cases.public_title` and `public_source_url`, requires an accepted source with matching approved URL, and applies the shared URL validator. Dialogue topic and citizen-response routes withhold legacy cases missing approved public text. Tests include a private synthetic title and query-token link. This is a scoped internal code review, not independent security certification; accepted dialogue text still requires human privacy review. Production remains blocked.

## Public case area redaction — security follow-up
The public cases API still read `civic_cases.area` (original reporter-supplied free text). Because this can encode private street addresses, migration 014 creates `civic_cases.public_area`; case publication requires a separate reviewed public location string (2–80 chars). Public cases and secondary routes use the approved field only and withhold historic records without it. Test fixtures explicitly insert a synthetic PRIVATE apartment area and confirm the response uses the redacted public value instead. No auto-PII detector, verified geolocation, legal/privacy certification or production release is implied.

## Dialogue topic and statement privacy gate (2026-10-22)
Internal audit found public topic title/description and moderator-accepted citizen statement bodies were being projected directly from unredacted input. Migration 015 preserves originals and adds separately approved topic `public_title/public_description` and statement `public_body`. Topic creation by an authorized reviewer now explicitly requires separate reviewed text and privacy confirmation; a statement needs independent human moderation, a distinct public body and explicit privacy confirmation. Anonymous topic lists, topic detail, votes and final aggregate reports only operate on approved public fields, and historical entries lacking public approval are withheld rather than backfilled. Reviewers retain access to original drafts in protected queues. This does NOT provide machine-proof PII detection or an independent second reviewer for editor-created topics. All production legal/privacy/security gates remain blocked.

## Dialogue topic independent review — migration 016
Draft topic creation does not constitute publication. A second authorized reviewer, distinct from both the proposing reviewer and parent case author, must explicitly approve the final edited public copy and confirm privacy/copy checks. The database stores one review status with reviewer, timestamp and justification; only approved topics can receive citizen statements, votes and public aggregation. Rejected or preexisting unapproved topics remain withheld by default. Approval endpoints are protected by role checks, parent-case locks, conflict-of-interest checks and a single pending→decision transition with audit. No full institutional attestation, legal launch authorization or production readiness is inferred.

## Atomic parent-case and source review serialization (security audit)
The case source approval SQL previously used `UPDATE case_sources ... FROM civic_cases` while merely reading `c.state='pending'`, without locking the case row. A concurrent case publication/rejection could invalidate the checked state while a separate source review committed. Source review now obtains a transaction-held lock on the **parent case and source** before checking both states and reviewer independence; case review obtains a parent-case lock **before** evaluating accepted sources and changing state. A PostgreSQL integration regression intentionally holds the parent lock during a pending source review and changes the parent state, requiring HTTP 409 and no source/audit mutation. These changes are narrowly scoped internal controls; further cross-route concurrency analysis and independent security review remain P0.

## Dialogue parent-case concurrency guards (internal review)
The statement moderator previously issued `UPDATE dialogue_statements ... FROM dialogue_topics/civic_cases` while merely reading parent state. Topic closure and case archival could interleave with that decision. The moderator now locks the parent case, topic and statement for its entire decision/audit transaction. Topic closure locks the case and topic before calculating results and deleting votes; votes and new statements lock their case and topic during the operation. New SQL/API regression tests hold parent locks across concurrent HTTP requests, mutate parent state, and assert HTTP 409, no late editorial decisions, vote rows or published tally. Locks close a scoped TOCTOU gap, not every possible cross-module race; release stays blocked pending independent review.

## Atomic correction and response submissions (internal concurrency audit)
Citizen responses and correction requests previously checked the case's published state outside the write transaction. When case withdrawal raced the subsequent INSERT, pending records could be created after the case was archived. Both submission flows now lock their parent case through the insert transaction and refuse a no-longer-published case with HTTP 409. Corrections additionally use a transaction-scoped per-author PostgreSQL advisory lock so six parallel requests to different cases cannot bypass the five-per-24-hour submission limit. Public response reads filter the case's current state in the response projection, rather than trusting a stale precheck. Synthetic integration tests exercise both parent archival races and the concurrent author quota. These are scoped protections; formal independent review and public release gates are still required.

## Remaining author quota races and parent archival (internal audit)
Author-wide quotas for actions (6/hour), dialogue topic proposals (5/day) and correction appeals (3/day) previously used unprotected COUNT/INSERT pairs. Draft PR #53 adds scope-separated PostgreSQL transaction-scoped author advisory locks to serialize these checks across workers and cases/corrections; creation is committed in the same transaction as the count. Topic creation also locks its parent civic case before verifying publication; appeal creation locks the parent case and rejected correction before checking they are still eligible. Concurrent database/API regressions protect both rate limits and parent archival state. This is a scoped technical fix, not independent security, editorial or legal certification.

## Secondary public source route status consistency (2026-10-23)
An internal cross-route privacy audit found `GET /api/dossiers/:id/sources` permitted anonymous source metadata on a legacy published case even when `public_description` was missing, although `/api/public/cases` withheld that case. It also made an unguarded second SQL read, potentially returning public source metadata after another request had archived the case between the eligibility check and source fetch. Both the initial eligibility check and the source SQL projection now enforce **all** approved case publication fields and published status. A dedicated PostgreSQL/API regression seeds redacted and private source metadata, checks legacy-withheld and owner-authorized behavior, and deterministically archives the case between the two SQL reads to show no public source data escapes. Internal verification only; audit/legal/release gates unchanged.
