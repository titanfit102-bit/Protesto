import test from "node:test";import assert from "node:assert/strict";import {ownCivicExport} from "../src/opencode-privacy-export-allowlist.mjs";
const own=()=>({owner_id:"mine",id:"1",title:"Test synthetic",status:"pending",created_at:"2026-10-01",public_reference:"PUBLIC",password_hash:"SECRET",session_token:"SECRET",notes:{email:"SECRET"}});
test("retains explicitly allowed fields",()=>{const r=ownCivicExport([own()],"mine").items[0];assert.deepEqual(Object.keys(r),["id","title","status","created_at","public_reference"]);});
test("no secrets through nested unknown keys",()=>{assert.equal(JSON.stringify(ownCivicExport([own()],"mine")).includes("SECRET"),false);});
test("foreign owner rows excluded",()=>{assert.equal(ownCivicExport([own(),{...own(),owner_id:"other"}],"mine").items.length,1);});
test("input must be well shaped",()=>{assert.throws(()=>ownCivicExport({},"mine"));assert.throws(()=>ownCivicExport([null],"mine"));});
test("does not mutate existing objects",()=>{const v=Object.freeze(own());assert.equal(ownCivicExport([v],"mine").items[0].title,"Test synthetic");assert.equal(v.password_hash,"SECRET");});
