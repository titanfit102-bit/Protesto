# Protesto — Architecture Decision Record

| ID | Decision | Why | Revisit when |
|---|---|---|---|
| ADR-001 | Two modes: browser demo and private PostgreSQL pilot | Isolate presentation tests from sensitive multi-user work | Public release plan |
| ADR-002 | Native ES modules and CSS (no UI framework initially) | Avoid unnecessary complexity until workflows are validated | Accessibility/browser scale |
| ADR-003 | Demo records are exclusively fictional and local | Prevent publication of unreviewed allegations | Pilot policy reviewed |
| ADR-004 | PostgreSQL with parameterized queries | Transactional editorial workflow and audit | Measured database limitations |
| ADR-005 | scrypt hashed passwords, opaque sessions, strict cookies and CSRF guard | Defend initial private identity boundary | External security audit |
| ADR-006 | No public registration; operator provisions accounts | Prevent anonymous spam during pilot | Reviewed abuse and signup policy |
| ADR-007 | Independent reviewer decision and retraction | Prevent immediate unverified publication | Mature editorial organization |
| ADR-008 | Civic initiatives and gatherings require same moderation | No automatic mass publication; privacy for gatherings | Legal review |
| ADR-009 | No attendee lists or political preference profiling | Minimize sensitive data and safety risks | Do not change without expert review |
| ADR-010 | AI integration deferred until provenance and editorial verification | Avoid fabricated or misleading claims | Evidence pipeline proven |
| ADR-011 | Work on feature branch and Draft PR | Owner retains control of merge/production | Explicit owner approval |
| ADR-012 | Source links are separately reviewed before case publication | Prevent unreviewed evidence links being displayed as verified | Provenance and archived snapshots |
| ADR-013 | Citizen corrections can cause case withdrawal, never silent editing | Preserve accountability and auditability | Public correction ledger and appeal policy |
| ADR-014 | End-to-end Chromium test runs against disposable database | Verify the actual browser workflow, not only API mocks | Multi-device QA |
| ADR-015 | Versioned transactional SQL migrations with checksum verification | Prevent silent schema drift and partial migrations | Multi-database upgrade requirements |
| ADR-016 | Separate liveness and database readiness endpoints | Do not claim healthy operation when database is unavailable | Metrics and alerting design |
| ADR-017 | Authenticated export of own data only | Early privacy-by-design and user access; no other users' data | Full deletion/export rights and GDPR review |
