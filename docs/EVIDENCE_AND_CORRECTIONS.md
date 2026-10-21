# Protesto: evidence provenance & citizen corrections

## Scope
Private-pilot functions; not a legally compliant news publishing system and not a whistleblower intake tool. All integration tests use fictional content.

## Source lifecycle
A reporter supplies a URL starting with HTTPS, a descriptive title, and 20–700 characters of context. The server validates, limits eight source records per pending case and stores \`submitted_by\`, \`created_at\`, \`state\`, \`reviewed_by\`, \`reviewed_at\` and \`review_note\`. The source starts as \`pending\`.

A *different* reviewer may mark a pending source \`accepted\` or \`rejected\`, with at least 20 characters of explanation. The case cannot be published until at least one source is accepted and the reviewer explicitly acknowledges the source/privacy/right-of-reply checklist. The acceptance is recorded in the internal audit trail.

Public case summaries expose a single accepted source URL; any further accepted sources are available through the public dossier sources API. Unreviewed links are not exposed on public routes.

## Corrections
Any authenticated pilot participant may submit a **non-public** correction request on a published case (30–2000 characters and optional HTTPS reference; up to five per user/day). A separate reviewer decides:
- **Reject**: case stays published, decision logged.
- **Accept**: case is archived (removed from current public listing), retraction note and audit entry created in the same DB transaction.

A public-facing correction history, formal dispute-resolution SLA, institutional authentication, appeals and impartial oversight do **not** exist. Do not present this workflow as a completed right-of-reply obligation.

## API summary
| Method | Endpoint | Access |
|---|---|---|
| GET | /api/dossiers/:caseId/sources | Public accepted sources for published cases; author/reviewer sees pending records |
| POST | /api/dossiers/:caseId/sources | Logged-in author; only while pending |
| POST | /api/dossiers/:caseId/sources/:sourceId/review | Reviewer; cannot review own case |
| POST | /api/corrections | Authenticated pilot user; published case |
| GET | /api/corrections/mine | Correction author |
| GET | /api/corrections/queue | Reviewer |
| POST | /api/corrections/review/:id | Reviewer other than correction author |

All POST requests require exact-origin validation and the custom request header; session cookie is HttpOnly/SameSite=Strict. Parameterized SQL and transactional state changes are used.

## Known trust gaps
- A checked URL is not a verified fact; links may change after review.
- No trusted document snapshot, hash verification, editorial attachment uploads, institution identity check or formal rebuttal.
- URLs may redirect to third-party destinations when the user opens them; no backend scraping.
- No automated false-claim detection or AI content analysis is deployed.
- Sensitive reporting requires separate expert-reviewed processes.

## Production gate
Before accepting real allegations, establish provenance, immutable document snapshots, redaction, corrections and public notice policy, rights-of-reply, review appeals, accredited moderators, records retention, and privacy/legal review.
