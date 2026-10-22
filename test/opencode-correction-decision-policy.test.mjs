import test from "node:test";import assert from "node:assert/strict";import {correctionDecisionPolicy} from "../src/opencode-correction-decision-policy.mjs";
const p=()=>({case_state:"published",correction_state:"pending",author_id:"one",reviewer_id:"two"});
test("valid pending correction awaits human",()=>{const r=correctionDecisionPolicy(p());assert.equal(r.mayReview,true);assert.equal(r.automaticCaseChange,false);});
test("rejected correction cannot be decided twice",()=>{assert.equal(correctionDecisionPolicy({...p(),correction_state:"rejected"}).mayReview,false);});
test("archived case blocks moderation",()=>{assert.ok(correctionDecisionPolicy({...p(),case_state:"archived"}).reasons.includes("case_not_published"));});
test("self-review and impossible states rejected",()=>{assert.equal(correctionDecisionPolicy({...p(),reviewer_id:"one"}).mayReview,false);assert.throws(()=>correctionDecisionPolicy({...p(),case_state:"unverified"}));});
