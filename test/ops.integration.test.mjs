import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {hashPassword} from "../src/server/security.mjs";
import {createPilotServer} from "../src/server/app.mjs";
test("operational counts require admin and exclude identities",{skip:!process.env.DATABASE_URL},async()=>{
 const {default:pg}=await import("pg"),pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:3});
 const origin="http://127.0.0.1:4199",server=createPilotServer(pool,{origin,rateLimitSecret:"synthetic-ops-limit-secret-longer-than-32",dialogueSecret:"synthetic-ops-dialogue-secret-longer-than-32"});
 const admin={id:randomUUID(),email:"ops-"+randomUUID().slice(0,8)+"@example.org",password:"AdminOpsSecretPassword!123"};
 const reporter={id:randomUUID(),email:"ops-reporter-"+randomUUID().slice(0,8)+"@example.org",password:"ReporterOpsSecretPassword!123"};
 const req=async(path,{method="GET",cookie,body}={})=>{
  const headers={};if(cookie)headers.Cookie=cookie;
  if(method==="POST")Object.assign(headers,{"Content-Type":"application/json",Origin:origin,"X-Protesto-Request":"1"});
  const r=await fetch(origin+path,{method,headers,body:body?JSON.stringify(body):undefined});
  return {status:r.status,json:await r.json(),cookie:r.headers.get("set-cookie")};
 };
 try{
  for(const account of [admin,reporter])await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",
   [account.id,account.email,hashPassword(account.password),account===admin?"admin":"reporter"]);
  await new Promise(resolve=>server.listen(4199,"127.0.0.1",resolve));
  assert.equal((await req("/api/ops/status")).status,401);
  const logins=[];
  for(const u of [admin,reporter]){
   const x=await req("/api/auth/login",{method:"POST",body:{email:u.email,password:u.password}});
   assert.equal(x.status,200);logins.push(x.cookie.split(";")[0]);
  }
  assert.equal((await req("/api/ops/status",{cookie:logins[1]})).status,403);
  const x=await req("/api/ops/status",{cookie:logins[0]});
  assert.equal(x.status,200);
  assert.deepEqual(Object.keys(x.json.counts),["casesPending","correctionsPending","appealsPending","responsesPending","activeSessions","migrations"]);
  assert.equal(x.json.counts.migrations,15);
  assert.ok(Object.values(x.json.counts).every(Number.isSafeInteger));
  assert.ok(!JSON.stringify(x.json).includes(admin.email));
  assert.ok(!JSON.stringify(x.json).includes(reporter.email));
 }finally{await new Promise(resolve=>server.close(resolve));await pool.end();}
});
