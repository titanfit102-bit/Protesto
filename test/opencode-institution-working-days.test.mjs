import test from "node:test";import assert from "node:assert/strict";import {addInstitutionWorkingDays} from "../src/opencode-institution-working-days.mjs";
test("skips weekend",()=>{assert.equal(addInstitutionWorkingDays("2026-10-23",1).date,"2026-10-26");});
test("crosses year boundary",()=>{assert.equal(addInstitutionWorkingDays("2026-12-31",1).date,"2027-01-01");});
test("custom closure omitted",()=>{assert.equal(addInstitutionWorkingDays("2026-12-31",1,["2027-01-01"]).date,"2027-01-04");});
test("zero days uses start date",()=>{assert.equal(addInstitutionWorkingDays("2026-10-24",0).date,"2026-10-24");});
test("invalid date and count denied",()=>{assert.throws(()=>addInstitutionWorkingDays("2026-02-30",1));assert.throws(()=>addInstitutionWorkingDays("2026-10-22",-1));assert.throws(()=>addInstitutionWorkingDays("2026/10/22",2));});
test("no input mutation",()=>{const a=Object.freeze(["2026-10-23"]);assert.equal(addInstitutionWorkingDays("2026-10-22",2,a).date,"2026-10-27");assert.equal(a.length,1);});
