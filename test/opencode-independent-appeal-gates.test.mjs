import test from "node:test";import assert from "node:assert/strict";import {independentAppealGates} from "../src/opencode-independent-appeal-gates.mjs";
const sample=()=>({state:"pending",reviewer_role:"reviewer",reviewer_id:"four",appeal_author_id:"one",case_author_id:"two",first_reviewer_id:"three"});
test("independent second reviewer",()=>{assert.equal(independentAppealGates(sample()).mayReview,true);});
test("first reviewer prohibited",()=>{assert.equal(independentAppealGates({...sample(),reviewer_id:"three"}).mayReview,false);});
test("case and appeal authors prohibited",()=>{for(const id of ["one","two"])assert.equal(independentAppealGates({...sample(),reviewer_id:id}).mayReview,false);});
test("role, terminal state and invalid state",()=>{assert.equal(independentAppealGates({...sample(),reviewer_role:"reporter"}).mayReview,false);assert.equal(independentAppealGates({...sample(),state:"accepted"}).mayReview,false);assert.throws(()=>independentAppealGates({...sample(),state:"unknown"}));});
