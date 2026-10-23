import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {assertPrivatePilotStartupPolicy} from "../src/ops/private-startup.mjs";

const local=()=>({host:"127.0.0.1",port:4174,origin:"http://127.0.0.1:4174"});

test("F08: only the local private pilot is permitted, not production",()=>{
 for(const environment of [undefined,"development","test"]){
  const outcome=assertPrivatePilotStartupPolicy({...local(),environment});
  assert.deepEqual(outcome,{mode:"private-loopback-only",releaseAllowed:false});
 }
 assert.deepEqual(
  assertPrivatePilotStartupPolicy({host:"::1",port:4174,origin:"http://[::1]:4174"}),
  {mode:"private-loopback-only",releaseAllowed:false}
 );
});

test("F08: all public bindings, fake release approvals and malformed origins fail closed",()=>{
 const examples=[
  {environment:"production"},{environment:"staging"},{environment:"PRODUCTION"},
  {environment:""},{host:"0.0.0.0"},{host:"::"},
  {host:"localhost"},{host:"192.168.1.10"},{host:"127.0.0.2"},
  {port:0},{port:-1},{port:65536},{port:4174.5},
  {origin:"https://127.0.0.1:4174"},{origin:"http://127.0.0.1:4175"},
  {origin:"http://localhost:4174"},{origin:"http://127.0.0.1:4174@evil.invalid"},
  {origin:"http://127.0.0.1:4174/secret"},{origin:"http://127.0.0.1:4174?test=1"},
  {origin:"http://127.0.0.1:4174/#fragment"},
  {origin:"http://user:password@127.0.0.1:4174"},
  {origin:"http://127.0.0.1.evil.invalid:4174"}
 ];
 for(const override of examples){
  assert.throws(()=>assertPrivatePilotStartupPolicy({...local(),...override}),
   /Private pilot startup refused/,JSON.stringify(override));
 }
 // A forged environment release flag, even one claiming owner sign-off,
 // cannot authorize Production or public binding.
 for(const manualEvidence of [true,false]){
  assert.throws(()=>assertPrivatePilotStartupPolicy({
   ...local(),environment:"production",
   PROTESTO_OWNER_APPROVED:manualEvidence,ciPassed:true,releaseAllowed:true
  }),/unapproved runtime environment/);
 }
});

test("F08: subprocess refuses risky configuration before DATABASE_URL or a listener",()=>{
 const configurations=[
  {NODE_ENV:"production",APP_ORIGIN:"https://127.0.0.1:4174",HOST:"127.0.0.1"},
  {NODE_ENV:"staging",APP_ORIGIN:"http://127.0.0.1:4174",HOST:"127.0.0.1"},
  {NODE_ENV:"development",HOST:"0.0.0.0",APP_ORIGIN:"http://0.0.0.0:4174"},
  {NODE_ENV:"test",HOST:"::",APP_ORIGIN:"http://[::]:4174"},
  {NODE_ENV:"development",HOST:"127.0.0.1",APP_ORIGIN:"https://127.0.0.1:4174"},
  {NODE_ENV:"development",HOST:"127.0.0.1",APP_ORIGIN:"http://127.0.0.1:4174"}
 ];
 for(const config of configurations){
  const env={...process.env,...config,PORT:"4174",DATABASE_URL:"",
   PROTESTO_RELEASE_ALLOWED:"1",PROTESTO_OWNER_APPROVED:"1"};
  const run=spawnSync(process.execPath,["tools/pilot-server.mjs"],{
   cwd:process.cwd(),env,encoding:"utf8",timeout:4500
  });
  assert.equal(run.status,1,JSON.stringify(config)+" must exit before boot");
  if(config.HOST==="127.0.0.1"&&config.APP_ORIGIN==="http://127.0.0.1:4174"&&config.NODE_ENV==="development"){
   // A valid private configuration gets past the policy and only then notices
   // that this test intentionally provided no DB credentials.
   assert.match(run.stderr,/Mungon DATABASE_URL/);
  }else{
   assert.match(run.stderr,/Private pilot startup refused/,JSON.stringify(config));
   assert.doesNotMatch(run.stderr,/Mungon DATABASE_URL/,"Policy must precede database configuration");
  }
  assert.doesNotMatch(run.stdout,/Private pilot listening/);
 }
});
