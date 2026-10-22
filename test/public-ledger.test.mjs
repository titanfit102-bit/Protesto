import test from "node:test";
import assert from "node:assert/strict";
import {publicLedgerEvents} from "../src/server/public-ledger.mjs";

const A = "343f22aa-2de0-4d29-8a1b-fadfa30f0417";
const B = "f34f22aa-2de0-4d29-8a1b-fadfa30f0418";
const event = (case_id,event_type,created_at)=>({case_id,event_type,created_at});

test("PostgreSQL Date values and JSON timestamps are canonicalized newest-first",()=>{
 const result=publicLedgerEvents([
  event(A,"published",new Date("2026-10-20T12:00:00Z")),
  event(B,"published","2026-10-20T14:00:00+02:00"),
  event(A,"archived",new Date("2026-10-21T12:00:00Z"))
 ]);
 assert.deepEqual(result.map(x=>x.event_type),["archived","published","published"]);
 assert.equal(result[0].created_at,"2026-10-21T12:00:00.000Z");
 assert.deepEqual(result.slice(1).map(x=>x.case_id),[A,B]);
});

test("public projection is a strict allowlist and never mutates input",()=>{
 const row=Object.freeze({...event(A,"published",new Date("2026-10-20T12:00:00Z")),
  email:"private@example.org",review_note:"secret",reviewer_id:"hidden",
  evidence:"not public",voter_key:"private"});
 const out=publicLedgerEvents([row]);
 assert.deepEqual(Object.keys(out[0]),["case_id","event_type","created_at"]);
 assert.equal(out[0].case_id,A);
 assert.ok(!JSON.stringify(out).includes("private"));
 assert.ok(!JSON.stringify(out).includes("secret"));
 assert.equal(row.review_note,"secret");
});

test("exact duplicate events are suppressed with deterministic tie ordering",()=>{
 const p=event(A,"published","2026-10-20T12:00:00.000Z");
 const w=event(A,"archived","2026-10-20T12:00:00.000Z");
 assert.deepEqual(publicLedgerEvents([p,p,w]).map(x=>x.event_type),["archived","published"]);
 assert.equal(publicLedgerEvents([p,{...p,case_id:A.toUpperCase()}]).length,1);
});

test("malformed and private-only events are rejected rather than labeled published",()=>{
 for (const row of [
  event("not-uuid","published","2026-10-20T12:00:00Z"),
  event(A,"pending","2026-10-20T12:00:00Z"),
  event(A,"rejected","2026-10-20T12:00:00Z"),
  event(A,"archived","yesterday"),
  event(A,"published","2026-10-20"),
  event(A,"published",new Date("invalid")),
  null,[],{}
 ]) assert.throws(()=>publicLedgerEvents([row]),TypeError);
 assert.throws(()=>publicLedgerEvents({}));
 assert.deepEqual(publicLedgerEvents([]),[]);
});
