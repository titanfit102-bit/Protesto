# Protesto: evidence provenance & citizen corrections

## Scope
Private-pilot functions; not a legally compliant news publishing system and not a whistleblower intake tool. All integration tests use fictional content.

## Source lifecycle
A reporter supplies a URL starting with HTTPS, a descriptive title, and 20–700 characters of context. The server validates, limits eight source records per pending case and stores \`submitted_by\`, \`created_at\`, \`state\`, \`reviewed_by\`, \`reviewed_at\` and \`review_note\`. The source starts as \`pending\`.

A *different* reviewer may mark a pending source \`accepted\` or \`rejected\`, with at least 20 characters of explanation. **New accepted decisions** require three explicit acknowledgments: the reviewer opened/inspected the link, checked privacy concerns, and checked title/URL/public fields before publication. The acknowledgments are appended to the private review note as \`SOURCE_CHECKS_V1\`; a rejection still requires an explanation but not acceptance checks. The case cannot be published until at least one source is accepted and the reviewer explicitly acknowledges the source/privacy/right-of-reply checklist. The acceptance is recorded in the internal audit trail.

Public case summaries expose a single accepted source URL; any further accepted sources are available through the public dossier sources API. Unreviewed links are not exposed on public routes. **Anonymous and non-privileged source-list responses omit the original \`context\` field and all submitter/reviewer identities or internal notes**; case authors and authorized reviewers can inspect the original context. Reviewers must separately assess titles and URLs for personal information, as these remain visible publicly. Older accepted source records predate the new attestation: the new policy does not retroactively certify them.

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
- Human checklist flags are recorded declarations, not proof that a link is safe or contains truthful information. Automated redaction is **not** implemented; published case descriptions, source titles and external URLs still require human privacy review.
- URLs may redirect to third-party destinations when the user opens them; no backend scraping.
- No automated false-claim detection or AI content analysis is deployed.
- Sensitive reporting requires separate expert-reviewed processes.

## Production gate
Before accepting real allegations, establish provenance, immutable document snapshots, redaction, corrections and public notice policy, rights-of-reply, review appeals, accredited moderators, records retention, and privacy/legal review.

## PDF fingerprint declarations — private pilot, phase 1
An authorized reviewer of an already-accepted source, while its case is still pending, can select a **local PDF up to 8 MiB**. Browser WebCrypto hashes the bytes with SHA-256, and sends **only** the 64-character digest and byte length to PostgreSQL. PDF contents are neither uploaded to Protesto nor retrieved by its server. The local client checks only the `%PDF-` prefix, not the full PDF grammar; the API validates the metadata and reviewer declarations, not the bytes themselves.

The declaration is kept in `source_fingerprints` (migration 008) along with the reviewer and creation time. A unique source ID prevents duplicate declarations; a database trigger prevents modifications to existing rows. Authorized retention-based deletion is still possible; this is **not WORM storage or independent timestamp notarization**. The audit records `source.fingerprint.declared`. Only the original case author and reviewers can read the digest via `GET /api/dossiers/:caseId/sources/:sourceId/fingerprint`; unrelated visitors cannot. This endpoint has no external network fetch and does not publicize files or the digest.

**Limitations:** an editor can submit a false digest or compare the wrong file; the system does not establish original authorship, publisher identity, factual accuracy, verified chain of custody, independent notarization, document signatures or enduring access to the original PDF. Existing sources need not have fingerprints, and the new declaration is optional for pilot publication. Human reviewers must separately retain their legally vetted evidence according to an approved retention/redaction policy, which does **not** exist yet. No real sensitive/whistleblower documentation is authorized.

Public release gate remains **OPEN** pending privacy, GDPR, legal and independent editorial/security review.

## Independent local comparison of a reviewer declaration
After a source fingerprint has been recorded, a reviewer may select the same or another PDF to compare its locally computed SHA-256 with the stored declaration. Both match and mismatch are reported explicitly. No PDF bytes are transmitted; no external trust anchor, publisher certification or original-file custody is established. This is **content equality only**, not proof of provenance.

## Citizen responses (experimental, not legal right of reply)
Authenticated pilot users other than the case author can submit one private response per published dossier. A separate reviewer (neither respondent nor case author) can accept or reject it; acceptance requires a **distinct redacted public copy** and explicit privacy review. The public endpoint exposes only that reviewed text and dates, never identity or raw submission. No institutional identity verification, formal service timeline, legal right-of-reply delivery, or arbitration exists. Do not label these unverified accounts as officials.
