# Protesto — Dialogu Qytetar (Polis-inspired design study)

**Scope:** original Protesto implementation, private synthetic pilot only.
**Reference:** https://github.com/compdemocracy/polis (default branch edge when studied on 2026-10-22).
**Original source-code reuse:** NONE. Do not vendor, transplant or copy Polis code, assets, datasets or branding without formal licence review.

## What was learned from Polis
Polis enables participants to consider statements and register agree/disagree/pass responses; its analytical pipeline can then identify clusters and areas of cross-group agreement. Polis describes PCA projections, k-means clusters, representative statements, routing priorities, statistical consensus and moderated statements. Its architecture is substantially more complex than the present Protesto pilot.

Key references:
- https://github.com/compdemocracy/polis
- https://github.com/compdemocracy/polis/blob/edge/delphi/docs/deep-analysis-for-julien/01-overview-and-architecture.md
- https://github.com/compdemocracy/polis/blob/edge/delphi/docs/topic-moderation-system.md
- https://github.com/compdemocracy/polis/blob/edge/docs/export-format.md
- https://github.com/compdemocracy/polis/blob/edge/LICENSE

## Product difference
Polis emphasizes deliberation and analysis of perspectives. Protesto links dialogue to a separately verified public civic case and accountability history: case -> moderated statement -> independent review -> participation -> aggregate summary -> documented institutional follow-up (future). No party-based targeting, persuasion scoring, individual ideology inference, attendance tracking or voter profiling.

## Implemented V1: moderated dialogue with privacy gating
- Reviewer opens a neutral topic referencing a PUBLISHED civic case only.
- An authenticated citizen may submit up to three statements per topic per day (25–360 characters); each is PENDING until accepted by a different reviewer.
- Approved statements invite agree / disagree / pass. A participant must actively acknowledge the privacy notice, and may amend a response until topic closure.
- Individual votes are stored under a statement-specific HMAC of the account ID. This is **pseudonymous, NOT anonymous**. A distinct long secret is required. A database operator who controls the key and account IDs can still correlate identity with votes.
- **No live tallies, group data, political labels or participant-level exports.** Topic closure finalizes counts only for statements with at least 10 distinct respondents, deletes all individual vote rows for the topic in the same transaction, and records an audit entry. Smaller groups never have their totals shown.
- If a case stops being published, associated topics are no longer accessible publicly, but this is not an automatic erasure or retention purge.
- This is a voluntary self-selected group, NOT a representative survey of Albania or any municipality.

## API summary
| Method | Path | Audience |
|---|---|---|
| GET | /api/dialogue/topics | Public topics attached to published cases |
| GET | /api/dialogue/topics/:id | Public accepted statements and finalized privacy-gated aggregates |
| POST | /api/dialogue/topics | Reviewer/admin only |
| POST | /api/dialogue/topics/:id/statements | Authenticated; pending moderation |
| GET | /api/dialogue/review/queue | Reviewer/admin only |
| POST | /api/dialogue/statements/:id/review | Different reviewer from author |
| POST | /api/dialogue/statements/:id/vote | Signed-in user with active consent acknowledgement |
| POST | /api/dialogue/topics/:id/close | Reviewer/admin; transactional aggregation + deletion |

Existing CSRF and per-user write quotas apply. Schema: db/007_civic_dialogue.sql; API: src/server/dialogue.mjs; UI: src/pilot-dialogue.mjs.

## Verification
- Unauthorized, invalid and cross-origin writes rejected.
- Pending statements hidden; moderation cannot approve own statement twice.
- Explicit consent required; user may update answer before close.
- Open topics show no counts even after 10+ votes.
- After close, 11-response synthetic statement exposes only totals, while one-vote statement remains suppressed.
- Individual vote rows are gone after close; voting or submitting after closure fails.
- Archived parent case hides its topic from public API.
- Chromium lifecycle covers creating a topic, moderated statement, privacy acknowledgement, vote, closure and mobile accessibility smoke.

## Security, ethics and operational limitations
1. Political opinions may be sensitive personal data under GDPR. Establish lawful basis, notices, DPIA if required, data rights, safeguards for minors and independent legal review before handling real participation.
2. Pseudonymization does not equal anonymity. Backups may preserve individual vote records after deletion in the active database. Plan retention, restricted access, secrets rotation and backup lifecycle.
3. Controlled/duplicate accounts and biased recruitment can distort outcomes. Define an anti-sybil policy without disproportionate monitoring.
4. The threshold of 10 and closed-only publication reduce information disclosure but do not provide a differential-privacy guarantee.
5. Moderator independence and formal statement appeals, fair translations, public correction notices, notification SLAs and abuse escalation remain open.
6. No PCA, clustering, AI narratives or prediction are deployed; these need privacy and statistical review first.

## Staged follow-up
- V2 **partly implemented**: a read-only aggregate JSON report and pilot presentation/export for finalized >=10-response statements. Still missing: independently reviewed public correction history for dialogue, formal cross-group consensus evidence and institutional response tracking. No unsupported population claims.
- V3 (after privacy/statistics clearance): optional suitably anonymized clustering, transparent methodology, small-group suppression and independently evaluated source-cited AI.

## Licensing
Polis uses AGPLv3 with an additional permission in section 7. Copying or combining its code in network software can trigger obligations to release the corresponding source. This module was independently implemented using only general ideas from deliberation design. A legal license review is needed before any later literal source-code reuse. This document is engineering guidance, not legal advice.


### Implemented V2 slice: aggregate report (2026-10-22)

GET /api/dialogue/report returns only aggregated counts finalized at topic closure, from accepted statements linked to currently published cases. The JSON response carries a versioned format id, methodology, sample threshold and a prominent non-representative warning. No raw voting data, public identity, account labels or participant groups are exported. The pilot provides a JSON download and references the associated topic and its accepted source link when available. It does **not** calculate a Polis-style cross-group consensus measure or claim representation of the population.
