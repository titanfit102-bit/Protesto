import pg from "pg";

// Only the private pilot HTTP runtime uses these limits. Migration and backup
// tooling have separate, deliberately reviewed operational budgets.
export const PILOT_PG_LIMITS=Object.freeze({
 max:10,
 connectionTimeoutMillis:3000,
 idleTimeoutMillis:10000,
 statement_timeout:12000,
 lock_timeout:3000,
 idle_in_transaction_session_timeout:15000,
 query_timeout:15000
});

export function createPilotPool(connectionString,{onIdleError}={}){
 if(typeof connectionString!=="string"||!connectionString)throw Error("Mungon DATABASE_URL.");
 const pool=new pg.Pool({connectionString,...PILOT_PG_LIMITS});
 // node-postgres emits idle-client errors on Pool. Without this listener an
 // ordinary database restart/network loss can crash the Node process.
 pool.on("error",error=>{
  // Do not log raw DB errors: they may contain connection details or queries.
  const code=typeof error?.code==="string"&&/^[A-Z0-9_]{1,10}$/.test(error.code)?error.code:"UNKNOWN";
  if(typeof onIdleError==="function"){
   try{onIdleError(code);}catch{ /* observability must never crash the pilot */ }
  }else{
   console.error("Protesto PostgreSQL idle-client error code:",code);
  }
 });
 return pool;
}

// HTTP drains before the pool is ended, so in-flight requests cannot acquire
// connections after pool shutdown has started. On grace expiry, terminate HTTP
// sockets; PostgreSQL's server-side statement timeout bounds active queries.
export async function closePilotRuntime(server,pool,{graceMs=20000}={}){
 if(!Number.isSafeInteger(graceMs)||graceMs<1)throw Error("Invalid shutdown grace.");
 let timeout;
 try{
  if(server.listening){
   await new Promise((resolve,reject)=>{
    server.close(error=>error?reject(error):resolve());
    server.closeIdleConnections?.();
    timeout=setTimeout(()=>server.closeAllConnections?.(),graceMs);
    timeout.unref?.();
   });
  }
 }finally{
  if(timeout)clearTimeout(timeout);
  await pool.end();
 }
}
