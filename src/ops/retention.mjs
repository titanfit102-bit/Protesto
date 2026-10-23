import {isolatedStagingBoundary} from "./staging-boundary.mjs";

// This is deliberately scoped to rows with explicit technical expiry dates.
// No content, votes, citizen submissions, audit entries or reviewer decisions
// are eligible for automatic deletion without a separately approved policy.
export const RETENTION_TABLES=Object.freeze(["sessions","request_rate_limits"]);

export function canApplySyntheticRetention(env) {
 return env?.PROTESTO_RETENTION_APPROVED==="1"&&isolatedStagingBoundary(env);
}

export async function expiredOperationalCounts(pool) {
 const r=await pool.query(`SELECT
  (SELECT count(*)::integer FROM sessions WHERE expires_at<=now()) AS expired_sessions,
  (SELECT count(*)::integer FROM request_rate_limits WHERE expires_at<=now()) AS expired_rate_limits`);
 return {expiredSessions:r.rows[0].expired_sessions,expiredRateLimits:r.rows[0].expired_rate_limits,
  mode:"read-only",scope:[...RETENTION_TABLES]};
}

export async function purgeExpiredOperationalRows(pool,{env,limit=250}={}) {
 if(!canApplySyntheticRetention(env))
  throw new Error("Retention mutations require an explicitly approved isolated CI rehearsal.");
 if(!Number.isSafeInteger(limit)||limit<1||limit>1000)
  throw new RangeError("Retention batch must be between 1 and 1000 rows per category.");
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  // Lock only expired rows and limit the destructive operation. Use SKIP
  // LOCKED to avoid blocking unrelated auth and request-rate activity.
  const sessions=await client.query(`WITH candidates AS (
    SELECT token_hash FROM sessions WHERE expires_at<=now()
    ORDER BY expires_at,token_hash LIMIT $1 FOR UPDATE SKIP LOCKED
   ), erased AS (
    DELETE FROM sessions WHERE token_hash IN (SELECT token_hash FROM candidates) RETURNING 1
   ) SELECT count(*)::integer AS n FROM erased`,[limit]);
  const rates=await client.query(`WITH candidates AS (
    SELECT key_hash FROM request_rate_limits WHERE expires_at<=now()
    ORDER BY expires_at,key_hash LIMIT $1 FOR UPDATE SKIP LOCKED
   ), erased AS (
    DELETE FROM request_rate_limits WHERE key_hash IN (SELECT key_hash FROM candidates) RETURNING 1
   ) SELECT count(*)::integer AS n FROM erased`,[limit]);
  await client.query("COMMIT");
  return {deletedSessions:sessions.rows[0].n,deletedRateLimits:rates.rows[0].n,
   mode:"synthetic-expiry-only",scope:[...RETENTION_TABLES]};
 }catch(error){try{await client.query("ROLLBACK");}catch{}throw error;}
 finally{client.release();}
}
