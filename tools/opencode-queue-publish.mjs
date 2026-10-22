import { readFileSync, existsSync, lstatSync, appendFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

const repo = "titanfit102-bit/Protesto";
const baseBranch = "feat/protesto-foundation";
const token = process.env.GITHUB_TOKEN;
const root = resolve(process.env.QUEUE_ARTIFACT_DIR || "./queue-output");
if (!token) throw new Error("GITHUB_TOKEN unavailable for restricted publish job");
const list = JSON.parse(readFileSync("automation/opencode-approved-tasks.json", "utf8"));
const output = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
if (list.base !== baseBranch || output.base !== baseBranch || list.policy !== "synthetic-tests-only") throw new Error("Unapproved base or policy");
if (!Array.isArray(output.tasks) || output.tasks.length !== list.tasks.length || output.tasks.length > 2) throw new Error("Unexpected task manifest");
const apiBase = "https://api.github.com/repos/" + repo;
async function request(method, endpoint, body, accept404 = false) {
  const response = await fetch(apiBase + endpoint, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? {"Content-Type": "application/json"} : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const raw = await response.text();
  if (accept404 && response.status === 404) return null;
  if (!response.ok) throw new Error(method + " " + endpoint + " failed (" + response.status + "): " + raw.slice(0, 600));
  return JSON.parse(raw);
}
const base = await request("GET", "/git/ref/heads/" + baseBranch);
const baseSha = base.object.sha;
if (baseSha !== output.baseSha) throw new Error("Base branch changed during the agent run; refuse publication");
const results = [];
for (let i = 0; i < list.tasks.length; i++) {
  const task = list.tasks[i];
  const item = output.tasks[i];
  if (task.status !== "approved" || task.id !== item.id || task.target !== item.target || !item.testVerified) throw new Error("Unapproved task artifact");
  if (!/^[a-z][a-z0-9-]{2,36}$/.test(task.id) || !/^test\/opencode-[a-z0-9-]+\.test\.mjs$/.test(item.target) || item.target !== "test/opencode-" + task.id + ".test.mjs") throw new Error("Invalid generated file path");
  const inputPath = join(root, task.id + ".mjs");
  if (!existsSync(inputPath) || !lstatSync(inputPath).isFile() || lstatSync(inputPath).isSymbolicLink()) throw new Error("No valid artifact file for " + task.id);
  const source = readFileSync(inputPath, "utf8");
  if (source.length < 450 || source.length > 18000 || createHash("sha256").update(source).digest("hex") !== item.sha256) throw new Error("Code artifact checksum mismatch");
  if (/\b(?:process|require|globalThis|eval|fetch|WebSocket|child_process|worker_threads)\b|\bimport\s*\(|\.\.\/\.\.\//.test(source)) throw new Error("Unsafe source rejected");
  const branch = "opencode/pilot-" + task.id;
  const found = await request("GET", "/git/ref/heads/" + branch, undefined, true);
  if (found) {
    console.log("EXISTING BRANCH — skipping duplicate generation: " + branch);
    results.push({ id: task.id, status: "already-exists", branch });
    continue;
  }
  await request("POST", "/git/refs", { ref: "refs/heads/" + branch, sha: baseSha });
  await request("PUT", "/contents/" + item.target, {
    message: "test(opencode): autonomous approved " + task.id + " unit tests",
    branch,
    content: Buffer.from(source).toString("base64")
  });
  let pr;
  try {
    pr = await request("POST", "/pulls", {
      title: "test(opencode): " + task.id + " — AI-generated tests",
      head: branch,
      base: baseBranch,
      draft: true,
      body: [
        "## Origin",
        "Generated with OpenCode free model in a tightly scoped CI task queue, independently verified on disposable PostgreSQL.",
        "## Scope",
        "- Only added `" + item.target + "`",
        "- Code produced without GitHub write credentials; a separate job published the approved diff",
        "- Source checksum: `" + item.sha256 + "`",
        "- Base SHA: `" + baseSha + "`",
        "- Test command: `npm run verify` — passing in generator job",
        "## Required human gates",
        "- Review generated code and safety before merge",
        "- Never deploy from this draft PR; no real records or public civic submissions",
        "- No automatic merge to " + baseBranch + " or main"
      ].join("\n")
    });
  } catch (error) {
    console.error("Created branch with verified tests, but opening its PR failed: " + String(error));
    console.error("Manual fallback: https://github.com/" + repo + "/compare/" + baseBranch + "..." + branch + "?expand=1");
    throw error;
  }
  console.log("CREATED DRAFT PR " + pr.html_url + " for " + task.id);
  results.push({ id: task.id, status: "draft-pr", url: pr.html_url });
}
const summary = "## Protesto OpenCode task queue\n" + results.map(x => "- " + x.id + ": " + x.status + (x.url ? " — " + x.url : " — " + x.branch)).join("\n") + "\n";
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary, "utf8");
