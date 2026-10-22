# Protesto — instructions for coding agents

Scope: **only** titanfit102-bit/Protesto. Treat this repository as a politically nonpartisan, privacy-first civic accountability project.

## Read first
- README.md
- docs/MASTER_BLUEPRINT.md
- docs/DECISION_LOG.md
- docs/RELEASE_GATES.md
- docs/STATUS.md
- .github/workflows/verify.yml

## Workflow
- Work only in an explicitly authorized feature/experiment branch, never commit to main or deploy.
- Read existing architecture and tests before changing code. Prefer small, independently testable changes.
- Explain plan and files to be changed before implementation; keep changes within the authorized task.
- Open a draft pull request, retain CI logs, report failing tests faithfully. Never auto-merge.
- For code changes run npm run verify, and the relevant E2E, PostgreSQL and security checks as applicable.
- Do not alter auth, evidence, moderation, privacy, backup, deployment or permissions without explicit authorization and review.
- No new third-party service, secret, runtime cost, or external transmission of project data without explicit approval.
- Never insert secrets, personal data, real allegations, identifiable participant data, or political-preference profiles into prompts, code, CI logs, issues, or demos.

## Product requirements
- Apply identical standards to all institutions and political groups; do not build partisan persuasion, targeting, propaganda bots, attendance tracking, doxxing, or covert monitoring.
- Preserve separate browser demo vs private PostgreSQL pilot. Use only synthetic test records.
- Publication needs independent evidence and human editorial review; a green CI build never authorizes a public release.
- Do not copy third-party source without license review and compliance, including Polis AGPLv3.
- Public deployment, production secrets, real civic submissions, and merge to main require separate owner approval.

## Pilot objective
Test that OpenCode can run in a GitHub-hosted CI environment, then later evaluate a narrowly scoped read-only code review only after an AI provider is explicitly configured. The initial smoke test deliberately does **not** call any AI model.
