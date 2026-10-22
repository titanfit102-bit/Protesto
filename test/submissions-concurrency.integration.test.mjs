import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createPilotServer} from "../src/server/app.mjs";
import {hashPassword,newSessionToken,tokenHash} from "../src/server/security.mjs";

// Actual PostgreSQL concurrency, not mocked asynchronous JavaScript ordering.
test("citizen response and correction submissions serialize with archival and quota",
 {skip:!process.env.DATABASE_URL},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:12});
 const origin="http://127.0.0.1:4206";
 const server=createPilotServer(pool,{origin,
  rateLimitSecret:"synthetic-citizen-race-rate-limit-secret-long-32",
  dialogueSecret:"synthetic-citizen-race-dialogue-secret-long-32"});
 const caseAuthor=randomUUID(),submitter=randomUUID();
 const ids=Array.from({length:8},()=>randomUUID());
 const token=newSessionToken();
 let hold=null;
 const inFlight=[];
 const request=async(path,body)=>{
  const response=await fetch(origin+path,{method:"POST",headers:{
   Origin:origin,"X-Protesto-Request":"1","Content-Type":"application/json",
   Cookie:"protesto_session="+token
  },body:JSON.stringify(body)});
  return {status:response.status,data:await response.json()};
 };
 try{
  const pw=hashPassword("SyntheticCorrectionRacePassword!2026");
  for(const [id,role] of [[caseAuthor,"reporter"],[submitter,"reporter"]])
   await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",
    [id,"submissions-"+id+"@example.org",pw,role]);
  await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
   [tokenHash(token),submitter]);
  for(const id of ids){
   await pool.query(
    "INSERT INTO civic_cases(id,author_id,title,description,area,category,state,public_title,public_description,public_area,public_source_url) VALUES($1,$2,$3,$4,$5,$6,'published',$7,$8,$9,$10)",
    [id,caseAuthor,"Synthetic private title","Synthetic case body for concurrency testing.",
     "Synthetic internal location","Mjedis","Synthetic public case title",
     "A reviewed public description for transaction race testing.",
     "Zona e testit","https://example.org/submissions-race"]
   );
  }
  await new Promise((resolve,reject)=>server.listen(4206,"127.0.0.1",err=>err?reject(err):resolve()));

  const race=async({caseId,path,body,name})=>{
   hold=await pool.connect();
   await hold.query("BEGIN");
   await hold.query("SELECT id FROM civic_cases WHERE id=$1 FOR UPDATE",[caseId]);
   let finished=false;
   const pending=request(path,body).then(result=>{finished=true;return result;});
   inFlight.push(pending);
   await new Promise(resolve=>setTimeout(resolve,350));
   assert.equal(finished,false,name+" must wait for the case lock");
   await hold.query("UPDATE civic_cases SET state='archived' WHERE id=$1",[caseId]);
   await hold.query("COMMIT");
   hold.release();hold=null;
   const result=await pending;
   assert.equal(result.status,409,name+" must not be inserted after withdrawal");
  };

  await race({caseId:ids[0],path:"/api/dossiers/"+ids[0]+"/responses",
   body:{body:"Ky është një test sintetik për të provuar bllokimin pas arkivimit të dosjes."},
   name:"Citizen response"});
  let check=await pool.query("SELECT count(*)::integer n FROM case_responses WHERE case_id=$1",[ids[0]]);
  assert.equal(check.rows[0].n,0,"No late citizen response");

  await race({caseId:ids[1],path:"/api/corrections",
   body:{caseId:ids[1],reason:"Ky korrigjim sintetik nuk duhet të ekzistojë pas arkivimit të dosjes."},
   name:"Correction request"});
  check=await pool.query("SELECT count(*)::integer n FROM case_corrections WHERE case_id=$1",[ids[1]]);
  assert.equal(check.rows[0].n,0,"No late correction");

  // Six simultaneous submissions to DIFFERENT parent cases cannot use
  // independent COUNT snapshots to pass an author-wide five-per-day quota.
  const results=await Promise.all(ids.slice(2).map((caseId,index)=>request(
   "/api/corrections",{
    caseId,
    reason:"Korrigjim sintetik "+index+" për kufirin ditor gjatë kërkesave paralele."
   }
  )));
  assert.equal(results.filter(x=>x.status===201).length,5,"Only five author submissions allowed");
  assert.equal(results.filter(x=>x.status===429).length,1,"Sixth request must be rate-limited");
  const total=await pool.query("SELECT count(*)::integer n FROM case_corrections WHERE author_id=$1",[submitter]);
  assert.equal(total.rows[0].n,5);
  for(const id of ids.slice(2)){
   const n=await pool.query("SELECT count(*)::integer n FROM case_corrections WHERE case_id=$1",[id]);
   assert.ok(n.rows[0].n<=1);
  }
 }finally{
  if(hold){try{await hold.query("ROLLBACK");}finally{hold.release();}}
  await Promise.allSettled(inFlight);
  if(server.listening)await new Promise(resolve=>server.close(resolve));
  await pool.end();
 }
});
