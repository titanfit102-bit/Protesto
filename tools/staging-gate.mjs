import {isolatedStagingBoundary} from "../src/ops/staging-boundary.mjs";
if(!isolatedStagingBoundary(process.env)){
 throw new Error("Staging rehearsal refused: requires disposable CI PostgreSQL and loopback-only origin.");
}
console.log("Rehearsal isolation confirmed: disposable loopback PostgreSQL only. No live deployment.");
