import test from "node:test";
import assert from "node:assert/strict";
import {evaluateReadiness,requiredExternalGates} from "../src/ops/release-gate.mjs";
test("release remains blocked despite green automated tests",()=>{
 const result=evaluateReadiness({ciPassed:true});
 assert.equal(result.technicalCandidate,true);
 assert.equal(result.releaseAllowed,false);
 assert.equal(result.authorizationRequired,true);
 assert.ok(result.openCriticalGates.length>=8);
});
test("passing fake manual flags cannot automatically deploy the pilot",()=>{
 const all=Object.fromEntries(requiredExternalGates().map(id=>[id,true]));
 const result=evaluateReadiness({ciPassed:true,manualEvidence:all});
 assert.deepEqual(result.openCriticalGates,[]);
 assert.equal(result.releaseAllowed,false,"Owner-approved release cannot be manufactured by an automated flag");
});
test("no CI evidence means no technical candidate",()=>{
 assert.equal(evaluateReadiness().technicalCandidate,false);
 assert.deepEqual(requiredExternalGates(),requiredExternalGates());
});
