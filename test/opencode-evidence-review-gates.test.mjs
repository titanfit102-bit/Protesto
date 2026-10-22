import test from "node:test";import assert from "node:assert/strict";import {evidenceReviewGates} from "../src/opencode-evidence-review-gates.mjs";
const ok=()=>({author_id:"author",reviewer_id:"reviewer",sources:[{state:"accepted",source_type:"documentary"}],source_checked:true,privacy_checked:true,reply_checked:true});
test("eligible means review only",()=>{const r=evidenceReviewGates(ok());assert.equal(r.eligible,true);assert.equal(r.verifiedTruth,false);assert.equal(r.requiresHumanDecision,true);});
test("self-review denied",()=>{const r=evidenceReviewGates({...ok(),reviewer_id:"author"});assert.ok(r.reasons.includes("independent_reviewer_required"));});
test("unreviewed sources denied",()=>{const r=evidenceReviewGates({...ok(),sources:[{state:"pending",source_type:"documentary"}]});assert.equal(r.eligible,false);});
test("all checklists explicitly required",()=>{const r=evidenceReviewGates({...ok(),privacy_checked:false,reply_checked:null});assert.ok(r.reasons.includes("privacy_checked_required"));assert.ok(r.reasons.includes("reply_checked_required"));});
