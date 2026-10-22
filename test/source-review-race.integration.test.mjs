import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createPilotServer} from "../src/server/app.mjs";
import {hashPassword,newSessionToken,tokenHash} from "../src/server/security.mjs";

// Reproduces a TOCTOU race that UPDATE ... FROM civic_cases did not serialize.
test("source reviewer cannot approve after concurrent case publication",{skip:!process.env.DATABASE_URL},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:5});
 const origin="http://127.0.0.1:4204";
 const server=createPilotServer(pool,{origin,
  rateLimitSecret:"synthetic-source-race-user-rate-limit-key",
  dialogueSecret:"synthetic-source-race-dialogue-key-longer-than-32"});
 const caseId=randomUUID(),sourceId=randomUUID(),authorId=randomUUID(),reviewerId=randomUUID();
 let hold,started=false,finished=false,submitted;
 try{
  const passwordHash=hashPassword("SyntheticSourceRacePassword!2026");
  for(const [id,role] of [[authorId,"reporter"],[reviewerId,"reviewer"]])
   await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",
    [id,"synthetic-"+id+"@example.org",passwordHash,role]);
  const token=newSessionToken();
  await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
    [tokenHash(token),reviewerId]);
  await pool.query("INSERT INTO civic_cases(id,author_id,title,description,area,category,state) VALUES($1,$2,$3,$4,$5,$6,'pending')",
   [caseId,authorId,"Dosje prove për garë transaksionale","Përmbajtje sintetike për testimin e një vendimi editorial paralel.","Test","Tjetër"]);
  await pool.query("INSERT INTO case_sources(id,case_id,submitted_by,title,url,context) VALUES($1,$2,$3,$4,$5,$6)",
   [sourceId,caseId,authorId,"Dokument prove për garën","https://example.org/race","Kontekst sintetik për testimin e konkurrencës transaksionale."]);
  await new Promise((resolve,reject)=>server.listen(4204,"127.0.0.1",e=>e?reject(e):resolve()));
  hold=await pool.connect();
  await hold.query("BEGIN");
  await hold.query("SELECT id FROM civic_cases WHERE id=$1 FOR UPDATE",[caseId]);
  const path="/api/dossiers/"+caseId+"/sources/"+sourceId+"/review";
  submitted=(async()=>{
   started=true;
   const result=await fetch(origin+path,{method:"POST",headers:{
    Origin:origin,"X-Protesto-Request":"1","Content-Type":"application/json",
    Cookie:"protesto_session="+token
   },body:JSON.stringify({
    decision:"accepted",note:"Verifikim sintetik për garën e dy operacioneve editoriale.",
    checks:{sourceOpened:true,privacyReviewed:true,publicMetadataReviewed:true},
    publicMetadata:{title:"Dokument sintetik i redaktuar",url:"https://example.org/race"}
   })});
   finished=true;return {status:result.status,body:await result.json()};
  })();
  // While the parent is locked, source approval must not finish using an old
  // snapshot of c.state. This actively catches a regression to UPDATE ... FROM.
  await new Promise(resolve=>setTimeout(resolve,350));
  assert.ok(started);
  assert.equal(finished,false,"Source review must wait for parent case row lock");
  await hold.query("UPDATE civic_cases SET state='published' WHERE id=$1",[caseId]);
  await hold.query("COMMIT");
  hold.release();hold=null;
  const response=await submitted;
  assert.equal(response.status,409,"Stale source review must be rejected after publication");
  const src=await pool.query("SELECT state,reviewed_by,public_title FROM case_sources WHERE id=$1",[sourceId]);
  assert.equal(src.rows[0].state,"pending");
  assert.equal(src.rows[0].reviewed_by,null);
  assert.equal(src.rows[0].public_title,null);
  const audit=await pool.query("SELECT count(*)::integer n FROM audit_entries WHERE object_id=$1",[sourceId]);
  assert.equal(audit.rows[0].n,0,"Rejected concurrent decision must not create an audit entry");
 }finally{
  if(hold){try{await hold.query("ROLLBACK");}finally{hold.release();}}
  if(submitted)await submitted.catch(()=>{});
  if(server.listening)await new Promise(resolve=>server.close(resolve));
  await pool.end();
 }
});
