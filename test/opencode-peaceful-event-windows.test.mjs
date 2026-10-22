import test from "node:test";import assert from "node:assert/strict";import {peacefulEventWindow} from "../src/opencode-peaceful-event-windows.mjs";
const a={starts_at:"2026-10-22T22:00:00Z",ends_at:"2026-10-23T01:00:00Z"};
test("midnight crossing",()=>{const r=peacefulEventWindow(a);assert.equal(r.valid,true);assert.equal(r.duration_minutes,180);});
test("equal or reverse ordering denied",()=>{assert.equal(peacefulEventWindow({...a,ends_at:a.starts_at}).valid,false);});
test("duration configured boundary",()=>{assert.equal(peacefulEventWindow({...a,max_minutes:180}).valid,true);assert.equal(peacefulEventWindow({...a,max_minutes:179}).valid,false);});
test("invalid ISO and calendar denied",()=>{assert.throws(()=>peacefulEventWindow({...a,starts_at:"2026-02-30T01:00:00Z"}));assert.throws(()=>peacefulEventWindow({...a,starts_at:"2026-10-22"}));});
test("no attendance tracking",()=>{const r=peacefulEventWindow(a);assert.equal(r.attendanceTracked,false);assert.equal(r.legalAuthorization,false);});
