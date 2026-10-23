import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createPilotServer} from "../src/server/app.mjs";
import {hashPassword,newSessionToken,tokenHash} from "../src/server/security.mjs";

test("self-data export contains own citizen records and excludes other people's content",
 {skip:!process.env.DATABASE_URL},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:4});
 const origin="http://127.0.0.1:4215";
 const server=createPilotServer(pool,{origin,
  rateLimitSecret:"synthetic-export-access-control-secret-long-enough",
  dialogueSecret:"synthetic-export-dialogue-secret-long-enough"});
 const people=[randomUUID(),randomUUID()];
 const cases=people.map(()=>randomUUID());
 const ids=people.map(()=>({source:randomUUID(),correction:randomUUID(),
  appeal:randomUUID(),response:randomUUID(),topic:randomUUID(),statement:randomUUID()}));
 const sessions=[];
 try{
  for(let i=0;i<2;i++){
   const id=people[i],key=newSessionToken();
   sessions.push("protesto_session="+key);
   await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,'reviewer')",
    [id,"export-fixture-"+id+"@example.org",hashPassword("SyntheticExportStrongPassword!2026")]);
   await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
    [tokenHash(key),id]);
   await pool.query(
    "INSERT INTO civic_cases(id,author_id,title,description,area,category,state) VALUES($1,$2,$3,$4,$5,$6,'pending')",
    [cases[i],id,"Private sample case "+i,
     "Synthetic private description for data export ownership testing.",
     "Synthetic internal locality","Mjedis"]);
   await pool.query(
    "INSERT INTO case_sources(id,case_id,submitted_by,title,url,context) VALUES($1,$2,$3,$4,$5,$6)",
    [ids[i].source,cases[i],id,"Source original title "+i,
     "https://example.org/source-"+i,
     "Synthetic submitted original source context for export."]);
   await pool.query(
    "INSERT INTO case_corrections(id,case_id,author_id,reason,state) VALUES($1,$2,$3,$4,'rejected')",
    [ids[i].correction,cases[i],id,
     "Synthetic correction reason belonging only to account "+i]);
   await pool.query(
    "INSERT INTO correction_appeals(id,correction_id,author_id,reason) VALUES($1,$2,$3,$4)",
    [ids[i].appeal,ids[i].correction,id,
     "Synthetic appeal narrative belonging only to account "+i]);
   await pool.query(
    "INSERT INTO case_responses(id,case_id,author_id,body) VALUES($1,$2,$3,$4)",
    [ids[i].response,cases[i],id,
     "Synthetic private citizen response strictly belonging to account "+i+"."]);
   await pool.query(
    "INSERT INTO dialogue_topics(id,case_id,created_by,title,description) VALUES($1,$2,$3,$4,$5)",
    [ids[i].topic,cases[i],id,"Synthetic private topic "+i,
     "Synthetic context for independent review and personal export account "+i+"."]);
   await pool.query(
    "INSERT INTO dialogue_statements(id,topic_id,author_id,body) VALUES($1,$2,$3,$4)",
    [ids[i].statement,ids[i].topic,id,
     "Synthetic statement belonging to account "+i+" only."]);
  }
  await new Promise((ok,bad)=>server.listen(4215,"127.0.0.1",err=>err?bad(err):ok()));
  const get=async(cookie)=>{
   const res=await fetch(origin+"/api/me/export",{headers:cookie?{Cookie:cookie}:{}});
   return {status:res.status,data:await res.json(),cache:res.headers.get("cache-control")};
  };
  assert.equal((await get()).status,401,"Anonymous cannot export other people's data");
  for(let i=0;i<2;i++){
   const {status,data,cache}=await get(sessions[i]);
   assert.equal(status,200);
   assert.equal(cache,"no-store");
   assert.equal(data.user.id,people[i]);
   assert.equal(data.export_status.complete,false);
   assert.equal(data.export_status.per_category_limit,1000);
   assert.deepEqual(data.export_status.truncated_categories,[]);
   const expected={
    cases:cases[i],sources:ids[i].source,corrections:ids[i].correction,
    appeals:ids[i].appeal,responses:ids[i].response,
    dialogue_topics:ids[i].topic,dialogue_statements:ids[i].statement
   };
   for(const [category,id] of Object.entries(expected)){
    assert.ok(Array.isArray(data.records[category]),category+" is returned");
    assert.ok(data.records[category].some(x=>x.id===id),"Own "+category+" must be exported");
    const other=i===0?1:0;
    const otherId=category==="cases"?cases[other]:ids[other][{
     sources:"source",corrections:"correction",appeals:"appeal",
     responses:"response",dialogue_topics:"topic",
     dialogue_statements:"statement"
    }[category]];
    assert.ok(!data.records[category].some(x=>x.id===otherId),"Other person's "+category+" must stay private");
   }
   assert.equal(data.records.responses.find(x=>x.id===ids[i].response).body,
    "Synthetic private citizen response strictly belonging to account "+i+".");
   assert.equal(data.records.appeals.find(x=>x.id===ids[i].appeal).reason,
    "Synthetic appeal narrative belonging only to account "+i);
  }
 }finally{
  if(server.listening)await new Promise(ok=>server.close(ok));
  await pool.query("DELETE FROM dialogue_statements WHERE id=ANY($1::uuid[])",[ids.map(x=>x.statement)]);
  await pool.query("DELETE FROM dialogue_topics WHERE id=ANY($1::uuid[])",[ids.map(x=>x.topic)]);
  await pool.query("DELETE FROM case_responses WHERE id=ANY($1::uuid[])",[ids.map(x=>x.response)]);
  await pool.query("DELETE FROM correction_appeals WHERE id=ANY($1::uuid[])",[ids.map(x=>x.appeal)]);
  await pool.query("DELETE FROM case_corrections WHERE id=ANY($1::uuid[])",[ids.map(x=>x.correction)]);
  await pool.query("DELETE FROM case_sources WHERE id=ANY($1::uuid[])",[ids.map(x=>x.source)]);
  await pool.query("DELETE FROM civic_cases WHERE id=ANY($1::uuid[])",[cases]);
  await pool.query("DELETE FROM sessions WHERE user_id=ANY($1::uuid[])",[people]);
  await pool.query("DELETE FROM civic_users WHERE id=ANY($1::uuid[])",[people]);
  await pool.end();
 }
});
