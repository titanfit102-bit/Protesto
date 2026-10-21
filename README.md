# Protesto

**Protesto** is a politically nonpartisan, privacy-first civic accountability project with an Albanian interface. It includes a fictional browser demonstration **and** a separate PostgreSQL-powered **private pilot** for reviewed civic submissions. Neither is an approved public production deployment.

## Modes

### A. Browser demonstration (no database)
Requires Node.js 22+. Run:

    npm run dev

Open http://127.0.0.1:4173. The demo features reports, filters, initiatives, peaceful gatherings, local browser storage, JSON export and fictional example records. It never submits data to a server.

### B. Private pilot (PostgreSQL)
Requires Node.js 22+, PostgreSQL 16+ and a **new isolated database**. Configure `DATABASE_URL` and `APP_ORIGIN` outside version control, then:

    npm install --no-audit --no-fund
    npm run db:migrate
    npm run db:user -- reporter@example.org reporter
    npm run db:user -- reviewer@example.org reviewer
    npm run pilot

For the user-provisioning commands set `PROTESTO_NEW_PASSWORD` securely in the process environment (12+ characters, different per user); never commit or paste secrets into chat. Open http://127.0.0.1:4174/pilot.html. See [operations](docs/OPERATIONS.md).

**Private pilot supports:** login using provisioned test accounts, case reports, initiatives, peaceful gatherings, PostgreSQL storage, an independent reviewer role, pending moderation, publish/reject, publication retraction and internal audit entries. All mutating operations require same-origin requests; no attendance tracking is collected. Publishing is blocked until an authorized reviewer approves a report, and reviewers cannot approve their own content.

## Verification

    npm install --no-audit --no-fund
    npm run verify

For PostgreSQL integration tests export `DATABASE_URL` and run migrations first. Pull requests run CI with a disposable Postgres 16 database. Do not treat passed automated checks as a security certification or real-user acceptance.

## What is still missing

- External browser E2E checks, accessibility audit and mobile device acceptance.
- Production identity, MFA, account recovery, email verification and centralized rate limiting.
- Formal editorial source-verification, redaction, corrections, appeals, and institutional right-of-reply.
- Document evidence storage, government data connectors, AI provenance pipeline and false-claim evaluation.
- Operational backup with restore proof, monitoring, privacy/legal review, incident response, operational ownership and scalable deployment.
- Public launch consent, domain configuration and separate authorization for merging the PR.

**Never submit sensitive personal information, confidential whistleblower content, allegations about private people or political preference data** to this unaudited prototype. The private pilot is for synthetic/test material only.

## Structure

    index.html + src/app.mjs       browser-only demonstration
    pilot.html + src/pilot.mjs     authenticated private pilot interface
    src/domain.mjs                 input validation and pure rules
    src/server/app.mjs             PostgreSQL API, login, cases, audit
    src/server/actions.mjs         moderated initiatives and gatherings
    src/server/security.mjs        password/session/CSRF helpers
    db/*.sql                       ordered idempotent pilot migrations
    test/*.test.mjs                unit, security and integration tests
    docs/*                        blueprint, operations and release gates

## Governance and safeguards

Apply the same standards to every political party and government. Only nonviolent lawful civic organization; no propaganda bots, individualized political targeting, gathering participant lists, doxxing or automatic accusations.

**Repo policy:** Changes remain on `feat/protesto-foundation` as draft PR. Do not merge into `main` or publicly deploy without the owner's separate approval.
