import test from "node:test";import assert from "node:assert/strict";import {publicLedgerView} from "../src/opencode-transparency-ledger-view.mjs";
const row=(case_id,event_type,created_at)=>({case_id,event_type,created_at,reporter_email:"private",review_note:"secret"});
test("ordered public events only",()=>{const out=publicLedgerView([row("case-1","archived","2026-10-02T00:00:00Z"),row("case-1","published","2026-10-01T00:00:00Z")]);assert.deepEqual(out.map(x=>x.event_type),["published","archived"]);assert.deepEqual(Object.keys(out[0]),["case_id","event_type","created_at"]);});
test("duplicates normalized",()=>{const e=row("case-1","published","2026-10-01T00:00:00Z");assert.equal(publicLedgerView([e,e]).length,1);});
test("malformed data fail closed",()=>{assert.throws(()=>publicLedgerView([row("x","published","bad")]));assert.throws(()=>publicLedgerView([row("case-1","unknown","2026-10-01T00:00:00Z")]));});
test("input unchanged and no private records",()=>{const v=Object.freeze(row("case-1","published","2026-10-01T00:00:00Z"));assert.equal(JSON.stringify(publicLedgerView([v])).includes("private"),false);assert.equal(v.reporter_email,"private");});
