# PROTESTO — VERIFIED PROJECT STATUS

**Recorded:** 2026-10-21  
**Repository:** titanfit102-bit/Protesto (private)  
**Working branch:** feat/protesto-foundation  
**Review gate:** Draft PR #1; NO MERGE, NO PUBLIC DEPLOYMENT.

## Real project fingerprint
A neutral citizen reporting and peaceful participation platform. Current implementations: offline browser demo and *private* PostgreSQL pilot. The target product is larger than this pilot. The software must not be used as a covert political persuasion or voter-profiling instrument.

## Implemented and checked
- Responsive Albanian demo: civic cases, filters, initiatives, peaceful gatherings, local storage, JSON export and fictional examples.
- PostgreSQL pilot: manually provisioned accounts, reporter/reviewer roles, session cookies, CSRF headers and parameterized queries.
- Case evidence is pending until independently accepted. Case publication requires >=1 accepted source and a 3-part reviewer declaration.
- Corrections are privately submitted and reviewed; acceptance withdraws the published case with audit history.
- Civic initiatives and peaceful gatherings follow independent review and retraction paths. The system does not track attendees.
- Account holder can export own pilot data without credential hashes.
- Versioned checksum-verified SQL migrations, transactional execution and advisory lock.
- Separate liveness/readiness endpoints.
- Automated Node tests, PostgreSQL integration, and real Chromium browser E2E.
- **Verification evidence:** GitHub Actions run #39639281476 passed on code commit 82b5efa6c08f0bbb0e4d59af6e52b099f5c135be, including two migration executions and browser tests. Later changes to documentation alone do not constitute new functional verification.

## Maturity: separate dimensions
| Dimension | Evidence-based assessment |
|---|---|
| Implementation | Browser demo and major private pilot paths implemented; target platform incomplete |
| Verification | Unit + PostgreSQL integration + Chromium smoke E2E verified; external independent review absent |
| Release readiness | BLOCKED for public production |
| Professional maturity | Strong early code structure and traceable documentation; operations/legal controls incomplete |

## P0 release blockers
1. Legal/privacy review (including sensitive political information risks, moderation and user rights).
2. Formal independent editorial verification, source provenance, corrections, appeals and institutional right-of-reply process.
3. Encrypted durable backups with verified restore and documented retention/recovery objectives.
4. Operational safety: centralized rate limiting, MFA where appropriate, full incident response and independent security review.
5. Real browser accessibility tests, staged environment and production monitoring.
6. Explicit owner approval for merging or any public deployment. Financial charges require separate approval.

## P1 strategic product gaps
- Robust source ingestion with provenance and immutable archived snapshots.
- AI document analysis with citations, hallucination tests and human editorial control.
- Public request-to-information workflow and status audit trail.
- Geospatial problem visualizations with privacy safeguards.
- Pilot observation, real-user feedback and organizational governance.

## Next most useful engineering slice
Build and verify a safe backup/restore workflow in an isolated disposable database; add a real accessibility test and a corrections appeal/redaction workflow. Do not accept real whistleblower reports or launch publicly until the P0 release blockers are resolved.

## Operational restrictions
No merger to main, production modifications, public deployment, spending, or changes to other projects. Maintain a separate branch and PR evidence. Never claim 100% based on code or tests alone.

## Continuation: October 21, 2026 — encrypted recovery work

- Added streaming AES-256-GCM backup archive with random salt and nonce, and credentials passed as PostgreSQL environment variables rather than process command-line parameters.
- Added offline archive authentication, a fail-closed restore command restricted to empty test databases, PostgreSQL dump/restore parity integration test, tamper refusal test and protections against overwriting existing backups.
- Added CI step for automated restore drill and basic local crypto test results; **full database restore in the current revision remains unverified**.
- **CI BLOCKER:** GitHub Actions workflow runs #39643094795, #39642967274 and #39642685683 ended with no runner steps and no job logs; retry of #39643094795 also had `steps=[]`. This is consistent with a runner provisioning / account-quota problem, but the underlying cause cannot be confirmed from the accessible data. Prior success was run #39639604577, **before** these new backup features. Do not treat newer commits as CI-verified.
- Next priority: resolve GitHub runner provisioning, achieve a green encrypted restore drill, then establish recurring backups with documented retention, restore objectives and testing. There was no merge, production deployment or spending authorization executed.

## Follow-up: atomic archives and public status ledger — 2026-10-21

- Fixed backup publication to write encrypted ciphertext to a private temporary file, fsync it and publish with an atomic hard link. This refuses overwrites and prevents incomplete archives appearing under the final filename.
- Reproduced the repository crypto routines in an isolated Node 22 environment; **3/3 targeted crypto tests passed**: roundtrip/tamper/wrong-passphrase, connection environment parsing and interrupted/concurrent writers. This local test **does not** validate PostgreSQL restore.
- Added a nonidentifying public status ledger at `GET /api/public/ledger` (publication/retraction event type, case UUID and timestamp, no reporter identity, notes or archived allegations). Pilot page displays the ledger.
- Added PostgreSQL integration assertions for ledger privacy and Chromium end-to-end assertion for withdrawn entries. These new integration/E2E assertions remain **UNVERIFIED** while GitHub hosted runners are not allocated.
- Latest CI run #39653030671 failed before steps with no runner; previous successful full pipeline #39639604577 predates backup and ledger code. Never conflate local crypto verification with a full clean PR test.
- Still no public production deployment, merge, expenses or modifications to other projects.
