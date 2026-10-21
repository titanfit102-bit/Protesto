# PROTESTO — MASTER BLUEPRINT v0.2

## Problem
Fragmented civic complaints, poor documentation of official responses and inconsistent tracking of commitments. Goal: a neutral, independently reviewed evidence trail from report to institutional response and documented outcome. Protesto is not a partisan mobilization or persuasion tool.

## Core journeys
1. Citizen reports a problem with location, category and optional HTTPS source; it enters a pending queue.
2. Different accredited reviewer verifies available evidence and privacy/legal risks, then publishes or rejects with internal justification.
3. Public sees only published records. Reviewers can retract a published record, preserving internal audit.
4. Citizens can also submit initiatives and lawful peaceful gatherings. Those follow the same independent approval/retraction process, without tracking attendees.
5. Public documents, institutional answers and outcome history are a *future* stage, not implemented.

## Current architecture
- Browser-only demonstration: HTML/CSS/ES modules, fictional content, localStorage.
- Private pilot: same-site HTTP server, PostgreSQL 16+, parameterized queries, scrypt password hashing, hashed server sessions, role checks, exact-origin POST control and transactional review audit.
- `reporter` creates pending cases/actions; `reviewer` and `admin` review. No user can approve their own case/action.
- PostgreSQL migrations 001 (users/cases), 002 (retractions), 003 (initiatives/gatherings). Shared DB is used only by pilot.
- Frontend renders user input escaped. No attendee data or preference profiles are stored.

## Release scope
MUST for pilot: authenticated report submission, private draft review queue, safe public listing, approval and retraction, initiative/gathering parity, tests, documentation.
MUST for production: secure hosting, durable encrypted backups with restore proof, centralized anti-abuse, content review/appeals, legal/privacy assessment, user rights, observability and E2E/accessibility checks.
SHOULD after validation: evidence provenance, official source integrations, correction history, structured requests for information.
LATER: AI-assisted document analysis with citations and human verification; geographic issue map.
DELETE: covert campaigns, political microtargeting, participant geolocation, automated accusations, rage-optimized feeds.

## Product proof
- Case/action is never public before review.
- Authors cannot publish their own material.
- Review/retraction decisions update DB and audit in the same transaction.
- Authentication state is server-side and revocable.
- Untrusted data is escaped in displayed public content.
- No claims of "fully operational" without browser, security, legal and operational evidence.

## Current validation
Node domain/security suites and PostgreSQL integration tests run in GitHub Actions. These validate targeted API behavior, not full release readiness.

## Critical path from here
1. E2E browser verification of every form and role, independent security review.
2. Sources/document ingestion with immutable identifiers, provenance, editor tools and public correction/right-of-reply workflow.
3. Professional identity, abuse defense, consent/deletion and policy implementation.
4. Backup/restore drills, staging, monitoring, privacy and legal compliance gates.
5. Closed pilot with real editorial staff; explicit owner approval before any public deployment or main branch merge.

See `docs/RELEASE_GATES.md` for complete criteria. Prototype completion is not product completion.

## Implementation delta: evidence and citizen corrections (v0.3)

- Schema 004: traceable \`case_sources\` (pending/accepted/rejected), \`case_corrections\` (pending/accepted/rejected).
- Initial case URL automatically creates a pending source; the author can supply additional links with context.
- Reviewer accepts/rejects a source with a recorded reason. Publication requires >=1 accepted source and explicit editorial checklist flags.
- Public case summaries expose an accepted source only, not the reporter's unreviewed link.
- Citizen correction request is non-public and independently reviewed; acceptance withdraws the published case transactionally with audit record. Rejections leave the publication intact.
- Browser E2E tests cover reporter → source review → publication → correction → retraction and demo search/local storage.
- More source provenance, public correction notices, appeals and independent oversight remain mandatory production gates.

### Decision rule
A reviewer checkbox proves acknowledgement, **not** truthfulness of a claim. This pilot must not be used for sensitive accusations without independent editorial policies and legal/privacy review. No external document fetching or AI fact assertions are in service.
