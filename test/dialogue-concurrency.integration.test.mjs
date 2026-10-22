import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createPilotServer} from "../src/server/app.mjs";
import {hashPassword,newSessionToken,tokenHash} from "../src/server/security.mjs";

// Stress real PostgreSQL parent row locks: an API decision must wait for an
// overlapping topic close or case archival before checking publication state.
test("dialogue moderation, votes and closure cannot bypass concurrent parent transitions",
 {skip:!process.env.DATABASE_URL},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:6});
 const origin="http://127.0.0.1:4205";
 const server=createPilotServer(pool,{origin,
  rateLimitSecret:"synthetic-dialogue-race-rate-limit-longer-than-32",
  dialogueSecret:"synthetic-dialogue-race-vote-secret-longer-than-32"});
 const ids={case:randomUUID(),topic:randomUUID(),pending:randomUUID(),accepted:randomUUID(),
  author:randomUUID(),reviewer:randomUUID()};
 let hold=null;const active=[];
 try{
  const pw=hashPassword("SyntheticDialogueRacePassword!2026");
  for(const [id,role] of [[ids.author,"reporter"],[ids.reviewer,"reviewer"]])
   await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",
    [id,"race-"+id+"@example.org",pw,role]);
  const token=newSessionToken();
  await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
   [tokenHash(token),ids.reviewer]);
  await pool.query("INSERT INTO civic_cases(id,author_id,title,description,area,category,state,public_title,public_description,public_area,public_source_url) VALUES($1,$2,$3,$4,$5,$6,'published',$7,$8,$9,$10)",
   [ids.case,ids.author,"Private synthetic dialogue case","Synthetic private body, not for the public.","Test","Mjedis",
    "Public synthetic dialogue case","A separately reviewed public description for test use.",
    "Zona publike","https://example.org/dialogue-race"]);
  await pool.query("INSERT INTO dialogue_topics(id,case_id,created_by,title,description,public_title,public_description,review_state,state) VALUES($1,$2,$3,$4,$5,$6,$7,'approved','open')",
   [ids.topic,ids.case,ids.reviewer,"Private internal topic title",
    "Synthetic internal topic details for concurrency checks.",
    "Public synthetic topic for locks","Public reviewed topic description for concurrency testing."]);
  await pool.query("INSERT INTO dialogue_statements(id,topic_id,author_id,body,state) VALUES($1,$2,$3,$4,'pending')",
   [ids.pending,ids.topic,ids.author,"Pending statement to test concurrent editorial closure."]);
  await pool.query("INSERT INTO dialogue_statements(id,topic_id,author_id,body,state,public_body) VALUES($1,$2,$3,$4,'accepted',$5)",
   [ids.accepted,ids.topic,ids.author,"Original accepted synthetic statement.",
    "Reviewed public statement used to test locked voting."]);
  await new Promise((resolve,reject)=>server.listen(4205,"127.0.0.1",error=>error?reject(error):resolve()));
  const post=async(path,body)=>{
   const response=await fetch(origin+path,{method:"POST",headers:{
    Origin:origin,"X-Protesto-Request":"1","Content-Type":"application/json",Cookie:"protesto_session="+token
   },body:JSON.stringify(body)});
   return {status:response.status,data:await response.json()};
  };
  const race=async({lock,request,transition,expected})=>{
   hold=await pool.connect();
   await hold.query("BEGIN");
   await hold.query(lock.sql,lock.values);
   let finished=false;
   const pending=post(request.path,request.body).then(result=>{finished=true;return result;});
   active.push(pending);
   await new Promise(resolve=>setTimeout(resolve,350));
   assert.equal(finished,false,expected+" must wait for the parent lock");
   await hold.query(transition.sql,transition.values);
   await hold.query("COMMIT");
   hold.release();hold=null;
   const result=await pending;
   assert.equal(result.status,409,expected+" must refuse a stale parent state");
  };
  await race({
   lock:{sql:"SELECT id FROM dialogue_topics WHERE id=$1 FOR UPDATE",values:[ids.topic]},
   request:{path:"/api/dialogue/statements/"+ids.pending+"/review",
    body:{decision:"accepted",note:"Deklaratë sintetike për verifikimin e mbylljes së temës.",
      privacyReviewed:true,publicBody:"Kopje publike për testimin e procesit editorial."}},
   transition:{sql:"UPDATE dialogue_topics SET state='closed' WHERE id=$1",values:[ids.topic]},
   expected:"Statement review after topic closure"
  });
  const statement=await pool.query("SELECT state,reviewed_by FROM dialogue_statements WHERE id=$1",[ids.pending]);
  assert.equal(statement.rows[0].state,"pending");assert.equal(statement.rows[0].reviewed_by,null);
  const reviews=await pool.query("SELECT count(*)::integer n FROM dialogue_reviews WHERE statement_id=$1",[ids.pending]);
  assert.equal(reviews.rows[0].n,0);
  await pool.query("UPDATE dialogue_topics SET state='open' WHERE id=$1",[ids.topic]);

  await race({
   lock:{sql:"SELECT id FROM civic_cases WHERE id=$1 FOR UPDATE",values:[ids.case]},
   request:{path:"/api/dialogue/statements/"+ids.accepted+"/vote",
    body:{choice:"agree",acknowledge:true}},
   transition:{sql:"UPDATE civic_cases SET state='archived' WHERE id=$1",values:[ids.case]},
   expected:"Vote after case archival"
  });
  const votes=await pool.query("SELECT count(*)::integer n FROM dialogue_votes WHERE statement_id=$1",[ids.accepted]);
  assert.equal(votes.rows[0].n,0);
  await pool.query("UPDATE civic_cases SET state='published' WHERE id=$1",[ids.case]);

  await race({
   lock:{sql:"SELECT id FROM civic_cases WHERE id=$1 FOR UPDATE",values:[ids.case]},
   request:{path:"/api/dialogue/topics/"+ids.topic+"/close",
    body:{note:"Mbyllja e temës nuk lejohet pas arkivimit të dosjes."}},
   transition:{sql:"UPDATE civic_cases SET state='archived' WHERE id=$1",values:[ids.case]},
   expected:"Topic closure after case archival"
  });
  const topic=await pool.query("SELECT state,closed_at FROM dialogue_topics WHERE id=$1",[ids.topic]);
  assert.equal(topic.rows[0].state,"open");assert.equal(topic.rows[0].closed_at,null);
  const results=await pool.query("SELECT count(*)::integer n FROM dialogue_results WHERE statement_id=$1",[ids.accepted]);
  assert.equal(results.rows[0].n,0);
 }finally{
  if(hold){try{await hold.query("ROLLBACK");}finally{hold.release();}}
  await Promise.allSettled(active);
  if(server.listening)await new Promise(resolve=>server.close(resolve));
  await pool.end();
 }
});
