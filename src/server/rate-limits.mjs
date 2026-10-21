import {createHmac} from "node:crypto";

/**
 * Database-backed quotas work across multiple Node instances sharing PostgreSQL.
 * Identifiers are HMACed before storage; do not record raw emails, IPs or session tokens.
 * Use a long stable PROTESTO_RATE_LIMIT_SECRET, different from all user passwords.
 */
export function rateKey(secret,scope,identity){
 if(typeof secret!=="string"||secret.length<32)throw new Error("PROTESTO_RATE_LIMIT_SECRET must be at least 32 characters.");
 if(typeof scope!=="string"||!scope||typeof identity!=="string"||!identity)throw new Error("Invalid rate-limit identity.");
 return createHmac("sha256",secret).update(scope+"\0"+identity).digest("hex");
}
export async function consumeRateLimit(pool,keyHash,{limit,windowSeconds}){
 if(!/^[0-9a-f]{64}$/.test(keyHash))throw Error("Invalid limit key hash.");
 if(!Number.isSafeInteger(limit)||limit<1||!Number.isSafeInteger(windowSeconds)||windowSeconds<1)throw Error("Invalid rate limit configuration.");
 const statement=[
  "INSERT INTO request_rate_limits(key_hash,hits,expires_at)",
  "VALUES($1,1,now()+($2::integer * interval '1 second'))",
  "ON CONFLICT(key_hash) DO UPDATE SET",
  "hits=CASE WHEN request_rate_limits.expires_at<=now() THEN 1 ELSE request_rate_limits.hits+1 END,",
  "expires_at=CASE WHEN request_rate_limits.expires_at<=now() THEN now()+($2::integer * interval '1 second') ELSE request_rate_limits.expires_at END",
  "RETURNING hits, GREATEST(1,CEIL(EXTRACT(EPOCH FROM (expires_at-now()))))::integer AS retry_seconds"
 ].join(" ");
 const result=await pool.query(statement,[keyHash,windowSeconds]);
 return {allowed:result.rows[0].hits<=limit,remaining:Math.max(0,limit-result.rows[0].hits),retrySeconds:result.rows[0].retry_seconds};
}
