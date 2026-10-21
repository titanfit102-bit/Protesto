import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const files=["index.html","styles.css","src/app.mjs","src/domain.mjs","src/seed.mjs","tools/dev-server.mjs","README.md","pilot.html","pilot.css","src/pilot.mjs","src/pilot-evidence.mjs","src/server/app.mjs","src/server/dossiers.mjs","src/server/actions.mjs","db/004_evidence_and_corrections.sql","src/ops/backup-crypto.mjs","src/ops/pg-env.mjs","tools/backup.mjs","tools/restore.mjs","tools/verify-backup.mjs"];
for(const name of files) {
 const body=await readFile(new URL("../"+name,import.meta.url),"utf8");
 assert.ok(body.trim().length>0,name+" should not be empty");
}
const html=await readFile(new URL("../index.html",import.meta.url),"utf8");
assert.match(html,/lang="sq"/);
assert.match(html,/id="content"/);
assert.match(html,/src="\/src\/app.mjs"/);
console.log("Static structure checks passed.");
