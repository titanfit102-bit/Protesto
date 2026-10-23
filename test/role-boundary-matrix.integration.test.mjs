import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createPilotServer} from "../src/server/app.mjs";
import {hashPassword,newSessionToken,tokenHash} from "../src/server/security.mjs";

// Actual HTTP + PostgreSQL authorization matrix. All identities/content are synthetic.
test("public, citizen, reviewer and admin boundaries fail closed for private data",
 {skip:!process.env.DATABASE_URL},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:6});
 const origin="http://127.0.0.1:4214";
 const server=createPilotServer(pool,{origin,
  rateLimitSecret:"synthetic-role-boundary-matrix-rate-secret-long",
  dialogueSecret:"synthetic-role-boundary-matrix-dialogue-secret-long"});
 const id={author:randomUUID(),other:randomUUID(),reviewer:randomUUID(),
  admin:randomUUID(),pending:randomUUID(),published:randomUUID(),
  legacy:randomUUID(),archived:randomUUID(),privateSource:randomUUID(),
  publicSource:randomUUID()};
 const sessions=new Map(),users=[["author","reporter"],["other","reporter"],
  ["reviewer","reviewer"],["admin","admin"]];
 const send=async(path,{as,method="GET",body,csrf=true}={})=>{
  const headers={};
  if(as)headers.Cookie=sessions.get(as);
  if(method==="POST"){
   headers["Content-Type"]="application/json";
   if(csrf){headers.Origin=origin;headers["X-Protesto-Request"]="1";}
  }
  const response=await fetch(origin+path,{
   method,headers,body:body===undefined?undefined:JSON.stringify(body)
  });
  return {status:response.status,data:await response.json()};
 };
 const check=async(path,roleExpected)=>{
  for(const [as,want] of Object.entries(roleExpected)){
   const result=await send(path,{as:as==="anonymous"?undefined:as});
   assert.equal(result.status,want,path+" as "+as+": "+JSON.stringify(result.data));
  }
 };
 try{
  const pw=hashPassword("SyntheticBoundaryStrongPassword!2026");
  for(const [key,role] of users){
   await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",
    [id[key],"boundary-"+id[key]+"@example.org",pw,role]);
   const token=newSessionToken();
   sessions.set(key,"protesto_session="+token);
   await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
    [tokenHash(token),id[key]]);
  }
  const marker="PRIVATE_BOUNDARY_CASE_"+id.author;
  for(const [key,state,owner,publicCopy] of [
   ["pending","pending","author",false],
   ["published","published","other",true],
   ["legacy","published","other",false],
   ["archived","archived","other",true]
  ]){
   await pool.query(
    "INSERT INTO civic_cases(id,author_id,title,description,area,category,state,public_title,public_description,public_area,public_source_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
    [id[key],id[owner],marker+"_"+key,
     "PRIVATE_BOUNDARY_DOSSIER: Synthetic original content hidden from public projections.",
     "PRIVATE apartment 4B","Mjedis",state,
     publicCopy?"Approved public dossier heading":null,
     publicCopy?"Approved public content about a synthetic test dossier.":null,
     publicCopy?"General city district":null,
     publicCopy?"https://example.org/synthetic-approved":null]
   );
  }
  await pool.query(
   "INSERT INTO case_sources(id,case_id,submitted_by,title,url,context,state,public_title,public_url) VALUES($1,$2,$3,$4,$5,$6,'pending',NULL,NULL)",
   [id.privateSource,id.pending,id.author,"PRIVATE evidence title",
    "https://example.org/private?token=do-not-share",
    "PRIVATE evidence context visible to owner/reviewer only."]
  );
  await pool.query(
   "INSERT INTO case_sources(id,case_id,submitted_by,title,url,context,state,public_title,public_url) VALUES($1,$2,$3,$4,$5,$6,'accepted',$7,$8)",
   [id.publicSource,id.published,id.other,"PRIVATE accepted evidence title",
    "https://example.org/raw?token=do-not-share",
    "PRIVATE identifying source context for tests.",
    "Approved public source","https://example.org/synthetic-approved"]
  );
  await new Promise((ok,bad)=>server.listen(4214,"127.0.0.1",error=>error?bad(error):ok()));

  const editorial=[
   "/api/review/queue","/api/actions/review/queue",
   "/api/corrections/queue","/api/appeals/queue",
   "/api/editorial/responses/queue","/api/dialogue/review/queue",
   "/api/dialogue/topic-review/queue"
  ];
  for(const path of editorial)await check(path,{
   anonymous:401,author:403,other:403,reviewer:200,admin:200
  });
  await check("/api/ops/status",{
   anonymous:401,author:403,other:403,reviewer:403,admin:200
  });
  for(const path of [
   "/api/cases/mine","/api/me/export","/api/actions/mine",
   "/api/corrections/mine","/api/appeals/mine",
   "/api/editorial/responses/mine"
  ]){
   assert.equal((await send(path)).status,401,path+" must not expose private content");
   assert.equal((await send(path,{as:"author"})).status,200);
   assert.equal((await send(path,{as:"other"})).status,200);
  }

  const mine=await send("/api/cases/mine",{as:"author"});
  assert.ok(mine.data.items.some(x=>x.id===id.pending));
  assert.ok(!mine.data.items.some(x=>x.id===id.published));
  const outsiderMine=await send("/api/cases/mine",{as:"other"});
  assert.ok(!outsiderMine.data.items.some(x=>x.id===id.pending));
  const ownExport=await send("/api/me/export",{as:"author"});
  assert.ok(ownExport.data.records.cases.some(x=>x.id===id.pending));
  assert.ok(!ownExport.data.records.cases.some(x=>x.id===id.published));
  const publicCases=await send("/api/public/cases");
  assert.equal(publicCases.status,200);
  assert.ok(publicCases.data.items.some(x=>x.id===id.published));
  for(const key of ["pending","legacy","archived"])
   assert.ok(!publicCases.data.items.some(x=>x.id===id[key]),key+" not public");
  assert.ok(!JSON.stringify(publicCases.data).includes(marker));
  assert.ok(!JSON.stringify(publicCases.data).includes("PRIVATE apartment"));

  const privatePath="/api/dossiers/"+id.pending+"/sources";
  await check(privatePath,{anonymous:404,other:404,author:200,reviewer:200,admin:200});
  const original=await send(privatePath,{as:"author"});
  assert.equal(original.data.items[0].title,"PRIVATE evidence title");
  const sourcePath="/api/dossiers/"+id.published+"/sources";
  const visible=await send(sourcePath);
  assert.equal(visible.status,200);
  assert.equal(visible.data.items.length,1);
  assert.equal(visible.data.items[0].title,"Approved public source");
  assert.ok(!JSON.stringify(visible.data).includes("PRIVATE"));
  assert.ok(!JSON.stringify(visible.data).includes("token=do-not-share"));
  assert.equal((await send(sourcePath,{as:"reviewer"})).status,200);
  assert.equal((await send("/api/dossiers/"+id.legacy+"/sources")).status,404);
  assert.equal((await send("/api/dossiers/"+id.archived+"/sources")).status,404);
  for(const key of ["pending","legacy","archived"])
   assert.equal((await send("/api/dossiers/"+id[key]+"/responses")).status,404);

  // Enforce CSRF *before* body handling, even for an otherwise authenticated actor.
  for(const as of ["author","reviewer","admin"]){
   const r=await send("/api/cases",{as,method:"POST",body:{},csrf:false});
   assert.equal(r.status,403,"CSRF must block "+as);
  }
  // A reporter cannot publish/reject their own case through the editorial path.
  const roleAttempt=await send("/api/review/"+id.pending,{
   as:"author",method:"POST",body:{decision:"rejected",note:"Refuzim sintetik i palejuar nga autori."}
  });
  assert.equal(roleAttempt.status,403);
  const active=await pool.query("SELECT state FROM civic_cases WHERE id=$1",[id.pending]);
  assert.equal(active.rows[0].state,"pending");
 }finally{
  if(server.listening)await new Promise(resolve=>server.close(resolve));
  await pool.query("DELETE FROM case_sources WHERE id=ANY($1::uuid[])",[[id.privateSource,id.publicSource]]);
  await pool.query("DELETE FROM sessions WHERE user_id=ANY($1::uuid[])",[users.map(([key])=>id[key])]);
  await pool.query("DELETE FROM civic_cases WHERE id=ANY($1::uuid[])",[[id.pending,id.published,id.legacy,id.archived]]);
  await pool.query("DELETE FROM civic_users WHERE id=ANY($1::uuid[])",[users.map(([key])=>id[key])]);
  await pool.end();
 }
});
