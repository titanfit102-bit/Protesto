import test from "node:test";import assert from "node:assert/strict";import {institutionReplyTransition,institutionReplyNextStates} from "../src/opencode-institution-reply-states.mjs";
test("valid approved progression",()=>{assert.equal(institutionReplyTransition("draft","submitted",{humanApproved:true}).allowed,true);});
test("skip steps denied",()=>{assert.equal(institutionReplyTransition("draft","answered",{humanApproved:true}).allowed,false);});
test("disputed answer is reviewable",()=>{assert.equal(institutionReplyTransition("answered","disputed",{humanApproved:true}).allowed,true);assert.equal(institutionReplyTransition("disputed","answered",{humanApproved:true}).allowed,true);});
test("closed is terminal",()=>{assert.deepEqual(institutionReplyNextStates("closed"),[]);assert.equal(institutionReplyTransition("closed","submitted",{humanApproved:true}).allowed,false);});
test("approval required and unknown states",()=>{assert.equal(institutionReplyTransition("draft","submitted").allowed,false);assert.throws(()=>institutionReplyTransition("draft","unknown"));});
