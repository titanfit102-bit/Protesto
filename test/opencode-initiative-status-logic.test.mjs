import test from "node:test";import assert from "node:assert/strict";import {initiativeStatusLogic} from "../src/opencode-initiative-status-logic.mjs";
test("draft can proceed to review",()=>{assert.equal(initiativeStatusLogic({from:"draft",to:"under-review"}).allowed,true);});
test("publication demands independent reviewer",()=>{assert.equal(initiativeStatusLogic({from:"under-review",to:"published",reviewAcknowledged:true,author_id:"a",reviewer_id:"b"}).allowed,true);assert.equal(initiativeStatusLogic({from:"under-review",to:"published",reviewAcknowledged:true,author_id:"a",reviewer_id:"a"}).allowed,false);});
test("cannot skip review",()=>{assert.equal(initiativeStatusLogic({from:"draft",to:"published",reviewAcknowledged:true,reviewer_id:"b"}).allowed,false);});
test("archive terminal",()=>{const r=initiativeStatusLogic({from:"archived",to:"published"});assert.deepEqual(r.nextStates,[]);assert.equal(r.allowed,false);});
test("invalid state rejected",()=>{assert.throws(()=>initiativeStatusLogic({from:"missing",to:"published"}));});
