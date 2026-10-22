import {access,readdir,readFile} from "node:fs/promises";
import {evaluateReadiness} from "../src/ops/release-gate.mjs";
const required=[
 "src/server/app.mjs","src/server/dossiers.mjs","src/server/responses.mjs",
 "src/server/dialogue.mjs","src/server/source-fingerprint.mjs",
 "src/server/publication-privacy.mjs","src/server/totp.mjs",
 "src/ops/staging-boundary.mjs","tools/staging-gate.mjs",
 "tools/backup.mjs","test/pilot.integration.test.mjs",
 "test/responses.integration.test.mjs","test/ops.integration.test.mjs"
];
for(const filename of required)await access(new URL("../"+filename,import.meta.url));
const migrations=(await readdir(new URL("../db/",import.meta.url))).filter(x=>/^\d{3}_.*\.sql$/.test(x)).sort();
if(migrations.length!==15||migrations[0]!=="001_initial.sql"||migrations.at(-1)!=="015_dialogue_public_copies.sql")
 throw new Error("Unexpected migration manifest for this release candidate");
const workflow=await readFile(new URL("../.github/workflows/verify.yml",import.meta.url),"utf8");
if(/\bdeploy\b|\bproduction\b/i.test(workflow))throw new Error("Verification workflow must not deploy");
const result=evaluateReadiness({ciPassed:false});
if(result.releaseAllowed)throw new Error("Unauthorized release state");
console.log(JSON.stringify({technicalCandidate:"requires completed CI",migrations:migrations.length,
 filesChecked:required.length,releaseAllowed:false,openCriticalGates:result.openCriticalGates},null,2));
