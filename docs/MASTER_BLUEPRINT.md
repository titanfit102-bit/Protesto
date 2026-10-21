# PROTESTO — MASTER BLUEPRINT v0.1

## Mission
A politically independent civic platform that makes public-interest problems traceable through reporting, independent verification, source evidence, requests for information, official responses and outcomes. Peaceful gatherings and lawful participation are supported without profiling political beliefs.

## Prototype scope
- Overview dashboard with fictional seed data
- Civic case reporting, search and filters
- Local initiatives
- Peaceful gathering listing and local creation
- Input validation, local browser persistence and export
- Static development server and unit tests

## Strictly excluded from prototype
- Public submissions, public alerts or messaging
- User identities, voting preference collection or gathering attendance lists
- Unverified real allegations
- AI generated accusations
- Petitions with actual signatures
- Institutional API integration
- Background geolocation

## Next gates
G1 browser E2E and accessibility testing
G2 backend architecture with PostgreSQL, authorization and auditable moderation
G3 lawful data sourcing, proof management and right-of-reply workflow
G4 security and privacy review including GDPR applicability
G5 private pilot and release readiness review

## Proof of completion
A feature is complete only when code, tests, target environment and risks are verified. Prototype completeness is not equivalent to platform production readiness. No merges or public launch without owner authorization.

## Initial product flows
1. Citizen opens demo and reads a clearly fictional report.
2. Filters reports by status or category.
3. Adds a local report with metadata and optional HTTPS evidence link.
4. Adds a local initiative or peaceful gathering.
5. Exports local data, resets to fictional seed state.

## Technical architecture
Static HTML, CSS, JavaScript ES modules; domain validation separated from the UI; localStorage as non-durable prototype persistence only; Node local server with restrictive security headers. This is not a collaborative database.

## Next production baseline
Modular backend with Postgres, role-based authorization, review queue, content appeal / correction flow, document ingestion with provenance, observability, rate limits, backup and restore drill. Select stack after first pilot evidence.
