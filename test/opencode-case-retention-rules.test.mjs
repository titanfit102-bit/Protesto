import test from "node:test";import assert from "node:assert/strict";import {evaluateCaseRetention} from "../src/opencode-case-retention-rules.mjs";
const a={state:"published",created_at:"2026-10-01T00:00:00.000Z"};const p={as_of:"2026-10-11T00:00:00.000Z",retention_days:10};
test("retention boundary proposes eligibility only",()=>{const r=evaluateCaseRetention(a,p);assert.equal(r.action,"eligible_for_deletion");assert.equal(r.automaticDeletion,false);});
test("under period retained",()=>{assert.equal(evaluateCaseRetention(a,{...p,retention_days:11}).action,"retain");});
test("archived case requires human review",()=>{assert.equal(evaluateCaseRetention({...a,state:"archived"},p).action,"review");});
test("invalid dates rejected",()=>{assert.throws(()=>evaluateCaseRetention({...a,created_at:"invalid"},p));assert.throws(()=>evaluateCaseRetention(a,{...p,as_of:"2026-09-01T00:00:00.000Z"}));});
test("policy change and immutability",()=>{const rec=Object.freeze({...a});assert.equal(evaluateCaseRetention(rec,{...p,retention_days:20}).expired,false);assert.equal(rec.state,"published");});
