import test from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import {expiredOperationalCounts,purgeExpiredOperationalRows,canApplySyntheticRetention,RETENTION_TABLES} from "../src/ops/retention.mjs";
const env=()=>({
 GITHUB_ACTIONS:"true",PROTESTO_STAGING_REHEARSAL:"1",
 PROTESTO_BACKUP_TEST:"1",PROTESTO_RETENTION_APPROVED:"1",
 NODE_ENV:"test",DATABASE_URL:"postgres://postgres:postgres@127.0.0.1:5432/protesto",
 APP_ORIGIN:"http://127.0.0.1:4174",
 PROTESTO_RATE_LIMIT_SECRET:"synthetic-retention-rate-key-long",
 PROTESTO_DIALOGUE_SECRET:"synthetic-retention-dialogue-key-long"
});

test("retention mutation authorization fails closed for all unapproved environments",()=>{
 const approved=env();
 assert.equal(canApplySyntheticRetention(approved),true);
 for(const changes of [
  {PROTESTO_RETENTION_APPROVED:undefined},
  {GITHUB_ACTIONS:undefined},
  {NODE_ENV:"production"},
  {APP_ORIGIN:"https://protesto.example"},
  {DATABASE_URL:"postgres://postgres:postgres@db.internal:5432/protesto"},
  {PROTESTO_BACKUP_TEST:undefined}
 ])assert.equal(canApplySyntheticRetention({...approved,...changes}),false);
 assert.deepEqual(RETENTION_TABLES,["sessions","request_rate_limits"]);
});

test("expired session and throttle hashes are deletable ONLY in isolated test DB, not civic records",
 {skip:!process.env.DATABASE_URL},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:3});
 const id=randomUUID(),caseId=randomUUID();
 const expiredSession=randomBytes(32).toString("hex"),activeSession=randomBytes(32).toString("hex");
 const expiredRate=randomBytes(32).toString("hex"),activeRate=randomBytes(32).toString("hex");
 let connected=false;
 try{
  await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,'reporter')",
   [id,"retention-"+id+"@example.org","synthetic-hash-not-for-login"]);
  await pool.query("INSERT INTO civic_cases(id,author_id,title,description,area,category) VALUES($1,$2,$3,$4,$5,$6)",
   [caseId,id,"Private synthetic case for retention",
    "Confidential synthetic content must survive operational expiry cleanup.",
    "Test locality","Mjedis"]);
  await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()-interval '1 day'),($3,$2,now()+interval '1 day')",
   [expiredSession,id,activeSession]);
  await pool.query("INSERT INTO request_rate_limits(key_hash,hits,expires_at) VALUES($1,3,now()-interval '1 day'),($2,1,now()+interval '1 day')",
   [expiredRate,activeRate]);
  const prior=await expiredOperationalCounts(pool);
  assert.ok(prior.expiredSessions>=1);
  assert.ok(prior.expiredRateLimits>=1);
  assert.equal(prior.mode,"read-only");
  let q=await pool.query("SELECT count(*)::integer n FROM sessions WHERE token_hash IN ($1,$2)",[expiredSession,activeSession]);
  assert.equal(q.rows[0].n,2,"Dry-run must not change any session");
  await assert.rejects(()=>purgeExpiredOperationalRows(pool,{env:{...env(),PROTESTO_RETENTION_APPROVED:"0"}}),
   /explicitly approved isolated CI rehearsal/);
  await assert.rejects(()=>purgeExpiredOperationalRows(pool,{env:env(),limit:1001}),/batch must be between/);
  const result=await purgeExpiredOperationalRows(pool,{env:env(),limit:250});
  assert.equal(result.mode,"synthetic-expiry-only");
  assert.ok(result.deletedSessions>=1);
  assert.ok(result.deletedRateLimits>=1);
  q=await pool.query("SELECT token_hash FROM sessions WHERE token_hash IN ($1,$2)",[expiredSession,activeSession]);
  assert.deepEqual(q.rows.map(x=>x.token_hash),[activeSession]);
  q=await pool.query("SELECT key_hash FROM request_rate_limits WHERE key_hash IN ($1,$2)",[expiredRate,activeRate]);
  assert.deepEqual(q.rows.map(x=>x.key_hash),[activeRate]);
  q=await pool.query("SELECT title,description FROM civic_cases WHERE id=$1",[caseId]);
  assert.equal(q.rowCount,1,"Private civic report must NOT be erased by operational cleanup");
  assert.match(q.rows[0].description,/Confidential synthetic content/);
  const again=await purgeExpiredOperationalRows(pool,{env:env(),limit:250});
  assert.ok(again.deletedSessions>=0);
  assert.ok(again.deletedRateLimits>=0);
 }finally{
  await pool.query("DELETE FROM sessions WHERE token_hash IN ($1,$2)",[expiredSession,activeSession]);
  await pool.query("DELETE FROM request_rate_limits WHERE key_hash IN ($1,$2)",[expiredRate,activeRate]);
  await pool.query("DELETE FROM civic_cases WHERE id=$1",[caseId]);
  await pool.query("DELETE FROM civic_users WHERE id=$1",[id]);
  await pool.end();
 }
});
