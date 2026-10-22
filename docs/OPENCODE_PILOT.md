# OpenCode integration pilot — Protesto

**Scope:** `experiment/opencode-pilot`, branched from `feat/protesto-foundation`. The production branch `main` is unchanged. Draft PR: https://github.com/titanfit102-bit/Protesto/pull/3

## Phase A — GitHub-hosted CLI smoke — VERIFIED

- `.github/workflows/opencode-smoke.yml` uses standard `ubuntu-latest`.
- Installs OpenCode without provider API keys; verifies CLI and existing static project check.
- GitHub Actions run [39756916408](https://github.com/titanfit102-bit/Protesto/actions/runs/39756916408) PASSED.
- Repeat smoke on commit `f4890e8a6782c46f8bb861ae26b069be44557694`: [39758318474](https://github.com/titanfit102-bit/Protesto/actions/runs/39758318474) PASSED.

## Phase B — FREE read-only AI test — VERIFIED

- `.github/workflows/opencode-free-analysis.yml` runs only for the named experimental pull-request branch and repository owner.
- Permissions: GitHub `contents:read`; checkout does not persist credentials; OpenCode tools `read`, `glob`, and `grep` only; explicit denial for all other tools; agent `plan`.
- No provider key was configured. OpenCode dynamically listed free models and chose `opencode/glm-5.3-flash-free`.
- Agent read `AGENTS.md`, `README.md`, `package.json`, and `docs/RELEASE_GATES.md`; reported modules, two release risks, and a next-task suggestion in Albanian.
- [GitHub Actions run 39758318564](https://github.com/titanfit102-bit/Protesto/actions/runs/39758318564), commit `f4890e8a6782c46f8bb861ae26b069be44557694`: COMPLETED SUCCESSFULLY. Workflow confirmed no tracked-file modifications.
- Output artifact `OpenCode-free-analysis` (7-day retention) contains the model list and agent transcript. Full run logs also show actual OpenCode file-read tool calls.
- No metered provider API key or model charges were required for this test, subject to OpenCode's changing free model availability/rules.
- Model summaries are not independent audit certifications. Agent findings must be reconciled with current implementation before making decisions.

## Phase C — Autonomous coding test — NOT YET ENABLED

Proposed narrowly scoped task: add isolated **domain-validation unit tests only**, using synthetic data; do not modify `src/`, server, auth, secrets, schema, or any production code.

Next steps require an explicitly authorized coding task and a tightly restricted workflow. Generate proposed changes on the ephemeral runner first; upload patch/artifact; run `npm run verify` (and broader tests as required); review the resulting diff before any GitHub commit. Keep PR draft, never auto-merge or deploy.

**Important:** OpenCode comment commands on GitHub normally need a default-branch workflow with appropriate tokens. This pilot deliberately avoids `main` and uses a read-only PR-triggered workflow instead; comment-triggered development and unattended multi-task orchestration are not enabled.

**Safety:** No real user data, political preference tracking, accusations, public civic intake, or production deployment in this prototype.

## Phase C — guarded coding queue (VERIFIED 2026-10-22)

The prior header "NOT YET ENABLED" above is historical; this update supersedes it for **bounded, synthetic** work. The original test-only queue created [Draft PR #7](https://github.com/titanfit102-bit/Protesto/pull/7). The guarded V2 queue then generated a new **pure dialogue aggregate statistics module** and native tests, independently checked by [Actions #39768946834](https://github.com/titanfit102-bit/Protesto/actions/runs/39768946834), and published only [Draft PR #9](https://github.com/titanfit102-bit/Protesto/pull/9). No merges, deployments or existing application edits.

Current implementation: tools/opencode-real-runner.mjs, tools/opencode-real-publish.mjs and .github/workflows/opencode-approved-queue.yml. Full operating manual and limits: docs/OPENCODE_TASK_QUEUE.md.
