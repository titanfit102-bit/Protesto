# Protesto OpenCode — approved sequential task queue pilot

## Isolation and scope
Repository: `titanfit102-bit/Protesto` (public).
Controller PR: [#3](https://github.com/titanfit102-bit/Protesto/pull/3), branch `experiment/opencode-pilot`, target `feat/protesto-foundation`.
Do not merge controller PR or publish the civic platform as part of this experiment.

## The pilot's task queue
`automation/opencode-approved-tasks.json` holds at most two **individually pre-authorized** synthetic-data test tasks per pilot run. The final verified pilot used a single `filter-final-e2e` task.
Only the repository owner's experiment PR can activate this workflow. A changed queue alone does not constitute authority for changing production files.
Changing task entries requires a separate explicit task authorization.

## Execution protocol
1. On an owner-authored PR update, a lightweight guard checks whether the **latest commit** changed `automation/opencode-approved-tasks.json`. Only an approved queue change can start AI generation; ordinary documentation/workflow edits do not.
2. An isolated, read-only-token generator installs OpenCode, chooses an available `opencode/*-free` model, and runs tasks **one after the other**, each with a narrow file-write allowlist.
3. Only new `test/opencode-<task-id>.test.mjs` files are permitted. No edits to existing tracked files, deployment, shell/network access by the agent, real data, or provider credentials.
4. The generator independently checks the output, installs test dependencies without a lockfile change, migrates a disposable PostgreSQL database, and runs `npm run verify` after **each** task.
5. Generated sources, transcripts, hashes and test logs are uploaded as a 7-day Actions artifact, even if a task fails. The generator's `GITHUB_TOKEN` has only contents:read.
6. A **separate job** with `contents:write` and `pull-requests:write` verifies artifact hashes and target branch SHA, creates one isolated branch for each task, writes only its test file, and attempts to open **draft PRs** against `feat/protesto-foundation`.
7. Stable per-task branch names make reruns idempotent. No automatic merge, production deployment, approval, release, or changes to main.

## Permissions / possible blocker
GitHub may forbid Actions from creating Pull Requests until the repository owner enables:
`Settings -> Actions -> General -> Workflow permissions -> Allow GitHub Actions to create and approve pull requests`.
Enable only if comfortable with repository-wide implications; **do not change this setting silently**.
If blocked, the generator artifact still contains the verified code. The publisher may have created a test-only branch before PR creation was denied. No automatic retry to replace an existing branch.
The GitHub-generated PR may not trigger other Actions workflows automatically (events made with `GITHUB_TOKEN` are suppressed). The isolated generator is the verification evidence. Human review and additional CI are required before merging.

## Current operational boundary
This is a pilot, not a general unsupervised agent system or proof of production readiness. The queue currently contains one deliberately safe test task; it is not a durable multi-user backlog. Extending it to backend, moderation, auth, security, personal data, or deployments requires stronger policy controls and explicit human authorization.

## How to inspect results
From controller PR #3 -> Checks -> `OpenCode approved task queue`. Check the run summary, artifact `Protesto-OpenCode-Queue-Proposals`, individual task verification logs and links to each draft PR. Treat agent claims as unverified unless validated by independent test output.

## 2026-10-22 — cleanup of historical pilot workflows
- Kept `.github/workflows/opencode-approved-queue.yml` as the only automatically triggered **OpenCode** task workflow on `experiment/opencode-pilot`.
- Preserved `.github/workflows/verify.yml` (the independent Protesto verification workflow).
- Converted four obsolete workflows to `workflow_dispatch` without `pull_request` triggers: `opencode-smoke.yml`, `opencode-free-analysis.yml`, `opencode-coding-pilot.yml` and `opencode-pr-permission-check.yml`.
- Historic run logs, artifacts, and draft PRs were not deleted. A red symbol on a **past** run stays visible and does not imply the latest controller is broken.
- Because GitHub PR `paths` checks the **cumulative PR diff**, the controller now has a cheap `detect-approved-queue-change` gate. Agent generation only starts when the latest head commit changes the approved task JSON. No ongoing controller job is intentionally cancelled by future PR synchronizations (`cancel-in-progress: false`).
- GitHub concurrency still does **not** provide a lossless, persistent backlog when many updates arrive; do not treat this prototype as an unattended queue of arbitrary new tasks.
- Changes affect only `experiment/opencode-pilot`, not `main`, `feat/protesto-foundation`, deployment, or product logic. Full end-to-end proof remains [Actions #39764186471](https://github.com/titanfit102-bit/Protesto/actions/runs/39764186471) with [Draft PR #7](https://github.com/titanfit102-bit/Protesto/pull/7).
