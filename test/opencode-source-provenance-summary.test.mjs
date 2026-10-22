import test from "node:test";import assert from "node:assert/strict";import {summarizeSourceProvenance} from "../src/opencode-source-provenance-summary.mjs";
const a={id:"s-1",state:"accepted",source_type:"official_record",title:"Regjistër sintetik",publisher:"Institucioni i testit",reviewed_at:"2026-10-01T00:00:00Z",reviewer_note:"PRIVATE",submitter_email:"PRIVATE"};
test("accepted provenance strips private fields",()=>{const r=summarizeSourceProvenance([a]);assert.equal(r.accepted.length,1);assert.equal(JSON.stringify(r).includes("PRIVATE"),false);});
test("pending is suppressed to id/status",()=>{const r=summarizeSourceProvenance([{...a,id:"s-2",state:"pending"}]);assert.deepEqual(r.pending,[{id:"s-2",state:"pending"}]);});
test("rejected not publicly listed",()=>{const r=summarizeSourceProvenance([{...a,state:"rejected"}]);assert.equal(r.accepted.length+r.pending.length,0);});
test("malformed input rejected",()=>{assert.throws(()=>summarizeSourceProvenance([{...a,reviewed_at:"bad"}]));assert.throws(()=>summarizeSourceProvenance({}));});
test("deterministic and nonmutating",()=>{const arr=[{...a,id:"z"},{...a,id:"a"}];const cp=structuredClone(arr);assert.deepEqual(summarizeSourceProvenance(arr).accepted.map(x=>x.id),["a","z"]);assert.deepEqual(arr,cp);});
