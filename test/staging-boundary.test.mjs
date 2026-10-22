import test from "node:test";
import assert from "node:assert/strict";
import {isolatedStagingBoundary} from "../src/ops/staging-boundary.mjs";
const valid=()=>({
 GITHUB_ACTIONS:"true",PROTESTO_STAGING_REHEARSAL:"1",PROTESTO_BACKUP_TEST:"1",
 DATABASE_URL:"postgres://postgres:postgres@127.0.0.1:5432/protesto",
 APP_ORIGIN:"http://127.0.0.1:4174",PROTESTO_RATE_LIMIT_SECRET:"synthetic",
 PROTESTO_DIALOGUE_SECRET:"synthetic"
});
test("staging isolation refuses external or production addresses",()=>{
 assert.equal(isolatedStagingBoundary(valid()),true);
 for(const override of [{DATABASE_URL:"postgres://user:secret@production.example.com:5432/protesto"},
  {DATABASE_URL:"postgres://postgres@127.0.0.1:5432/real-data"},
  {APP_ORIGIN:"https://protesto.example.org"},{PROTESTO_STAGING_REHEARSAL:"0"},
  {GITHUB_ACTIONS:"false"},{NODE_ENV:"production"},{PROTESTO_BACKUP_TEST:"0"}]){
  assert.equal(isolatedStagingBoundary({...valid(),...override}),false);
 }
});
