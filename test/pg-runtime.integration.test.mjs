import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {createServer} from "node:net";
import {once} from "node:events";
import {setTimeout as delay} from "node:timers/promises";
import pg from "pg";
import {PILOT_PG_LIMITS,createPilotPool} from "../src/server/pg-runtime.mjs";

// F04 creates synthetic connections and intentionally terminates only its own
// backend. Never run against a non-CI database or externally forwarded target.
const inDisposableCI=(()=>{
 try{
  const u=new URL(process.env.DATABASE_URL||"");
  return process.env.GITHUB_ACTIONS==="true"&&u.hostname==="127.0.0.1"&&
   u.port==="5432"&&u.pathname==="/protesto";
 }catch{return false;}
})();

test("F04: pilot pool has bounded connections and server-side SQL deadlines",async()=>{
 assert.equal(PILOT_PG_LIMITS.max,10);
 assert.ok(PILOT_PG_LIMITS.connectionTimeoutMillis>0);
 assert.ok(PILOT_PG_LIMITS.statement_timeout>0);
 assert.ok(PILOT_PG_LIMITS.lock_timeout>0);
 assert.ok(PILOT_PG_LIMITS.lock_timeout<PILOT_PG_LIMITS.statement_timeout);
 assert.ok(PILOT_PG_LIMITS.idle_in_transaction_session_timeout>0);
 assert.ok(PILOT_PG_LIMITS.query_timeout>=PILOT_PG_LIMITS.statement_timeout);
});

test("F04: server-side statement and lock timeouts cancel synthetic PostgreSQL work",
 {skip:!inDisposableCI},async()=>{
 const clientPool=new pg.Pool({connectionString:process.env.DATABASE_URL,
  ...PILOT_PG_LIMITS,statement_timeout:300,lock_timeout:160,query_timeout:1500,max:2});
 const blockerPool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1});
 let blocker;
 try{
  await assert.rejects(clientPool.query("SELECT pg_sleep(0.9)"),err=>err.code==="57014",
   "server must cancel long statements, not leave an abandoned JS Promise");
  blocker=await blockerPool.connect();
  await blocker.query("BEGIN");
  const key=Number(BigInt(Date.now())%1000000000n)+1000000;
  await blocker.query("SELECT pg_advisory_xact_lock($1)",[key]);
  await assert.rejects(clientPool.query("SELECT pg_advisory_xact_lock($1)",[key]),
   err=>err.code==="55P03","waiting for a DB lock must have its own shorter limit");
  await blocker.query("ROLLBACK");
  blocker.release();blocker=null;
  assert.equal((await clientPool.query("SELECT 1 AS n")).rows[0].n,1,
   "pool must recover after cancelled statements");
 }finally{
  if(blocker){try{await blocker.query("ROLLBACK");}catch{}blocker.release();}
  await clientPool.end();
  await blockerPool.end();
 }
});

test("F04: idle client disconnection is handled without leaking DB details",
 {skip:!inDisposableCI},async()=>{
 let signal;
 const idleError=new Promise(resolve=>{signal=resolve;});
 const pool=createPilotPool(process.env.DATABASE_URL,{onIdleError:code=>signal(code)});
 const admin=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1});
 try{
  const id=(await pool.query("SELECT pg_backend_pid()::integer AS pid")).rows[0].pid;
  const result=await admin.query("SELECT pg_terminate_backend($1) AS done",[id]);
  assert.equal(result.rows[0].done,true);
  const code=await Promise.race([idleError,delay(3000).then(()=>null)]);
  assert.ok(code,"a terminated idle client must be observed by the Pool error handler");
  assert.match(code,/^[A-Z0-9_]{1,10}$/);
  assert.equal((await pool.query("SELECT 1 AS n")).rows[0].n,1,
   "a replacement connection must support another query");
 }finally{await pool.end();await admin.end();}
});

test("F04: private pilot returns bounded readiness and exits cleanly on SIGTERM",
 {skip:!inDisposableCI},async()=>{
 const socket=createServer();
 await new Promise(resolve=>socket.listen(0,"127.0.0.1",resolve));
 const port=socket.address().port;
 await new Promise(resolve=>socket.close(resolve));
 const origin="http://127.0.0.1:"+port;
 const proc=spawn(process.execPath,["tools/pilot-server.mjs"],{
  env:{...process.env,PORT:String(port),HOST:"127.0.0.1",APP_ORIGIN:origin,
   PROTESTO_RATE_LIMIT_SECRET:"synthetic-f04-private-runtime-rate-secret-2026",
   PROTESTO_DIALOGUE_SECRET:"synthetic-f04-private-runtime-dialogue-secret-2026"},
  stdio:["ignore","pipe","pipe"]
 });
 let logs="";
 proc.stdout.on("data",buf=>logs+=buf.toString());
 proc.stderr.on("data",buf=>logs+=buf.toString());
 let exited=false;
 const exit=once(proc,"exit").then(args=>{exited=true;return args;});
 try{
  let up=false;
  for(let attempt=0;attempt<70;attempt++){
   if(exited)throw Error("pilot exited before readiness: "+logs.slice(-900));
   try{
    const health=await fetch(origin+"/api/health");
    const ready=await fetch(origin+"/api/ready");
    if(health.status===200&&ready.status===200){up=true;break;}
   }catch{}
   await delay(100);
  }
  assert.equal(up,true,"HTTP health and database readiness must succeed");
  proc.kill("SIGTERM");
  const result=await Promise.race([exit,delay(7500).then(()=>null)]);
  assert.ok(result,"SIGTERM should drain the HTTP server and pool promptly");
  assert.equal(result[0],0,"normal stop must exit with code 0");
  assert.equal(result[1],null);
  assert.ok(!logs.includes("postgres://"),"logs must not include DB connection secrets");
 }finally{
  if(!exited){proc.kill("SIGKILL");await exit.catch(()=>{});}
 }
});
