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
  r=await send("/api/cases",{method:"POST",body:sample});assert.equal(r.status,401);
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
  r=await send("/api/dossiers/"+caseId+"/sources");
  assert.equal(r.status,404); // pending dossier is private
  r=await send("/api/dossiers/"+caseId+"/sources",{cookie:reporterCookie});
  assert.equal(r.status,200);
  assert.equal(r.json.items.length,1);
  const sourceId=r.json.items[0].id;
  assert.equal(r.json.items[0].state,"pending");
  r=await send("/api/dossiers/"+caseId+"/sources/"+sourceId+"/review",{method:"POST",cookie:reporterCookie,body:{decision:"accepted",note:"Vetëverifikimi duhet të refuzohet gjithmonë."}});
  assert.equal(r.status,403);
  r=await send("/api/dossiers/"+caseId+"/sources/"+sourceId+"/review",{method:"POST",cookie:reviewCookie,body:{decision:"accepted",note:"Burimi u hap dhe përputhja u kontrollua manualisht."}});
  assert.equal(r.status,200);
  r=await send("/api/dossiers/"+caseId+"/sources/"+sourceId+"/review",{method:"POST",cookie:reviewCookie,body:{decision:"accepted",note:"Vendim i dyfishtë nuk lejohet."}});
  assert.equal(r.status,409);

  r=await send("/api/review/"+caseId,{method:"POST",cookie:reviewCookie,body:{decision:"published",note:"Short"}});assert.equal(r.status,422);
  const checklist={sourceReviewed:true,privacyReviewed:true,replyConsidered:true};
  r=await send("/api/review/"+caseId,{method:"POST",cookie:reviewCookie,body:{decision:"published",note:"Burimi u verifikua, por mungon checklist."}});
  assert.equal(r.status,422);
  r=await send("/api/review/"+caseId,{method:"POST",cookie:reviewCookie,body:{decision:"published",note:"Burimi u verifikua dhe është i përshtatshëm për demonstrim.",checks:checklist}});assert.equal(r.status,200);
  r=await send("/api/review/"+caseId,{method:"POST",cookie:reviewCookie,body:{decision:"rejected",note:"A second decision must be rejected."}});assert.equal(r.status,409);
  r=await send("/api/public/cases");assert.ok(r.json.items.some(x=>x.id===caseId));
  r=await send("/api/dossiers/"+caseId+"/sources");
  assert.equal(r.status,200);assert.equal(r.json.items.length,1);
  assert.equal(r.json.items[0].state,"accepted");
  r=await send("/api/corrections",{method:"POST",cookie:reporterCookie,body:{caseId,reason:"Kërkoj një kontroll tjetër mbi informacionin e paraqitur në këtë dosje."}});
  assert.equal(r.status,201);const correctionId=r.json.item.id;
  r=await send("/api/corrections/queue",{cookie:reporterCookie});assert.equal(r.status,403);
  r=await send("/api/corrections/queue",{cookie:reviewCookie});assert.equal(r.status,200);
  assert.ok(r.json.items.some(x=>x.id===correctionId));
  r=await send("/api/corrections/review/"+correctionId,{method:"POST",cookie:reporterCookie,body:{decision:"accepted",note:"Unë nuk mund ta miratoj kërkesën time për korrigjim."}});
  assert.equal(r.status,403);
  r=await send("/api/corrections/review/"+correctionId,{method:"POST",cookie:reviewCookie,body:{decision:"rejected",note:"Kërkesa nuk përmban prova të reja të mjaftueshme."}});
  assert.equal(r.status,200);
  r=await send("/api/public/cases");assert.ok(r.json.items.some(x=>x.id===caseId));
  const audit=await pool.query("SELECT count(*)::integer AS n FROM audit_entries WHERE object_id=$1",[caseId]);
  assert.equal(audit.rows[0].n,1);
  r=await send("/api/archive/"+caseId,{method:"POST",cookie:reporterCookie,body:{note:"This should fail due to reporter role."}});
  assert.equal(r.status,403);
  r=await send("/api/archive/"+caseId,{method:"POST",cookie:reviewCookie,body:{note:"Retract the article pending an additional independent source review."}});
  assert.equal(r.status,200);assert.equal(r.json.item.state,"archived");
  r=await send("/api/public/cases");assert.ok(!r.json.items.some(x=>x.id===caseId));
  const withdrawn=await pool.query("SELECT count(*)::integer AS n FROM retraction_history WHERE case_id=$1",[caseId]);
  assert.equal(withdrawn.rows[0].n,1);
  const newAction={
   kind:"initiative",type:"Diskutim komunitar",title:"Diskutim demonstrues për hapësirat",
   area:"Zona e testit",description:"Nismë qytetare fiktive për të testuar procesin e verifikimit."
  };
  r=await send("/api/actions",{method:"POST",cookie:reporterCookie,body:newAction});
  assert.equal(r.status,201);assert.equal(r.json.item.state,"pending");const actionId=r.json.item.id;
  r=await send("/api/actions/mine",{cookie:reporterCookie});assert.ok(r.json.items.some(x=>x.id===actionId));
  r=await send("/api/actions/review/queue",{cookie:reporterCookie});assert.equal(r.status,403);
  r=await send("/api/actions/public");assert.ok(!r.json.items.some(x=>x.id===actionId));
  r=await send("/api/actions/review/"+actionId,{method:"POST",cookie:reviewCookie,body:{decision:"published",note:"Nisma u kontrollua nga redaktori i testit."}});
  assert.equal(r.status,200);
  r=await send("/api/actions/public");assert.ok(r.json.items.some(x=>x.id===actionId));
  r=await send("/api/actions/archive/"+actionId,{method:"POST",cookie:reviewCookie,body:{note:"Publikimi u tërhoq për kontroll të mëtejshëm."}});
  assert.equal(r.status,200);
  r=await send("/api/actions/public");assert.ok(!r.json.items.some(x=>x.id===actionId));
  r=await send("/api/actions",{method:"POST",cookie:reporterCookie,body:{
   kind:"gathering",title:"Tubim paqësor fiktiv për testim",
   area:"Sheshi i demonstrimit",date:"2027-04-15",
   description:"Tubim demonstrues për të testuar regjistrimin e një ngjarjeje pa pjesëmarrës realë."
  }});
  assert.equal(r.status,201);

  // A second published case can be withdrawn by an accepted correction request.
  r=await send("/api/cases",{method:"POST",cookie:reporterCookie,body:{...sample,title:"Rast i dytë për korrigjime"}});
  assert.equal(r.status,201);const secondId=r.json.item.id;
  r=await send("/api/dossiers/"+secondId+"/sources",{cookie:reviewCookie});
  const secondSource=r.json.items[0].id;
  r=await send("/api/dossiers/"+secondId+"/sources/"+secondSource+"/review",{method:"POST",cookie:reviewCookie,body:{decision:"accepted",note:"Burimi fiktiv i testit kaloi verifikimin."}});
  assert.equal(r.status,200);
  r=await send("/api/review/"+secondId,{method:"POST",cookie:reviewCookie,body:{decision:"published",note:"Kontrolli editorial për testin u përfundua.",checks:checklist}});
  assert.equal(r.status,200);
  r=await send("/api/corrections",{method:"POST",cookie:reporterCookie,body:{caseId:secondId,reason:"Dokumenti është kundërshtuar dhe rasti kërkon tërheqje për verifikim të ri."}});
  assert.equal(r.status,201);const secondCorrection=r.json.item.id;
  r=await send("/api/corrections/review/"+secondCorrection,{method:"POST",cookie:reviewCookie,body:{decision:"accepted",note:"Për arsye të provave të kundërta publikohet tërheqja."}});
  assert.equal(r.status,200);
  r=await send("/api/public/cases");assert.ok(!r.json.items.some(x=>x.id===secondId));
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