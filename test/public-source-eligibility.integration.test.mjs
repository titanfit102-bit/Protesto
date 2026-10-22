import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createPilotServer} from "../src/server/app.mjs";
import {hashPassword,newSessionToken,tokenHash} from "../src/server/security.mjs";

test("public sources fail closed for incomplete approval and for archival between SQL reads",
 {skip:!process.env.DATABASE_URL},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:4});
 const origin="http://127.0.0.1:4212",author=randomUUID(),caseId=randomUUID(),sourceId=randomUUID();
 const token=newSessionToken();
 let archiveBetweenReads=false;
 // Deterministically archive the case after public eligibility SELECT but
 // before the source row query, without mocking either PostgreSQL result.
 const wrapped={
  connect:(...args)=>pool.connect(...args),
  query:async(sql,...args)=>{
   const result=await pool.query(sql,...args);
   if(archiveBetweenReads&&typeof sql==="string"&&sql.startsWith(
    "SELECT author_id,state,public_title,public_description,public_area FROM civic_cases")){
    archiveBetweenReads=false;
    await pool.query("UPDATE civic_cases SET state='archived' WHERE id=$1",[caseId]);
   }
   return result;
  }
 };
 const server=createPilotServer(wrapped,{origin,
  rateLimitSecret:"synthetic-public-source-eligibility-secret-long-32",
  dialogueSecret:"synthetic-public-source-dialogue-secret-long-32"});
 try{
  await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,'reporter')",
   [author,"source-privacy-"+author+"@example.org",hashPassword("SyntheticSourcePrivacyPassword!2026")]);
  await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
   [tokenHash(token),author]);
  await pool.query(
   "INSERT INTO civic_cases(id,author_id,title,description,area,category,state,public_title,public_area) VALUES($1,$2,$3,$4,$5,$6,'published',$7,$8)",
   [caseId,author,"PRIVATE original case title",
    "PRIVATE original case narrative, not reviewer approved.",
    "PRIVATE apartment address","Mjedis","Approved public case title","Public general locality"]);
  await pool.query(
   "INSERT INTO case_sources(id,case_id,submitted_by,title,url,context,state,public_title,public_url) VALUES($1,$2,$3,$4,$5,$6,'accepted',$7,$8)",
   [sourceId,caseId,author,"PRIVATE identifying source text",
    "https://example.org/original?private=token",
    "PRIVATE context that must remain protected from anonymous users.",
    "Approved public document","https://example.org/approved-source"]);
  await new Promise((ok,bad)=>server.listen(4212,"127.0.0.1",error=>error?bad(error):ok()));
  const get=async(auth=false)=>{
   const response=await fetch(origin+"/api/dossiers/"+caseId+"/sources",{
    headers:auth?{Cookie:"protesto_session="+token}:{}
   });
   return {status:response.status,data:await response.json()};
  };
  let r=await get();
  assert.equal(r.status,404,"No anonymous source list for case lacking approved public description");
  r=await get(true);
  assert.equal(r.status,200,"Owner retains access to private source review history");
  assert.equal(r.data.items[0].url,"https://example.org/original?private=token");
  await pool.query("UPDATE civic_cases SET public_description=$1 WHERE id=$2",
   ["Approved and redacted public case description for this synthetic test.",caseId]);
  r=await get();
  assert.equal(r.status,200);assert.equal(r.data.items.length,1);
  assert.equal(r.data.items[0].url,"https://example.org/approved-source");
  assert.ok(!JSON.stringify(r.data).includes("PRIVATE"));
  archiveBetweenReads=true;
  r=await get();
  assert.equal(archiveBetweenReads,false,"Archive actually happened between two real SQL queries");
  assert.equal(r.status,200);
  assert.deepEqual(r.data.items,[],"Second query must revalidate live publication after archival");
  r=await get();
  assert.equal(r.status,404,"Archived sources are never public");
 }finally{
  if(server.listening)await new Promise(resolve=>server.close(resolve));
  await pool.end();
 }
});
