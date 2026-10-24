import test from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID,createHash} from "node:crypto";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {expiredOperationalCounts,purgeExpiredOperationalRows,canApplySyntheticRetention,RETENTION_TABLES} from "../src/ops/retention.mjs";

const exec=promisify(execFile);
const ROOT_CI_URL="postgres://postgres:postgres@127.0.0.1:5432/protesto";
const valid=(database,role,password,token)=>({
 GITHUB_ACTIONS:"true",NODE_ENV:"test",PROTESTO_STAGING_REHEARSAL:"1",
 PROTESTO_BACKUP_TEST:"1",PROTESTO_RETENTION_APPROVED:"1",
 DATABASE_URL:"postgres://"+role+":"+password+"@127.0.0.1:5432/"+database,
 PROTESTO_RETENTION_ATTESTATION:token,
 APP_ORIGIN:"http://127.0.0.1:4174"
});
const fake=()=>valid("protesto_ret_ci_123456789abc","protesto_rci_123456789abc",
 "synthetic-only-password","c".repeat(64));

test("retention policy fails closed and requires a unique disposable DB/role/token",()=>{
 const env=fake();
 assert.equal(canApplySyntheticRetention(env),true,"static input check is necessary, never sufficient");
 for(const broken of [
  {PROTESTO_RETENTION_APPROVED:"0"},{GITHUB_ACTIONS:"false"},
  {NODE_ENV:"production"},{NODE_ENV:undefined},
  {PROTESTO_STAGING_REHEARSAL:undefined},{PROTESTO_BACKUP_TEST:undefined},
  {PROTESTO_RETENTION_ATTESTATION:"short"},
  {DATABASE_URL:ROOT_CI_URL},
  {DATABASE_URL:"postgres://postgres:postgres@127.0.0.1:5432/protesto_ret_ci_123456789abc"},
  {DATABASE_URL:"postgres://protesto_rci_123456789abc:p@db.internal:5432/protesto_ret_ci_123456789abc"},
  {DATABASE_URL:"postgres://protesto_rci_123456789abc:p@127.0.0.1:5432/protesto"},
  {APP_ORIGIN:"https://protesto.example.org"}
 ]) assert.equal(canApplySyntheticRetention({...env,...broken}),false,JSON.stringify(broken));
 assert.deepEqual(RETENTION_TABLES,["sessions","request_rate_limits"]);
});

// Never target the ambient database for DELETE. A unique database is CREATED,
// migrated, populated with fictitious data, used once and then dropped.
test("F06: retention runs only in fresh disposable CI DB under least-privilege identity",
 {skip:!process.env.DATABASE_URL},async()=>{
 if(process.env.GITHUB_ACTIONS!=="true"||process.env.DATABASE_URL!==ROOT_CI_URL)
  throw Error("Refusing F06 integration: requires the exact dedicated GitHub Postgres fixture.");
 const {default:pg}=await import("pg");
 const suffix=randomBytes(6).toString("hex");
 const database="protesto_ret_ci_"+suffix;
 const role="protesto_rci_"+suffix;
 const password=randomBytes(24).toString("hex");
 const token=randomBytes(32).toString("hex");
 const env=valid(database,role,password,token);
 const adminURL=new URL(ROOT_CI_URL);adminURL.pathname="/postgres";
 const admin=new pg.Pool({connectionString:adminURL.toString(),max:1});
 const disposableAdminURL=new URL(ROOT_CI_URL);disposableAdminURL.pathname="/"+database;
 let createdDB=false,createdRole=false,scratch,restricted,other;
 try{
  // Name is unguessable and CREATE fails on collision: never re-use an existing DB.
  await admin.query('CREATE DATABASE "'+database+'"');
  createdDB=true;
  scratch=new pg.Pool({connectionString:disposableAdminURL.toString(),max:2});
  await exec(process.execPath,["tools/migrate.mjs"],
   {env:{...process.env,DATABASE_URL:disposableAdminURL.toString()},maxBuffer:1024*1024});
  await admin.query('CREATE ROLE "'+role+'" LOGIN PASSWORD \''+password+'\'');
  createdRole=true;
  await admin.query('REVOKE ALL ON DATABASE "'+database+'" FROM PUBLIC');
  await admin.query('GRANT CONNECT ON DATABASE "'+database+'" TO "'+role+'"');
  await scratch.query("CREATE SCHEMA retention_ci");
  await scratch.query("CREATE TABLE retention_ci.attestation (id integer PRIMARY KEY CHECK(id=1),token_sha256 bytea NOT NULL)");
  await scratch.query("INSERT INTO retention_ci.attestation(id,token_sha256) VALUES(1,$1)",
   [createHash("sha256").update(token).digest()]);
  // Function is owned by admin, with fixed search_path and allowlisted tables.
  // No direct SQL DELETE grants are ever issued to the retention principal.
  const fnSQL=[
   "CREATE FUNCTION retention_ci.purge_expired(batch_limit integer)",
   "RETURNS TABLE(deleted_sessions integer,deleted_rate_limits integer)",
   "LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $fn$",
   "BEGIN",
   " IF batch_limit IS NULL OR batch_limit < 1 OR batch_limit > 1000 THEN RAISE EXCEPTION 'Unsafe expiry limit'; END IF;",
   " WITH candidates AS (",
   "  SELECT token_hash FROM public.sessions WHERE expires_at<=now()",
   "  ORDER BY expires_at,token_hash LIMIT batch_limit FOR UPDATE SKIP LOCKED",
   " ), removed AS (",
   "  DELETE FROM public.sessions WHERE token_hash IN (SELECT token_hash FROM candidates) RETURNING 1",
   " ) SELECT count(*)::integer INTO deleted_sessions FROM removed;",
   " WITH candidates AS (",
   "  SELECT key_hash FROM public.request_rate_limits WHERE expires_at<=now()",
   "  ORDER BY expires_at,key_hash LIMIT batch_limit FOR UPDATE SKIP LOCKED",
   " ), removed AS (",
   "  DELETE FROM public.request_rate_limits WHERE key_hash IN (SELECT key_hash FROM candidates) RETURNING 1",
   " ) SELECT count(*)::integer INTO deleted_rate_limits FROM removed;",
   " RETURN NEXT;",
   "END",
   "$fn$"
  ].join("\n");
  await scratch.query(fnSQL);
  await scratch.query("REVOKE ALL ON SCHEMA retention_ci FROM PUBLIC");
  await scratch.query("REVOKE ALL ON FUNCTION retention_ci.purge_expired(integer) FROM PUBLIC");
  await scratch.query('GRANT USAGE ON SCHEMA retention_ci TO "'+role+'"');
  await scratch.query('GRANT SELECT ON retention_ci.attestation TO "'+role+'"');
  await scratch.query('GRANT EXECUTE ON FUNCTION retention_ci.purge_expired(integer) TO "'+role+'"');
  await scratch.query('GRANT SELECT ON public.sessions,public.request_rate_limits TO "'+role+'"');
  restricted=new pg.Pool({connectionString:env.DATABASE_URL,max:2});
  const identity=await restricted.query("SELECT current_database() AS db,current_user AS who");
  assert.equal(identity.rows[0].db,database);
  assert.equal(identity.rows[0].who,role);
  const grants=await restricted.query(
   "SELECT has_table_privilege(current_user,'public.civic_cases','DELETE') AS civic_delete,"+
   "has_table_privilege(current_user,'public.sessions','DELETE') AS session_delete,"+
   "has_function_privilege(current_user,'retention_ci.purge_expired(integer)','EXECUTE') AS expiry_execute");
  assert.deepEqual(grants.rows[0],
   {civic_delete:false,session_delete:false,expiry_execute:true});
  await assert.rejects(restricted.query("DELETE FROM public.civic_cases WHERE false"),
   error=>error.code==="42501","cannot delete civic records");
  await assert.rejects(restricted.query("DELETE FROM public.sessions WHERE false"),
   error=>error.code==="42501","cannot delete sessions outside bounded function");

  const userId=randomUUID(),caseId=randomUUID();
  const expiredSession=randomBytes(32).toString("hex"),liveSession=randomBytes(32).toString("hex");
  const expiredRate=randomBytes(32).toString("hex"),liveRate=randomBytes(32).toString("hex");
  await scratch.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,'reporter')",
   [userId,"f06-"+userId+"@example.org","synthetic-hash-not-for-login"]);
  await scratch.query("INSERT INTO civic_cases(id,author_id,title,description,area,category) VALUES($1,$2,$3,$4,$5,$6)",
   [caseId,userId,"Synthetic retention fixture",
    "Entirely fictional civic case to assert retention never touches user data.",
    "Test region","Mjedis"]);
  await scratch.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$3,now()-interval '1 day'),($2,$3,now()+interval '1 day')",
   [expiredSession,liveSession,userId]);
  await scratch.query("INSERT INTO request_rate_limits(key_hash,hits,expires_at) VALUES($1,2,now()-interval '1 day'),($2,1,now()+interval '1 day')",
   [expiredRate,liveRate]);

  const before=await expiredOperationalCounts(restricted);
  assert.ok(before.expiredSessions>=1&&before.expiredRateLimits>=1);
  assert.equal(before.mode,"read-only");
  await assert.rejects(()=>purgeExpiredOperationalRows(restricted,{env:{...env,PROTESTO_RETENTION_APPROVED:"0"}}),
   /approved attested disposable/);
  await assert.rejects(()=>purgeExpiredOperationalRows(restricted,{env,limit:1001}),/batch must be between/);
  // A connected pool into the original fixture is not a substitute for the
  // scratch database, even when supplied with valid-looking approved env.
  other=new pg.Pool({connectionString:ROOT_CI_URL,max:1});
  await assert.rejects(()=>purgeExpiredOperationalRows(other,{env}),
   /retention_ci|identity|does not exist|permission denied/i);
  await assert.rejects(()=>purgeExpiredOperationalRows(restricted,{
   env:{...env,PROTESTO_RETENTION_ATTESTATION:"a".repeat(64)}}),
   /identity mismatch/);
  let q=await scratch.query("SELECT token_hash FROM sessions WHERE token_hash=$1",[expiredSession]);
  assert.equal(q.rowCount,1,"negative cases must not delete rows");
  const result=await purgeExpiredOperationalRows(restricted,{env,limit:250});
  assert.deepEqual({sessions:result.deletedSessions,rates:result.deletedRateLimits},
   {sessions:1,rates:1});
  assert.equal(result.mode,"synthetic-expiry-only");
  const again=await purgeExpiredOperationalRows(restricted,{env,limit:250});
  assert.equal(again.deletedSessions,0);
  assert.equal(again.deletedRateLimits,0);
  const remaining=await scratch.query("SELECT token_hash FROM sessions WHERE user_id=$1",[userId]);
  assert.deepEqual(remaining.rows.map(row=>row.token_hash),[liveSession]);
  const rates=await scratch.query("SELECT key_hash FROM request_rate_limits WHERE key_hash=ANY($1::text[])",[[liveRate,expiredRate]]);
  assert.deepEqual(rates.rows.map(row=>row.key_hash),[liveRate]);
  const civic=await scratch.query("SELECT description FROM civic_cases WHERE id=$1",[caseId]);
  assert.equal(civic.rowCount,1);
  assert.match(civic.rows[0].description,/Entirely fictional/);
 }finally{
  if(other)await other.end();
  if(restricted)await restricted.end();
  if(scratch)await scratch.end();
  if(createdDB)await admin.query('DROP DATABASE "'+database+'"');
  if(createdRole)await admin.query('DROP ROLE "'+role+'"');
  await admin.end();
 }
});
