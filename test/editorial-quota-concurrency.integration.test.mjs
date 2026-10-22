import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createPilotServer} from "../src/server/app.mjs";
import {hashPassword,newSessionToken,tokenHash} from "../src/server/security.mjs";

test("author-wide quotas and parent case approval remain atomic under parallel HTTP requests",
 {skip:!process.env.DATABASE_URL},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:14});
 const origin="http://127.0.0.1:4210";
 const server=createPilotServer(pool,{origin,
  rateLimitSecret:"synthetic-editorial-quota-test-secret-isolated",
  dialogueSecret:"synthetic-editorial-dialogue-key-long-32"});
 const author=randomUUID(),reporter=randomUUID(),reviewer=randomUUID();
 const identities=new Map();
 const cases=Array.from({length:9},()=>randomUUID());
 const send=async(path,body,user)=>{
  const response=await fetch(origin+path,{method:"POST",headers:{
   Origin:origin,"X-Protesto-Request":"1","Content-Type":"application/json",
   Cookie:identities.get(user)
  },body:JSON.stringify(body)});
  return {status:response.status,data:await response.json()};
 };
 let hold=null;const active=[];
 const race=async({caseId,path,body,user,table,name})=>{
  hold=await pool.connect();
  await hold.query("BEGIN");
  await hold.query("SELECT id FROM civic_cases WHERE id=$1 FOR UPDATE",[caseId]);
  let finished=false;
  const pending=send(path,body,user).then(result=>{finished=true;return result;});
  active.push(pending);
  await new Promise(resolve=>setTimeout(resolve,350));
  assert.equal(finished,false,name+" should block on the parent case row");
  await hold.query("UPDATE civic_cases SET state='archived' WHERE id=$1",[caseId]);
  await hold.query("COMMIT");
  hold.release();hold=null;
  const result=await pending;
  assert.equal(result.status,409,name+" must refuse a stale case");
  const rows=await pool.query("SELECT count(*)::integer n FROM "+table+" WHERE "+(
   table==="dialogue_topics"?"case_id":"correction_id"
  )+"=$1",[table==="dialogue_topics"?caseId:body.correctionId]);
  assert.equal(rows.rows[0].n,0,"No late "+name+" inserted");
 };
 try{
  const hash=hashPassword("SyntheticQuotaPassword!2026");
  for(const [id,role] of [[author,"reporter"],[reporter,"reporter"],[reviewer,"reviewer"]]){
   await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",
    [id,"quota-"+id+"@example.org",hash,role]);
   const token=newSessionToken();
   identities.set(id,"protesto_session="+token);
   await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
    [tokenHash(token),id]);
  }
  for(const id of cases){
   await pool.query(
    "INSERT INTO civic_cases(id,author_id,title,description,area,category,state,public_title,public_description,public_area,public_source_url) VALUES($1,$2,$3,$4,$5,$6,'published',$7,$8,$9,$10)",
    [id,author,"Synthetic case for author quotas","Original synthetic body for transaction tests.",
     "Test locality","Mjedis","Reviewed public case for quotas",
     "Public synthetic description for independent quota and case archival checks.",
     "Test area","https://example.org/quotas"]
   );
  }
  await new Promise((resolve,reject)=>server.listen(4210,"127.0.0.1",error=>error?reject(error):resolve()));

  const actionBody=i=>({
   kind:"initiative",type:"Diskutim komunitar",title:"Nisma sintetike paralel "+i,
   area:"Zona e testit",description:"Një nismë sintetike për të kontrolluar kufijtë e sistemit."
  });
  const actions=await Promise.all(Array.from({length:7},(_,i)=>send("/api/actions",actionBody(i),reporter)));
  assert.equal(actions.filter(x=>x.status===201).length,6,"Six action creations only");
  assert.equal(actions.filter(x=>x.status===429).length,1,"Seventh action rejected");
  let q=await pool.query("SELECT count(*)::integer n FROM civic_actions WHERE author_id=$1",[reporter]);
  assert.equal(q.rows[0].n,6);

  const topicBody=caseId=>({
   caseId,title:"PRIVATE topic proposal for review",
   description:"Original private context for a synthetic reviewer-created dialogue.",
   public:{title:"Propozim publik sintetik",description:"Kontekst publik i redaktuar dhe i miratuar për provë."},
   checks:{privacyReviewed:true,publicCopyReviewed:true}
  });
  const topics=await Promise.all(cases.slice(0,6).map(caseId=>send("/api/dialogue/topics",topicBody(caseId),reviewer)));
  assert.equal(topics.filter(x=>x.status===201).length,5,"Five topic proposals only");
  assert.equal(topics.filter(x=>x.status===429).length,1,"Sixth topic rejected");
  q=await pool.query("SELECT count(*)::integer n FROM dialogue_topics WHERE created_by=$1",[reviewer]);
  assert.equal(q.rows[0].n,5);

  // Four separate rejected corrections by the same person, on four distinct cases.
  const correctionIds=[];
  for(const caseId of cases.slice(0,4)){
   const correctionId=randomUUID();correctionIds.push(correctionId);
   await pool.query("INSERT INTO case_corrections(id,case_id,author_id,reason,state) VALUES($1,$2,$3,$4,'rejected')",
    [correctionId,caseId,reporter,"Synthetic rejected correction to test concurrent appeal limits."]);
  }
  const appealBody=correctionId=>({correctionId,reason:"Apelim sintetik për të verifikuar kufirin ditor të dorëzimeve paralele."});
  const appeals=await Promise.all(correctionIds.map(id=>send("/api/appeals",appealBody(id),reporter)));
  assert.equal(appeals.filter(x=>x.status===201).length,3,"Three appeal creations only");
  assert.equal(appeals.filter(x=>x.status===429).length,1,"Fourth appeal rejected");
  q=await pool.query("SELECT count(*)::integer n FROM correction_appeals WHERE author_id=$1",[reporter]);
  assert.equal(q.rows[0].n,3);

  // Fresh identities avoid already exhausted author-wide quotas; parent lock
  // must force each submission to observe the subsequently archived case.
  const lateReviewer=randomUUID(),lateReporter=randomUUID();
  for(const [id,role] of [[lateReviewer,"reviewer"],[lateReporter,"reporter"]]){
   await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",
    [id,"late-"+id+"@example.org",hash,role]);
   const token=newSessionToken();identities.set(id,"protesto_session="+token);
   await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
    [tokenHash(token),id]);
  }
  await race({caseId:cases[7],path:"/api/dialogue/topics",body:topicBody(cases[7]),
   user:lateReviewer,table:"dialogue_topics",name:"Topic creation"});
  const correctionId=randomUUID();
  await pool.query("INSERT INTO case_corrections(id,case_id,author_id,reason,state) VALUES($1,$2,$3,$4,'rejected')",
   [correctionId,cases[8],lateReporter,"Rejected synthetic correction for the archival race test."]);
  await race({caseId:cases[8],path:"/api/appeals",body:appealBody(correctionId),
   user:lateReporter,table:"correction_appeals",name:"Appeal creation"});
 }finally{
  if(hold){try{await hold.query("ROLLBACK");}finally{hold.release();}}
  await Promise.allSettled(active);
  if(server.listening)await new Promise(resolve=>server.close(resolve));
  await pool.end();
 }
});
