import test from "node:test";import assert from "node:assert/strict";import {institutionPublicSummary} from "../src/opencode-institution-public-summary.mjs";
const rec=(id,day)=>({public_request_id:id,institution_label:"Bashkia fiktive",status:"submitted",last_public_update:"2026-10-"+day+"T00:00:00Z",evidence_reference:"reference",citizen_email:"PRIVATE",internal_notes:"PRIVATE"});
test("public-only projection",()=>{assert.equal(JSON.stringify(institutionPublicSummary([rec("A","01")])).includes("PRIVATE"),false);});
test("descending chronology",()=>{assert.deepEqual(institutionPublicSummary([rec("A","01"),rec("B","02")]).map(x=>x.public_request_id),["B","A"]);});
test("empty list allowed",()=>{assert.deepEqual(institutionPublicSummary([]),[]);});
test("rejects unknown states",()=>{assert.throws(()=>institutionPublicSummary([{...rec("A","01"),status:"fake"}]));});
test("non-mutating data",()=>{const r=Object.freeze(rec("A","01"));assert.equal(institutionPublicSummary([r])[0].status,"submitted");assert.equal(r.citizen_email,"PRIVATE");});
