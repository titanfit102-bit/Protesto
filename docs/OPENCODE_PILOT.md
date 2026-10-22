# OpenCode integration pilot — Protesto

**Scope:** experiment/opencode-pilot, branched from feat/protesto-foundation. The production branch main is unchanged.

## Phase A — GitHub-hosted CLI smoke, no AI credentials
- Open a draft pull request from experiment/opencode-pilot to feat/protesto-foundation.
- This triggers .github/workflows/opencode-smoke.yml using standard ubuntu-latest.
- The workflow installs the OpenCode CLI and confirms opencode --version, then checks the existing project.
- The workflow has only contents:read permission, does not call a model, does not run agent code or create commits, and should not incur model-token charges.
- Verify the green workflow run with its exact commit SHA before claiming Phase A passed.

## Phase B — AI agent, not enabled
Before enabling any model-backed autonomous execution:
1. Choose an AI model/provider and verify current pricing, usage caps and data-handling terms. OpenCode itself and AI inference are different services.
2. Provision provider credentials **only** through GitHub Actions secrets, never in commits or chat.
3. Review GitHub App / token permissions and trigger security for public-repo contributions. Never expose credentials to arbitrary pull-request code, untrusted users, or public issue comments.
4. Start with one narrowly scoped, explicitly authorized *read-only* analysis run. Keep tool permissions least-privilege.
5. Only after confirming output quality, set up an authorized branch-limited implementation flow with test gates, draft PRs and no automatic merge.
6. Never deploy or collect real personal/political data from this unaudited prototype.

**Important:** OpenCode's GitHub comment commands normally rely on a default-branch workflow and separate provider configuration. This experiment intentionally does not modify main; comment-triggered OpenCode and unattended multi-task orchestration are not active yet.

## Success criteria
- Phase A: a successful GitHub Actions run shows the OpenCode binary operating remotely with no personal PC required.
- Phase B: a separate authorized AI run provides useful scoped results, evidence of model calls, cost accounting, and safe permission boundaries.
- Do not confuse Phase A (CLI installation) with Phase B (autonomous development).
