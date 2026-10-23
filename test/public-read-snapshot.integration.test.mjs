import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createPilotServer} from "../src/server/app.mjs";
import {hashPassword} from "../src/server/security.mjs";

test("public dialogue and citizen replies project data from a single case-state snapshot",
 {skip:!process.env.DATABASE_URL},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:5});
 const origin="http://127.0.0.1:4213";
 const id={author:randomUUID(),case:randomUUID(),topic:randomUUID(),
  statement:randomUUID(),response:randomUUID()};
 const queries=[];
 const monitoredPool={
  connect:(...args)=>pool.connect(...args),
  query:async(sql,...args)=>{queries.push(sql);return pool.query(sql,...args);}
 };
 const server=createPilotServer(monitoredPool,{origin,
  rateLimitSecret:"synthetic-single-snapshot-rate-limit-isolated",
  dialogueSecret:"synthetic-single-snapshot-dialogue-secret"});
 const topicPath="/api/dialogue/topics/"+id.topic;
 const responsePath="/api/dossiers/"+id.case+"/responses";
 const get=async(path)=>{
  queries.length=0;
  const r=await fetch(origin+path);
  const output={status:r.status,data:await r.json()};
  assert.equal(queries.length,1,"Public GET must use one DB statement for eligibility and content");
  assert.equal(typeof queries[0],"string");
  assert.match(queries[0],/c\.state='published'/);
  return output;
 };
 try{
  await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,'reporter')",
   [id.author,"single-snapshot-"+id.author+"@example.org",hashPassword("SyntheticSnapshotPassword!2026")]);
  await pool.query("INSERT INTO civic_cases(id,author_id,title,description,area,category,state,public_title,public_description,public_area) VALUES($1,$2,$3,$4,$5,$6,'published',$7,$8,$9)",
   [id.case,id.author,"PRIVATE case title not approved",
    "PRIVATE original case description with identifying information.",
    "PRIVATE original address","Mjedis","Published public case title",
    "Approved synthetic public case description for this read-snapshot test.",
    "General public location"]);
  await pool.query("INSERT INTO dialogue_topics(id,case_id,created_by,title,description,public_title,public_description,state,review_state) VALUES($1,$2,$3,$4,$5,$6,$7,'open','approved')",
   [id.topic,id.case,id.author,"PRIVATE internal topic title",
    "PRIVATE internal topic description never published.",
    "Public approved topic title","Public approved topic context for the snapshot verification."]);
  await pool.query("INSERT INTO dialogue_statements(id,topic_id,author_id,body,state,public_body) VALUES($1,$2,$3,$4,'accepted',$5)",
   [id.statement,id.topic,id.author,"PRIVATE original statement with sensitive details.",
    "Public reviewed statement with no unnecessary personal details."]);
  await pool.query("INSERT INTO case_responses(id,case_id,author_id,body,state,public_body,reviewed_at) VALUES($1,$2,$3,$4,'accepted',$5,now())",
   [id.response,id.case,id.author,"PRIVATE original citizen response containing identifiable details.",
    "Public redacted citizen response with approved content."]);
  await new Promise((resolve,reject)=>server.listen(4213,"127.0.0.1",err=>err?reject(err):resolve()));

  let topic=await get(topicPath);
  assert.equal(topic.status,200);
  assert.equal(topic.data.item.title,"Public approved topic title");
  assert.deepEqual(Object.keys(topic.data.item).sort(),
   ["case_id","closed_at","created_at","description","id","state","title"].sort());
  assert.equal(topic.data.statements.length,1);
  assert.equal(topic.data.statements[0].body,"Public reviewed statement with no unnecessary personal details.");
  assert.equal(topic.data.statements[0].participants,null);
  assert.equal(topic.data.statements[0].agree_count,null);
  assert.ok(!JSON.stringify(topic.data).includes("PRIVATE"));

  let replies=await get(responsePath);
  assert.equal(replies.status,200);
  assert.equal(replies.data.items.length,1);
  assert.deepEqual(Object.keys(replies.data.items[0]).sort(),["id","body","reviewed_at"].sort());
  assert.equal(replies.data.items[0].body,"Public redacted citizen response with approved content.");
  assert.ok(!JSON.stringify(replies.data).includes("PRIVATE"));

  // A published legacy case without complete approved metadata is withheld.
  await pool.query("UPDATE civic_cases SET public_description=NULL WHERE id=$1",[id.case]);
  assert.equal((await get(topicPath)).status,404);
  assert.equal((await get(responsePath)).status,404);
  await pool.query("UPDATE civic_cases SET public_description=$1 WHERE id=$2",
   ["Approved synthetic public case description for this read-snapshot test.",id.case]);

  // A pending statement is not exposed even when the topic remains public.
  await pool.query("UPDATE dialogue_statements SET state='pending',public_body=NULL WHERE id=$1",[id.statement]);
  topic=await get(topicPath);
  assert.deepEqual(topic.data.statements,[]);
  await pool.query("UPDATE dialogue_statements SET state='accepted',public_body=$1 WHERE id=$2",
   ["Public reviewed statement with no unnecessary personal details.",id.statement]);

  // Once the parent is withdrawn, both endpoints must fail closed.
  await pool.query("UPDATE civic_cases SET state='archived' WHERE id=$1",[id.case]);
  assert.equal((await get(topicPath)).status,404);
  assert.equal((await get(responsePath)).status,404);
 }finally{
  if(server.listening)await new Promise(resolve=>server.close(resolve));
  await pool.query("DELETE FROM case_responses WHERE id=$1",[id.response]);
  await pool.query("DELETE FROM dialogue_statements WHERE id=$1",[id.statement]);
  await pool.query("DELETE FROM dialogue_topics WHERE id=$1",[id.topic]);
  await pool.query("DELETE FROM civic_cases WHERE id=$1",[id.case]);
  await pool.query("DELETE FROM civic_users WHERE id=$1",[id.author]);
  await pool.end();
 }
});
