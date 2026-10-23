import {createHash,timingSafeEqual} from "node:crypto";

// Only strictly bounded synthetic operational expiry. Actual personal-data
// retention/erasure is NOT authorized by this module.
export const RETENTION_TABLES=Object.freeze(["sessions","request_rate_limits"]);
const DB_PATTERN=/^protesto_ret_ci_[0-9a-f]{12}$/;
const ROLE_PATTERN=/^protesto_rci_[0-9a-f]{12}$/;
const TOKEN_PATTERN=/^[0-9a-f]{64}$/;

// This is a preliminary rejection rule, not proof of database isolation.
// Physical and connection identity are verified INSIDE the transaction.
export function canApplySyntheticRetention(env){
 try{
  if(!env||env.GITHUB_ACTIONS!=="true"||env.NODE_ENV!=="test"||
    env.PROTESTO_STAGING_REHEARSAL!=="1"||
    env.PROTESTO_BACKUP_TEST!=="1"||
    env.PROTESTO_RETENTION_APPROVED!=="1"||
    env.APP_ORIGIN!=="http://127.0.0.1:4174"||
    !TOKEN_PATTERN.test(env.PROTESTO_RETENTION_ATTESTATION||""))return false;
  const u=new URL(env.DATABASE_URL);
  return (u.protocol==="postgres:"||u.protocol==="postgresql:")&&
   u.hostname==="127.0.0.1"&&u.port==="5432"&&
   DB_PATTERN.test(u.pathname.slice(1))&&
   ROLE_PATTERN.test(decodeURIComponent(u.username))&&
   u.password.length>0&&!u.search&&!u.hash;
 }catch{return false;}
}

export async function expiredOperationalCounts(pool){
 const r=await pool.query(`SELECT
  (SELECT count(*)::integer FROM sessions WHERE expires_at<=now()) AS expired_sessions,
  (SELECT count(*)::integer FROM request_rate_limits WHERE expires_at<=now()) AS expired_rate_limits`);
 return {expiredSessions:r.rows[0].expired_sessions,expiredRateLimits:r.rows[0].expired_rate_limits,
  mode:"read-only",scope:[...RETENTION_TABLES]};
}

export async function purgeExpiredOperationalRows(pool,{env,limit=250}={}){
 if(!canApplySyntheticRetention(env))
  throw new Error("Retention mutations require an explicitly approved attested disposable CI database.");
 if(!Number.isSafeInteger(limit)||limit<1||limit>1000)
  throw new RangeError("Retention batch must be between 1 and 1000 rows per category.");
 const expected=new URL(env.DATABASE_URL);
 const database=expected.pathname.slice(1),role=decodeURIComponent(expected.username);
 const tokenHash=createHash("sha256").update(env.PROTESTO_RETENTION_ATTESTATION,"utf8").digest();
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  await client.query("SET LOCAL statement_timeout='5000ms'");
  await client.query("SET LOCAL lock_timeout='2000ms'");
  // Check the CONNECTED database/role and an unpredictable per-run marker,
  // not just an arbitrary caller-provided DATABASE_URL or CI boolean.
  const identity=await client.query(`SELECT current_database() AS database_name,
   current_user AS role_name, r.rolsuper,r.rolcreatedb,r.rolcreaterole,
   a.token_sha256
   FROM pg_roles r
   CROSS JOIN retention_ci.attestation a
   WHERE r.rolname=current_user AND a.id=1`);
  const actual=identity.rows[0];
  const supplied=actual?.token_sha256;
  const marker=Buffer.isBuffer(supplied)?supplied:Buffer.from(supplied||[]);
  if(identity.rowCount!==1||actual.database_name!==database||actual.role_name!==role||
   actual.rolsuper!==false||actual.rolcreatedb!==false||actual.rolcreaterole!==false||
   marker.length!==tokenHash.length||!timingSafeEqual(marker,tokenHash)){
   throw new Error("Refusing retention: connected database, role or per-run identity mismatch.");
  }
  // The connection has only EXECUTE on a purpose-specific SECURITY DEFINER
  // routine. No direct DELETE/UPDATE privileges on any user-data table.
  const result=await client.query(
   "SELECT deleted_sessions,deleted_rate_limits FROM retention_ci.purge_expired($1::integer)",
   [limit]
  );
  await client.query("COMMIT");
  return {deletedSessions:result.rows[0].deleted_sessions,
   deletedRateLimits:result.rows[0].deleted_rate_limits,
   mode:"synthetic-expiry-only",scope:[...RETENTION_TABLES]};
 }catch(error){try{await client.query("ROLLBACK");}catch{}throw error;}
 finally{client.release();}
}
