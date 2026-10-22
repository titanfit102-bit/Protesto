import test from "node:test";
import assert from "node:assert/strict";
import {correctionDecisionPolicy} from "../src/server/correction-policy.mjs";

const valid=()=>({case_state:"published",correction_state:"pending",author_id:"author",reviewer_id:"reviewer"});

test("a pending correction of a published case requires independent human review",()=>{
 const result=correctionDecisionPolicy(valid());
 assert.equal(result.mayReview,true);
 assert.deepEqual(result.allowedDecisions,["accepted","rejected"]);
 assert.equal(result.automaticCaseChange,false);
});

test("archived and nonpublic cases must not receive correction decisions",()=>{
 for(const case_state of ["archived","pending","rejected"]){
  const result=correctionDecisionPolicy({...valid(),case_state});
  assert.equal(result.mayReview,false);
  assert.ok(result.reasons.includes("case_not_published"));
 }
});

test("terminal correction and self-review both block another decision",()=>{
 for(const correction_state of ["accepted","rejected"]){
  const result=correctionDecisionPolicy({...valid(),correction_state});
  assert.equal(result.mayReview,false);
  assert.deepEqual(result.allowedDecisions,[]);
 }
 const own=correctionDecisionPolicy({...valid(),reviewer_id:"author"});
 assert.ok(own.reasons.includes("independent_reviewer_required"));
});

test("malformed policy context fails closed",()=>{
 for(const input of [null,[],{}, {...valid(),case_state:"made-up"},
   {...valid(),correction_state:"made-up"}]){
  assert.throws(()=>correctionDecisionPolicy(input),TypeError);
 }
});
