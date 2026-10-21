import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {hashPassword} from "../src/server/security.mjs";
import {createPilotServer} from "../src/server/app.mjs";
const enabled=!!process.env.DATABASE_URL;
test("PostgreSQL private pilot: reporting, session security and editorial separation",{skip:!enabled},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:8});
 const origin="http://127.0.0.1:4174";
 const server=createPilotServer(pool,{origin});
 const suffix=randomUUID().slice(0,8);
 const reporter={id:randomUUID(),email:"reporter-"+suffix+"@example.org",password:"ReporterSecret!123"};
 const reviewer={id:randomUUID(),email:"reviewer-"+suffix+"@example.org",password:"ReviewerSecret!123"};
 for(const u of [reporter,reviewer]){
  await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",[u.id,u.email,hashPassword(u.password),u===reporter?"reporter":"reviewer"]);
 }
 await new Promise((resolve,reject)=>server.listen(4174,"127.0.0.1",e=>e?reject(e):resolve()));
 const send=async(path,{method="GET",body,cookie,originHeader=true,extraHeaders={}}={})=>{
  const headers={...extraHeaders};
  if(method==="POST"){
   headers["Content-Type"]="application/json";headers["X-Protesto-Request"]="1";
   if(originHeader)headers.Origin=origin;
  }
  if(cookie)headers.Cookie=cookie;
  const res=await fetch(origin+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  return {status:res.status,json:await res.json(),cookie:res.headers.get("set-cookie"),headers:res.headers};
 };
 try{
  let r=await send("/api/public/cases");
  assert.equal(r.status,200);assert.ok(Array.isArray(r.json.items));
  r=await send("/api/me");assert.equal(r.status,401);
  const sample={
   title:"Raportim testimi i ndriçimit",description:"Raportim artificial për testimin e verifikimit dhe të drejtës së përgjigjes.",
   area:"Zona e testit",category:"Infrastrukturë",source:"https://example.org/source"
  };
  r=await send("/api/cases",{method:"POST",body:sample});assert.equal(r.status,403);
  r=await send("/api/auth/login",{method:"POST",body:{email:reporter.email,password:"incorrect"}});assert.equal(r.status,401);
  r=await send("/api/auth/login",{method:"POST",body:{email:reporter.email,password:reporter.password}});
  assert.equal(r.status,200);assert.match(r.cookie,/HttpOnly/);
  const reporterCookie=r.cookie.split(";")[0];
  r=await send("/api/cases",{method:"POST",body:sample,cookie:reporterCookie,originHeader:false});assert.equal(r.status,403);
  r=await send("/api/cases",{method:"POST",body:{...sample,title:"bad"},cookie:reporterCookie});assert.equal(r.status,422);
  r=await send("/api/cases",{method:"POST",body:sample,cookie:reporterCookie});assert.equal(r.status,201);
  assert.equal(r.json.item.state,"pending");const caseId=r.json.item.id;
  r=await send("/api/cases/mine",{cookie:reporterCookie});assert.equal(r.status,200);
  assert.ok(r.json.items.some(x=>x.id===caseId));
  r=await send("/api/review/queue",{cookie:reporterCookie});assert.equal(r.status,403);
  r=await send("/api/public/cases");assert.ok(!r.json.items.some(x=>x.id===caseId));
  r=await send("/api/auth/login",{method:"POST",body:{email:reviewer.email,password:reviewer.password}});
  assert.equal(r.status,200);
  const reviewCookie=r.cookie.split(";")[0];
  r=await send("/api/review/queue",{cookie:reviewCookie});assert.equal(r.status,200);
  assert.ok(r.json.items.some(x=>x.id===caseId));
  r=await send("/api/review/"+caseId,{method:"POST",cookie:reviewCookie,body:{decision:"published",note:"Short"}});assert.equal(r.status,422);
  r=await send("/api/review/"+caseId,{method:"POST",cookie:reviewCookie,body:{decision:"published",note:"Burimi u verifikua dhe është i përshtatshëm për demonstrim."}});assert.equal(r.status,200);
  r=await send("/api/review/"+caseId,{method:"POST",cookie:reviewCookie,body:{decision:"rejected",note:"A second decision must be rejected."}});assert.equal(r.status,409);
  r=await send("/api/public/cases");assert.ok(r.json.items.some(x=>x.id===caseId));
  const audit=await pool.query("SELECT count(*)::integer AS n FROM audit_entries WHERE object_id=$1",[caseId]);
  assert.equal(audit.rows[0].n,1);
  r=await send("/api/auth/logout",{method:"POST",cookie:reporterCookie,body:{}});
  assert.equal(r.status,200);
  r=await send("/api/me",{cookie:reporterCookie});assert.equal(r.status,401);
  const httpPage=await fetch(origin+"/pilot.html");assert.equal(httpPage.status,200);
  assert.match(httpPage.headers.get("content-security-policy"),/script-src 'self'/);
 }finally{
  await new Promise(resolve=>server.close(resolve));
  await pool.end();
 }
});