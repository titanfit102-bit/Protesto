import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,createHash} from "node:crypto";
import {once} from "node:events";
import {createPilotServer} from "../src/server/app.mjs";
import {hashPassword,newSessionToken,tokenHash} from "../src/server/security.mjs";

// Synthetic PostgreSQL only. Real civic data must never be used for these tests.
test("F03: every case withdrawal atomically cancels open dialogue, clears pseudonymous votes and preserves closed aggregates",
 {skip:!process.env.DATABASE_URL},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:8});
 const origin="http://127.0.0.1:4209";
 const server=createPilotServer(pool,{origin,
  rateLimitSecret:"synthetic-f03-rate-secret-longer-than-32",
  dialogueSecret:"synthetic-f03-dialogue-secret-longer-than-32"});
 const id={author:randomUUID(),reviewer:randomUUID(),independent:randomUUID()};
 const cases=[],sessions=[];
 let started=false;
 try{
  const password=hashPassword("SyntheticF03Password!2026");
  for(const [uid,role] of [[id.author,"reporter"],[id.reviewer,"reviewer"],[id.independent,"reviewer"]]){
   await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",
    [uid,"f03-"+uid+"@example.org",password,role]);
  }
  for(const uid of Object.values(id)){
   const token=newSessionToken();sessions.push([uid,token]);
   await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
    [tokenHash(token),uid]);
  }
  server.listen(0,"127.0.0.1");await once(server,"listening");started=true;
  const url="http://127.0.0.1:"+server.address().port;
  const cookies=Object.fromEntries(sessions.map(([uid,t])=>[uid,"protesto_session="+t]));
  const request=async(path,{method="GET",body,actor=id.reviewer}={})=>{
   const headers={Origin:origin,"X-Protesto-Request":"1",Cookie:cookies[actor]};
   if(body!==undefined)headers["Content-Type"]="application/json";
   const res=await fetch(url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
   return {status:res.status,json:await res.json()};
  };
  const makeCase=async()=>{
   const cid=randomUUID();cases.push(cid);
   await pool.query("INSERT INTO civic_cases(id,author_id,title,description,area,category,state,public_title,public_description,public_area) VALUES($1,$2,$3,$4,$5,$6,'published',$7,$8,$9)",
    [cid,id.author,"Synthetic case "+cid.slice(0,8),
     "All content in this row is fictional and intended for isolated CI testing.",
     "Synthetic area","Mjedis","Public synthetic title",
     "Public synthetic description with no real allegations or personal details.",
     "Public synthetic area"]);
   const topics={};
   for(const kind of ["open","pending","closed"]){
    const tid=randomUUID(),sid=randomUUID();
    topics[kind]={id:tid,statement:sid};
    const review=kind==="pending"?"pending":"approved";
    const state=kind==="closed"?"closed":"open";
    await pool.query("INSERT INTO dialogue_topics(id,case_id,created_by,title,description,state,review_state,public_title,public_description,closed_at,closed_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
     [tid,cid,id.reviewer,"Private synthetic topic "+kind,
      "Private topic context for synthetic cancellation and closure race testing.",
      state,review,"Public synthetic topic "+kind,
      "Public topic description for synthetic privacy boundary testing.",
      state==="closed"?new Date():null,state==="closed"?id.reviewer:null]);
    await pool.query("INSERT INTO dialogue_statements(id,topic_id,author_id,body,state,public_body) VALUES($1,$2,$3,$4,'accepted',$5)",
     [sid,tid,id.author,"Synthetic original discussion body with no real identities.",
      "Synthetic reviewed discussion statement without real civic data."]);
    if(kind==="closed"){
     await pool.query("INSERT INTO dialogue_results(statement_id,participants,agree_count,disagree_count,pass_count) VALUES($1,10,6,3,1)",[sid]);
    }else{
     for(let i=0;i<3;i++){
      const key=createHash("sha256").update(cid+kind+i).digest("hex");
      await pool.query("INSERT INTO dialogue_votes(statement_id,voter_key,choice) VALUES($1,$2,'agree')",[sid,key]);
     }
    }
   }
   return {cid,topics};
  };
  const routes=["direct","correction","appeal"];
  for(const mode of routes){
   const {cid,topics}=await makeCase();
   const publicBefore=await request("/api/dialogue/topics/"+topics.open.id);
   assert.equal(publicBefore.status,200,"published open topic is visible before archive");
   let result;
   if(mode==="direct"){
    result=await request("/api/archive/"+cid,{method:"POST",body:{note:"Synthetic withdrawal reviewed for cancellation of child topics."}});
   }else if(mode==="correction"){
    const correction=randomUUID();
    await pool.query("INSERT INTO case_corrections(id,case_id,author_id,reason) VALUES($1,$2,$3,$4)",
     [correction,cid,id.author,"Synthetic correction request regarding fictional publication details."]);
    result=await request("/api/corrections/review/"+correction,{method:"POST",
     body:{decision:"accepted",note:"Independent synthetic correction review found withdrawal appropriate."}});
   }else{
    const correction=randomUUID(),appeal=randomUUID();
    await pool.query("INSERT INTO case_corrections(id,case_id,author_id,reason,state,reviewer_id) VALUES($1,$2,$3,$4,'rejected',$5)",
     [correction,cid,id.author,"Original synthetic correction review was rejected.",id.reviewer]);
    await pool.query("INSERT INTO correction_appeals(id,correction_id,author_id,reason) VALUES($1,$2,$3,$4)",
     [appeal,correction,id.author,"Synthetic appeal requiring a separate independent adjudicator."]);
    result=await request("/api/appeals/review/"+appeal,{method:"POST",actor:id.independent,
     body:{decision:"accepted",note:"Independent synthetic appeal withdrawal decision reviewed in full."}});
   }
   assert.equal(result.status,200,mode+" archive succeeded: "+JSON.stringify(result.json));
   const state=await pool.query("SELECT state FROM civic_cases WHERE id=$1",[cid]);
   assert.equal(state.rows[0].state,"archived");
   const rows=await pool.query("SELECT id,state,closed_at,closed_by,cancelled_at,cancelled_by FROM dialogue_topics WHERE case_id=$1",[cid]);
   const get=kind=>rows.rows.find(t=>t.id===topics[kind].id);
   for(const kind of ["open","pending"]){
    assert.equal(get(kind).state,"cancelled",mode+" "+kind);
    assert.ok(get(kind).cancelled_at);
    assert.equal(get(kind).cancelled_by,mode==="appeal"?id.independent:id.reviewer);
    const votes=await pool.query("SELECT count(*)::integer n FROM dialogue_votes WHERE statement_id=$1",[topics[kind].statement]);
    assert.equal(votes.rows[0].n,0,"cancelled topic votes erased");
    const generated=await pool.query("SELECT count(*)::integer n FROM dialogue_results WHERE statement_id=$1",[topics[kind].statement]);
    assert.equal(generated.rows[0].n,0,"no aggregate created on cancellation");
    const events=await pool.query("SELECT action,actor_id FROM audit_entries WHERE object_id=$1",[topics[kind].id]);
    assert.equal(events.rowCount,1,"exactly one cancellation audit event");
    assert.equal(events.rows[0].action,"dialogue.topic.cancelled");
    assert.equal(events.rows[0].actor_id,mode==="appeal"?id.independent:id.reviewer);
    const hidden=await request("/api/dialogue/topics/"+topics[kind].id);
    assert.equal(hidden.status,404,"withdrawn topics are not public");
    const late=await request("/api/dialogue/statements/"+topics[kind].statement+"/vote",{
     method:"POST",actor:id.author,body:{choice:"agree",acknowledge:true}});
    assert.equal(late.status,409,"new votes refused after parent archive");
   }
   assert.equal(get("closed").state,"closed","previous finalized topic retained internally");
   assert.equal(get("closed").cancelled_at,null);
   const resultRecord=await pool.query("SELECT participants FROM dialogue_results WHERE statement_id=$1",[topics.closed.statement]);
   assert.equal(resultRecord.rows[0].participants,10,"preexisting closed totals retained internally");
   const report=await request("/api/dialogue/report");
   assert.ok(!report.json.items.some(item=>item.case_id===cid),"withdrawn parent suppresses public aggregate");
   if(mode==="direct"){
    const repeated=await request("/api/archive/"+cid,{method:"POST",body:{note:"Duplicate synthetic archive should not mutate again."}});
    assert.equal(repeated.status,409);
    const audit=await pool.query("SELECT count(*)::integer n FROM audit_entries WHERE object_id=ANY($1::uuid[]) AND action='dialogue.topic.cancelled'",
     [[topics.open.id,topics.pending.id]]);
    assert.equal(audit.rows[0].n,2,"repeated archive cannot duplicate cancellation");
   }
  }
 }finally{
  if(started)await new Promise(resolve=>server.close(resolve));
  await pool.end();
 }
});
