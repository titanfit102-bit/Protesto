# PROTESTO — Personal data retention / erasure register (P0 draft)

**2026-10-23, synthetic private pilot. Not legal advice or an approved retention schedule.**
Do not ingest live reports, turn on scheduled purges, send personal data to outside services or delete civic records based solely on this document.

## Known record categories / current status

| Data / storage | Identifiers and sensitivity | Current technical lifetime | Safe automated deletion? | Outstanding owner/legal decision |
|---|---|---|---|---|
| `sessions` | Hashed bearer token, account UUID, expiry | 8h authentication eligibility; expired rows persist until removed | **Only expired rows** in isolated CI rehearsal. No real-data job authorized | Production schedule and exception process |
| `request_rate_limits` | HMACed request identity key, counts, expiry | 15m/1h windows; expired rows persist until removed | **Only expired rows** in isolated CI rehearsal | Production TTL job, event-log treatment |
| `civic_users` | Email, salted password verifier, encrypted reviewer TOTP | No defined account deletion policy | **NO** | Account rights, legal retention, preservation of signed moderation |
| `civic_cases`, `case_sources`, `source_fingerprints` | Sensitive original allegation, locality, source URLs and hashes | No approved retention/deletion date | **NO** | Legal basis, right of reply, withdrawal/unpublication vs true erasure, backups |
| `civic_actions`, `action_reviews` | Event/peaceful-action content; editorial decisions | No approved policy | **NO** | Time limits, lawful archival, review evidence |
| `case_corrections`, `correction_appeals`, `retraction_history` | Disputes, appeals, originals, legal evidence | No approved policy | **NO** | Preservation and rights of participants/institutions |
| `case_responses` | Citizen-generated original and reviewed public statements | No approved policy | **NO** | Consent, erasure/redaction, source authenticity, institutional safeguards |
| `dialogue_topics`, `dialogue_statements`, `dialogue_reviews` | Views that may expose sensitive opinions, internal and public copies | No approved policy | **NO** | Legality, erasure/redaction vs continued aggregate reporting |
| `dialogue_votes` | Pseudonymous HMAC voter keys + choices | Individual votes are deleted on an approved topic close; unclosed topics retain votes | **NO additional deletion** until policy | Consent, max-open duration, abandoned topic closure, account unsubscription |
| `dialogue_results` | >=10-participant aggregates without individual vote keys | No approved expiry | **NO** | Statistical retention, reidentification and group-size safeguards |
| `audit_entries`, `review_history` | Reviewer actions/IDs, accountability trail | No approved expiry | **NO** | Legal hold, tamper protection, deletion/erasure reconciliation |
| Encrypted PostgreSQL archive / CI artifacts | Whole DB backups incl sensitive personal content | No live offsite retention policy. CI preview artifacts have 14d retention | **NO** | Restoration effects, secure deletion, offsite backups and lawful access |

## Scope of internal operational expiry proof

The tool `node tools/privacy-retention.mjs` is **read-only by default**: prints only counts of expired sessions and expired rate-limit rows; prints no identifiers or secrets.
The `--apply` option is **hard blocked** outside an explicitly approved, loopback-bound disposable **GitHub Actions synthetic rehearsal** (`PROTESTO_RETENTION_APPROVED=1`, CI staging/backup isolation flags and fixed test database/origin). It deletes only rows where `expires_at<=now()`, in bounded locked batches (max 1,000/category), and reports aggregate deleted counts. No scheduled task or live database cleanup is configured.
**Do not change the guard or enable production cleanup without separate review/owner approval.**

## Why automatic account/content deletion remains blocked

Civic cases and reviews have linked foreign keys, references and public/editorial histories. A naive `DELETE FROM civic_users` or content table mutation could violate referential integrity, conceal lawful public accountability records, compromise institutional appeal rights or leave sensitive content in backups. Likewise an account's pseudonymous votes cannot be safely mapped back for self-erasure from the current published API. Implementing legal data rights requires an independent legal/privacy decision, explicit data subject verification, retention exceptions, reversible internal workflow, protected reviewer approval and demonstrable backup erasure/expiry handling.

## Future acceptance evidence (none of this is automated yet)

1. Assign a legal/privacy owner; define per-category basis, purpose, retention period, legitimate exceptions and backup window.
2. Define request authentication/verification and data subject rights workflow; include third-party rights and appeal/hold review.
3. Specify removal/redaction propagation across originals, approved public copy, search/feeds, aggregates and backups.
4. Run independent abuse/threat/privacy review for sensitive civic allegations and political-opinion-like data.
5. Produce isolated synthetic PostgreSQL integration tests for expiration, legal hold, user ownership, repeat submissions and controlled recovery.
6. Obtain separate explicit owner authorization before any irreversible live-data deletion or retention schedule.

**Release gate: OPEN / NO-GO**. A passing operational cleanup test does not grant GDPR compliance or real-data processing authorization.
