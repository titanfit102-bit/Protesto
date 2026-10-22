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
| ADR-018 | AES-256-GCM stream-encrypted PostgreSQL custom archives and guarded isolated restore | Avoid plaintext backups, add tamper authentication, preserve preexisting archive files and require restore proof | Production secrets management and offsite retention |
| ADR-019 | Fail closed on GitHub Actions runner provisioning failure | Tests did not execute; do not falsely mark integration verification green | Runner provisioning recovered and full drill passes |
| ADR-020 | Atomic publication of completed encrypted archives using a temporary file and hard-link | Crash-safe visibility and never overwrites a previous backup | Filesystems without hard-link support require separate audited strategy |
| ADR-021 | Public ledger exposes UUID, event type and timestamp only | Provide accountability for withdrawals without republishing contested claims or sensitive identities | Public corrections/appeals policy reviewed |
| ADR-022 | One-time appeal of rejected corrections, decided by independent second reviewer | Preserve original decision and reduce unilateral moderation mistakes | Formal appeals policy and due-process review |
| ADR-023 | Central atomic PostgreSQL counters using HMAC identity keys | Prevent per-instance throttling bypass and avoid storing raw IP/email in quota table | Gateway abuse prevention, distributed scale, data retention |
| ADR-024 | Deliberation based on verified civic cases and independent statement moderation | Keep discussions grounded and prevent automatic public allegations | Full independent editorial governance |
| ADR-025 | No real-time counts; show finalized totals only when 10+ responses | Reduce exposure and participant bandwagon effects without implying anonymity | Formal privacy/statistical review |
| ADR-026 | Store keyed per-statement vote pseudonyms, then purge vote rows on closure | No plaintext participant ID in vote table and no ongoing post-close individual responses | Backup retention and data rights |
| ADR-027 | Original code inspired only by Polis concepts; no AGPL source-code reuse | Keep IP/licensing obligations explicit | Any later source-code integration requires legal review |

## 2026-10-22 — Integrated release gate
Decision: keep PR #34 through #42 in a stacked, reviewable Draft chain without merging. GitHub Actions validates software behavior but does not authorize Production. The release gate in `src/ops/release-gate.mjs` is fail-closed even if hypothetical manual flags are supplied. External P0 risks, legal governance and owner release authorization remain separate requirements. Do not use OpenCode or modify other projects.
