import test from "node:test";import assert from "node:assert/strict";import {validatePublicAuditSequence} from "../src/opencode-public-audit-sequence.mjs";
const e=(type,day)=>({case_id:"synthetic",type,at:"2026-10-"+day+"T00:00:00Z"});
test("valid chronology",()=>{assert.equal(validatePublicAuditSequence([e("published","01"),e("corrected","02"),e("withdrawn","03")]).valid,true);});
test("correction before publication rejected",()=>{assert.equal(validatePublicAuditSequence([e("corrected","01"),e("published","02")]).valid,false);});
test("repeated retraction is flagged",()=>{const r=validatePublicAuditSequence([e("published","01"),e("withdrawn","02"),e("withdrawn","03")]);assert.ok(r.issues.some(x=>x.reason==="repeated_or_unpublished_withdrawal"));});
test("malformed and input immutable",()=>{const rows=[e("published","01"),{case_id:"synthetic",type:"unknown",at:"bad"}];const copy=structuredClone(rows);assert.equal(validatePublicAuditSequence(rows).valid,false);assert.deepEqual(rows,copy);});
