import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {hashPassword} from "../src/server/security.mjs";
import {createPilotServer} from "../src/server/app.mjs";
import {rateKey,consumeRateLimit} from "../src/server/rate-limits.mjs";
const enabled=!!process.env.DATABASE_URL;
test("PostgreSQL private pilot: reporting, session security and editorial separation",{skip:!enabled},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:8});
 const origin="http://127.0.0.1:4174";
 const server=createPilotServer(pool,{origin,rateLimitSecret:"synthetic-integration-rate-limit-key-longer-than-32",dialogueSecret:"synthetic-dialogue-test-secret-longer-than-32"});
 const suffix=randomUUID().slice(0,8);
 const reporter={id:randomUUID(),email:"reporter-"+suffix+"@example.org",password:"ReporterSecret!123"};
 const reviewer={id:randomUUID(),email:"reviewer-"+suffix+"@example.org",password:"ReviewerSecret!123"};
 const adjudicator={id:randomUUID(),email:"appeal-reviewer-"+suffix+"@example.org",password:"IndependentReviewer!123"};
 for(const u of [reporter,reviewer,adjudicator]){
  await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",[u.id,u.email,hashPassword(u.password),u===reporter?"reporter":"reviewer"]);
 }
 const applied=await pool.query("SELECT count(*)::integer n FROM schema_migrations");
 assert.equal(applied.rows[0].n,7,"Expected all seven versioned migrations");
 const quotaKey=rateKey("synthetic-integration-rate-limit-key-longer-than-32","test-concurrent",randomUUID());
 const quota=await Promise.all([1,2,3].map(()=>consumeRateLimit(pool,quotaKey,{limit:2,windowSeconds:60})));
 assert.equal(quota.filter(x=>x.allowed).length,2,"Concurrent database quota must allow exactly two hits");
 assert.equal(quota.filter(x=>!x.allowed).length,1);
 assert.ok(quota[2].retrySeconds>=1);
 await pool.query("UPDATE request_rate_limits SET expires_at=now()-interval '2 seconds' WHERE key_hash=$1",[quotaKey]);
 assert.equal((await consumeRateLimit(pool,quotaKey,{limit:2,windowSeconds:60})).allowed,true,"Quota resets after expiry");
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
  let r=await send("/api/ready");assert.equal(r.status,200);assert.equal(r.json.check,"readiness");
  r=await send("/api/public/cases");
  assert.equal(r.status,200);assert.ok(Array.isArray(r.json.items));
  r=await send("/api/public/ledger");assert.equal(r.status,200);
  r=await send("/api/me");assert.equal(r.status,401);
  r=await send("/api/me/export");assert.equal(r.status,401);
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
  r=await send("/api/me/export",{cookie:reporterCookie});
  assert.equal(r.status,200);assert.ok(r.json.records.cases.some(x=>x.id===caseId));
  assert.ok(!Object.hasOwn(r.json.user,"password_hash"));
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
  // A different reviewer is required for the appeal; the first reviewer cannot decide it.
  r=await send("/api/appeals",{method:"POST",body:{correctionId,reason:"Po kundërshtoj këtë korrigjim sepse ka prova të reja për shqyrtim."}});
  assert.equal(r.status,401);
  r=await send("/api/appeals",{method:"POST",cookie:reporterCookie,body:{correctionId,reason:"Po kundërshtoj këtë korrigjim sepse ka prova të reja për shqyrtim."}});
  assert.equal(r.status,201);const firstAppeal=r.json.item.id;
  r=await send("/api/appeals",{method:"POST",cookie:reporterCookie,body:{correctionId,reason:"Një apelim tjetër duhet të refuzohet."}});
  assert.equal(r.status,409);
  r=await send("/api/appeals/queue",{cookie:reporterCookie});assert.equal(r.status,403);
  r=await send("/api/appeals/queue",{cookie:reviewCookie});assert.equal(r.status,200);
  assert.ok(r.json.items.some(x=>x.id===firstAppeal));
  r=await send("/api/appeals/review/"+firstAppeal,{method:"POST",cookie:reviewCookie,body:{decision:"accepted",note:"Shqyrtuesi origjinal nuk mund të gjykojë apelimin."}});
  assert.equal(r.status,403);
  r=await send("/api/auth/login",{method:"POST",body:{email:adjudicator.email,password:adjudicator.password}});
  assert.equal(r.status,200);const independentCookie=r.cookie.split(";")[0];
  r=await send("/api/appeals/review/"+firstAppeal,{method:"POST",cookie:independentCookie,body:{decision:"rejected",note:"Shqyrtuesi i pavarur nuk gjeti prova për ta ndryshuar vendimin."}});
  assert.equal(r.status,200);
  r=await send("/api/appeals/review/"+firstAppeal,{method:"POST",cookie:independentCookie,body:{decision:"accepted",note:"Nuk mund të ndryshojmë dy herë të njëjtin apelim."}});
  assert.equal(r.status,409);
  r=await send("/api/appeals/mine",{cookie:reporterCookie});assert.ok(r.json.items.some(x=>x.id===firstAppeal&&x.state==="rejected"));
  r=await send("/api/public/cases");assert.ok(r.json.items.some(x=>x.id===caseId));
  const audit=await pool.query("SELECT count(*)::integer AS n FROM audit_entries WHERE object_id=$1",[caseId]);
  assert.equal(audit.rows[0].n,1);
  // Pending correction is invalidated for adjudication if a case is archived.
  r=await send("/api/corrections",{method:"POST",cookie:reporterCookie,body:{
   caseId,reason:"Kjo kërkesë sintetike mbetet në pritje kur dosja tërhiqet nga publikimi."
  }});
  assert.equal(r.status,201);
  const staleCorrectionId=r.json.item.id;
  r=await send("/api/corrections/queue",{cookie:reviewCookie});
  assert.ok(r.json.items.some(x=>x.id===staleCorrectionId),"Published case can enter correction queue");
  r=await send("/api/archive/"+caseId,{method:"POST",cookie:reporterCookie,body:{note:"This should fail due to reporter role."}});
  assert.equal(r.status,403);
  r=await send("/api/archive/"+caseId,{method:"POST",cookie:reviewCookie,body:{note:"Retract the article pending an additional independent source review."}});
  assert.equal(r.status,200);assert.equal(r.json.item.state,"archived");
  for(const decision of ["accepted","rejected"]){
   r=await send("/api/corrections/review/"+staleCorrectionId,{method:"POST",cookie:reviewCookie,body:{
    decision,note:"Korrigjimi nuk duhet të marrë vendim pas arkivimit të dosjes."
   }});
   assert.equal(r.status,409,"Archived case must block both decisions");
  }
  const staleRow=await pool.query(
   "SELECT state,reviewer_id,reviewed_at FROM case_corrections WHERE id=$1",[staleCorrectionId]
  );
  assert.equal(staleRow.rows[0].state,"pending");
  assert.equal(staleRow.rows[0].reviewer_id,null);
  assert.equal(staleRow.rows[0].reviewed_at,null);
  const staleAudit=await pool.query("SELECT count(*)::integer n FROM audit_entries WHERE object_id=$1",[staleCorrectionId]);
  assert.equal(staleAudit.rows[0].n,0,"No new decision or audit should be created");
  r=await send("/api/corrections/queue",{cookie:reviewCookie});
  assert.ok(!r.json.items.some(x=>x.id===staleCorrectionId),"Archived case is removed from active review queue");
  r=await send("/api/public/cases");assert.ok(!r.json.items.some(x=>x.id===caseId));
  r=await send("/api/public/ledger");
  assert.equal(r.status,200);
  const ledgerEntries=r.json.events.filter(x=>x.case_id===caseId);
  assert.equal(ledgerEntries.filter(x=>x.event_type==="published").length,1);
  assert.equal(ledgerEntries.filter(x=>x.event_type==="archived").length,1);
  assert.equal(JSON.stringify(r.json).includes(reporter.email),false);
  assert.equal(JSON.stringify(r.json).includes("Retract the article"),false);
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
  // Accepted independent appeal archives the case and retains the original rejected correction.
  r=await send("/api/cases",{method:"POST",cookie:reporterCookie,body:{...sample,title:"Dosja e tretë për apelim"}});
  assert.equal(r.status,201);const appealCaseId=r.json.item.id;
  r=await send("/api/dossiers/"+appealCaseId+"/sources",{cookie:reviewCookie});const appealSource=r.json.items[0].id;
  r=await send("/api/dossiers/"+appealCaseId+"/sources/"+appealSource+"/review",{method:"POST",cookie:reviewCookie,body:{decision:"accepted",note:"Kontrolli i burimit demonstrues për apelim u krye."}});
  assert.equal(r.status,200);
  r=await send("/api/review/"+appealCaseId,{method:"POST",cookie:reviewCookie,body:{decision:"published",note:"Për demonstrimin, verifikimi editorial është përfunduar.",checks:checklist}});
  assert.equal(r.status,200);
  r=await send("/api/corrections",{method:"POST",cookie:reporterCookie,body:{caseId:appealCaseId,reason:"Kjo dosje demonstrimi përmban një pretendim që kërkon rivlerësim të plotë."}});
  assert.equal(r.status,201);const disputedCorrection=r.json.item.id;
  r=await send("/api/corrections/review/"+disputedCorrection,{method:"POST",cookie:reviewCookie,body:{decision:"rejected",note:"Korrigjimi fillestar u refuzua për testimin e procesit të apelimit."}});
  assert.equal(r.status,200);
  r=await send("/api/appeals",{method:"POST",cookie:reporterCookie,body:{correctionId:disputedCorrection,reason:"Apelim i bazuar në një kërkesë të re për rivlerësim të burimit dhe kontekstit."}});
  assert.equal(r.status,201);const acceptedAppeal=r.json.item.id;
  r=await send("/api/appeals/review/"+acceptedAppeal,{method:"POST",cookie:independentCookie,body:{decision:"accepted",note:"Apelimi u pranua pas shqyrtimit të pavarur dhe dosja duhet të tërhiqet."}});
  assert.equal(r.status,200);
  r=await send("/api/public/cases");assert.ok(!r.json.items.some(x=>x.id===appealCaseId));
  const originalCorrection=await pool.query("SELECT state FROM case_corrections WHERE id=$1",[disputedCorrection]);
  assert.equal(originalCorrection.rows[0].state,"rejected","Original decision remains in history");
  const appealAudit=await pool.query("SELECT count(*)::integer n FROM audit_entries WHERE object_id=$1 AND action='appeal.accepted'",[acceptedAppeal]);
  assert.equal(appealAudit.rows[0].n,1);
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