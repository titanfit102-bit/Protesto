# Protesto — OpenCode + GitHub Actions, guarded development queue V2

**Scope:** public code repository `titanfit102-bit/Protesto`. This is an experimental controller on `experiment/opencode-pilot` (draft PR #3), targeted only at the existing development branch `feat/protesto-foundation`. Never write `main`, deploy Production, or merge without explicit owner approval.

## Roles and source of truth

- **User:** assigns feature goals and approves eventual merge/publication separately.
- **ChatGPT architect:** reviews backlog, dependencies, data privacy, acceptance criteria, source of truth, generated PRs and tests; appends approved tasks to Git-tracked `automation/opencode-approved-tasks.json`.
- **OpenCode:** writes only the explicitly allowlisted new files in a temporary runner, using one dynamically detected free `opencode/*-free` model. Model availability may change; do not enable paid API keys without explicit authorization.
- **GitHub Actions:** runs OpenCode without GitHub write credentials, checks file paths/allowed imports/safety rules, runs project CI on disposable synthetic PostgreSQL, then hands verified artifacts and SHA-256 hashes to a **separate privileged publisher**.
- **Publisher:** refuses any mismatch or stale base branch and creates **draft PRs** into `feat/protesto-foundation`. It cannot merge or deploy. `GITHUB_TOKEN`-authored PRs may not trigger standard PR Actions automatically; the generator CI is the initial independent evidence.
- **GitHub Issue #8:** architectural milestone and limitations, **not** a replacement for the Git task queue.

## Durable queue contract

- V2 `automation/opencode-approved-tasks.json` is the versioned, ordered source of approved tasks, limited to at most 200 historical task records. Do **not** remove or rewrite active/historical tasks while a job is running.
- Each record has stable `id`, `status` (`approved` / `paused`), `kind` (`tests` or `pure-module`), and a precise, synthetic-data-only `brief` (100–1800 characters).
- A task ID maps to a stable output branch `opencode/pilot-<id>`. An existing branch is a durable **do-not-republish** marker; check its associated PR before considering it completed or mergeable.
- A run takes an **immutable commit snapshot** of the controller and scans the full queue for approved tasks lacking their own branch, not merely latest-commit diff. GitHub can replace a queued PR workflow event during rapid edits; the newest snapshot still includes all appended approved tasks.
- `concurrency.cancel-in-progress: false` prevents stopping the active job; GitHub permits only one running and one queued workflow per concurrency group. The system is not a 24/7 worker.
- One run executes at most **four new tasks sequentially** (55-minute cap). Tasks beyond four remain in Git; they require a later owner-authored controller update / run trigger. This is a durable **backlog**, not guaranteed unbounded autonomous draining.
- Failed generation/verification does **not** publish code. The task is left in Git without a published branch and can be retried on a later authorized queue/controller update. Completed GitHub runs/artifacts are retained per workflow policy.

## Allowed scope of autonomous coding (V2)

`tests`: create only `test/opencode-<id>.test.mjs`, using Node native tests and synthetic data.

`pure-module`: create only `src/opencode-<id>.mjs` **and** `test/opencode-<id>.test.mjs`. This is real, reviewable source code, but deliberately **not yet wired into the application**. Integrating it into existing app source, authentication, editorial verification, network services or DB migrations requires a separately reviewed task/gate.

Agent cannot run shell commands, call network services, read secrets or GitHub credentials, change existing tracked files, modify project deployments, or communicate with external live civic records. Allowed new source code is deterministic and side-effect-free; no I/O, process execution, dynamic imports or third-party dependencies. OpenCode must not copy AGPL-licensed Polis code. The generator checks for suspicious constructs, import paths and unexpected workspace modifications and then independently runs `npm run verify` (and Chromium plus encrypted restore for pure module tasks).

Security regex and tests are defense in depth, **not** a proof of complete supply-chain security; require human architectural/security review of every generated PR before integration.

## Verification

- Earlier free-model test pilot: [run #39764186471](https://github.com/titanfit102-bit/Protesto/actions/runs/39764186471), [draft PR #7](https://github.com/titanfit102-bit/Protesto/pull/7).
- First guarded real source task: `dialogue-report-metrics`, completed in [run #39768946834](https://github.com/titanfit102-bit/Protesto/actions/runs/39768946834), [draft PR #9](https://github.com/titanfit102-bit/Protesto/pull/9). It created only an independent pure aggregate module and its tests, with no main/Production changes.
- Detector resilience revision: [run #39769411010](https://github.com/titanfit102-bit/Protesto/actions/runs/39769411010) succeeded after updating the durable-backlog scan; existing draft branches are not regenerated.

## Practical operation from this conversation

User may give more tasks before current OpenCode run finishes. Architect assigns immutable IDs, checks dependencies, appends approved in-scope entries to the controller branch and tracks the triggering run/PR. Existing running job continues; a later run processes the most recent approved backlog snapshot, skips previously published branches, and leaves any over the per-run cap in Git. Never pretend work continues after runs complete without a future trigger or scheduled mechanism.

Next architectural phase, **not enabled**: supervised changes to existing application modules, requiring file-level approvals, staging CI, broader threat model, manual PR reviews, contract tests, rollback gates and stricter secret isolation. No automatic merge, website deployment, real-user data, political persuasion targeting or model-provider charges.
