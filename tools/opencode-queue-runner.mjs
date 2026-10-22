import { readFileSync, writeFileSync, mkdirSync, lstatSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const base = process.cwd();
const out = resolve(process.env.RUNNER_TEMP || "/tmp", "protesto-opencode-queue");
mkdirSync(out, { recursive: true });
const queue = JSON.parse(readFileSync("automation/opencode-approved-tasks.json", "utf8"));
const validId = /^[a-z][a-z0-9-]{2,36}$/;
const validTarget = /^test\/opencode-[a-z0-9-]+\.test\.mjs$/;
const allowedImports = new Set(["node:test", "node:assert/strict", "../src/domain.mjs", "../src/seed.mjs"]);
function stop(message) { throw new Error("OpenCode queue: " + message); }
function run(program, args, opts = {}) {
  const result = spawnSync(program, args, { cwd: base, encoding: "utf8", timeout: opts.timeout || 120000, maxBuffer: 8 * 1024 * 1024, env: opts.env || process.env });
  const output = String(result.stdout || "") + "\n" + String(result.stderr || "");
  if (opts.log) writeFileSync(join(out, opts.log), output, "utf8");
  if (result.error || result.status !== 0) stop(program + " exited " + result.status + " (" + (result.error?.message || "") + ")\n" + output.slice(-3500));
  return output;
}
if (queue.version !== 1 || queue.base !== "feat/protesto-foundation" || queue.policy !== "synthetic-tests-only") stop("unexpected queue policy");
if (!Array.isArray(queue.tasks) || queue.tasks.length < 1 || queue.tasks.length > 2 || queue.maxTasksPerRun !== 2) stop("queue must contain one or two tasks");
if (!process.env.OPENCODE_MODEL?.startsWith("opencode/") || !process.env.OPENCODE_MODEL.endsWith("-free")) stop("a listed free model must be selected");
const seen = new Set();
for (const task of queue.tasks) {
  if (!validId.test(task.id) || seen.has(task.id)) stop("bad/duplicate task id");
  seen.add(task.id);
  if (task.status !== "approved") stop("task is not explicitly approved: " + task.id);
  if (!validTarget.test(task.target) || task.target !== "test/opencode-" + task.id + ".test.mjs") stop("invalid target: " + task.id);
  if (typeof task.brief !== "string" || task.brief.length < 100 || task.brief.length > 1400) stop("bad brief: " + task.id);
  if (existsSync(task.target)) stop("target already exists: " + task.target);
}
const baseline = run("git", ["rev-parse", "HEAD"]).trim();
const metadata = { version: 1, base: queue.base, baseSha: baseline, model: process.env.OPENCODE_MODEL, tasks: [] };
const already = [];
for (const task of queue.tasks) {
  const path = resolve(base, task.target);
  const config = {
    permission: {
      "*": "deny",
      read: { "*": "allow", "*.env": "deny", "*.env.*": "deny" },
      glob: "allow", grep: "allow", list: "allow",
      edit: { "*": "deny", ["*" + task.target]: "allow" },
      external_directory: "deny"
    }
  };
  const agentEnv = {
    PATH: process.env.PATH, HOME: process.env.HOME, LANG: "C.UTF-8",
    CI: "true", OPENCODE_DISABLE_AUTOUPDATE: "true",
    OPENCODE_AUTO_SHARE: "false", OPENCODE_CONFIG_CONTENT: JSON.stringify(config)
  };
  const prompt = [
    "You are a limited coding agent for the public, nonpartisan civic prototype Protesto.",
    "Read README.md, src/domain.mjs, test/domain.test.mjs and docs/RELEASE_GATES.md.",
    "Your ONLY permitted modification is to CREATE " + task.target + ". No edits or deletions to any existing files.",
    "Write at least four high-value standard Node.js unit tests, with fake/synthetic test data only.",
    "Never use shell commands, network requests, credentials, real identities, source control, PRs or deployments.",
    "Do not change src/, tools/, configuration, schema, README, workflows or any other file.",
    "The reviewer will independently execute npm run verify; you must not run it.",
    "Task: " + task.brief,
    "Use the write/edit tool to create the file, not just a proposed code block. End with a brief Albanian summary."
  ].join("\n");
  console.log("START TASK " + task.id + " -> " + task.target);
  run("opencode", ["run", "--agent", "build", "--model", process.env.OPENCODE_MODEL, prompt], { timeout: 290000, env: agentEnv, log: task.id + ".agent.log" });
  if (!existsSync(path) || !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) stop("no safe generated test for " + task.id);
  const content = readFileSync(path, "utf8");
  if (content.length < 450 || content.length > 18000) stop("unexpected file length: " + task.id);
  const blocked = /\b(?:process|require|globalThis|eval|fetch|WebSocket|child_process|worker_threads)\b|\bimport\s*\(|\bnew\s+Function\s*\(|\.\.\/\.\.\//;
  if (blocked.test(content)) stop("unsafe operation in " + task.target);
  const imports = [...content.matchAll(/\b(?:from\s*|import\s*)["']([^"']+)["']/g)].map((x) => x[1]);
  if (!imports.length || imports.some((x) => !allowedImports.has(x))) stop("unexpected imports: " + task.target);
  if ((content.match(/\btest\s*\(/g) || []).length < 3) stop("not enough regression tests");
  // Restrict all generated/untracked paths to the two declared test outputs.
  already.push(task.target);
  const status = run("git", ["status", "--porcelain=v1", "--untracked-files=all"]).trim().split("\n").filter(Boolean);
  if (status.length !== already.length || status.some((line) => !line.startsWith("?? ") || !already.includes(line.slice(3)))) stop("unexpected tracked or untracked change: " + status.join(", "));
  run("node", ["--check", task.target]);
  run("npm", ["run", "verify"], { timeout: 180000, log: task.id + ".verify.log" });
  writeFileSync(join(out, task.id + ".mjs"), content, "utf8");
  metadata.tasks.push({ id: task.id, target: task.target, sha256: createHash("sha256").update(content).digest("hex"), testVerified: true });
  console.log("VERIFIED TASK " + task.id + "; separate draft PR can be proposed");
}
writeFileSync(join(out, "manifest.json"), JSON.stringify(metadata, null, 2) + "\n", "utf8");
console.log("QUEUE COMPLETED " + metadata.tasks.length + " tasks; no changes were committed.");
