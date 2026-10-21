import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createPilotServer} from "../src/server/app.mjs";
import {hashPassword,newSessionToken,tokenHash} from "../src/server/security.mjs";

test("Dialogu Qytetar: independent moderation, consent, vote threshold and deletion",{skip:!process.env.DATABASE_URL},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:8});
 const origin="http://127.0.0.1:4176";
 const server=createPilotServer(pool,{origin,
  rateLimitSecret:"rate-limit-synthetic-dialogue-integration-secret-2026",
  dialogueSecret:"separate-synthetic-dialogue-vote-secret-2026"});
 const u=randomUUID().slice(0,8);
 const reviewer={id:randomUUID(),email:"dialogue-review-"+u+"@example.org",role:"reviewer"};
 const author={id:randomUUID(),email:"dialogue-author-"+u+"@example.org",role:"reporter"};
 const identities=[reviewer,author,...Array.from({length:10},(_,i)=>({id:randomUUID(),email:"dialogue-voter-"+i+"-"+u+"@example.org",role:"reporter"}))];
 const cookies=new Map();
 const sharedHash=hashPassword("ExampleStrongPassword!2026");
 for(const person of identities){
  await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",[person.id,person.email,sharedHash,person.role]);
  const token=newSessionToken();cookies.set(person.id,"protesto_session="+token);
  await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[tokenHash(token),person.id]);
 }
 const publishedCase=randomUUID(),pendingCase=randomUUID();
 for(const [id,state] of [[publishedCase,"published"],[pendingCase,"pending"]]){
  await pool.query("INSERT INTO civic_cases(id,author_id,title,description,area,category,state) VALUES($1,$2,$3,$4,$5,$6,$7)",
   [id,author.id,"Dosje sintetike për dialog","Regjistrim sintetik për testimin e konsultimit qytetar.",u,"Mjedis",state]);
 }
 const send=async(path,{method="GET",body,as,csrf=true}={})=>{
  const headers={};if(as)headers.Cookie=cookies.get(as.id);
  if(method==="POST"){
   headers["Content-Type"]="application/json";
   if(csrf){headers.Origin=origin;headers["X-Protesto-Request"]="1";}
  }
  const res=await fetch(origin+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  return {status:res.status,data:await res.json()};
 };
 await new Promise((resolve,reject)=>server.listen(4176,"127.0.0.1",e=>e?reject(e):resolve()));
 try{
  const topicData={caseId:publishedCase,title:"Diskutim për transparencën e qytetit",description:"Konsultim sintetik për zgjidhje të verifikueshme, jo sondazh përfaqësues."};
  let r=await send("/api/dialogue/topics",{method:"POST",body:topicData});assert.equal(r.status,401);
  r=await send("/api/dialogue/topics",{method:"POST",body:topicData,as:author});assert.equal(r.status,403);
  r=await send("/api/dialogue/topics",{method:"POST",body:{...topicData,caseId:pendingCase},as:reviewer});assert.equal(r.status,409);
  r=await send("/api/dialogue/topics",{method:"POST",body:topicData,as:reviewer,csrf:false});assert.equal(r.status,403);
  r=await send("/api/dialogue/topics",{method:"POST",body:topicData,as:reviewer});
  assert.equal(r.status,201);const topicId=r.data.item.id;
  r=await send("/api/dialogue/topics");assert.ok(r.data.items.some(x=>x.id===topicId));assert.equal(JSON.stringify(r.data).includes(author.email),false);
  const statementData={body:"Bashkia duhet të publikojë raporte të qarta mujore për shërbimet publike."};
  r=await send("/api/dialogue/topics/"+topicId+"/statements",{method:"POST",body:{body:"too short"},as:author});assert.equal(r.status,422);
  r=await send("/api/dialogue/topics/"+topicId+"/statements",{method:"POST",body:statementData,as:author});
  assert.equal(r.status,201);const statementId=r.data.item.id;
  r=await send("/api/dialogue/topics/"+topicId);assert.equal(r.data.statements.length,0,"Pending declarations stay private");
  r=await send("/api/dialogue/review/queue",{as:author});assert.equal(r.status,403);
  r=await send("/api/dialogue/review/queue",{as:reviewer});assert.ok(r.data.items.some(x=>x.id===statementId));
  r=await send("/api/dialogue/statements/"+statementId+"/review",{method:"POST",as:author,body:{decision:"accepted",note:"Vetëmoderimi nuk duhet të jetë i mundur."}});
  assert.equal(r.status,403);
  r=await send("/api/dialogue/statements/"+statementId+"/review",{method:"POST",as:reviewer,body:{decision:"accepted",note:"Deklarata nuk përmban të dhëna private dhe është e përshtatshme."}});
  assert.equal(r.status,200);
  r=await send("/api/dialogue/statements/"+statementId+"/review",{method:"POST",as:reviewer,body:{decision:"rejected",note:"Vendimi nuk mund të ndryshohet dy herë."}});
  assert.equal(r.status,409);
  const smallStatement={body:"Institucioni duhet të tregojë publikisht afatet e kërkesave qytetare."};
  r=await send("/api/dialogue/topics/"+topicId+"/statements",{method:"POST",as:author,body:smallStatement});
  assert.equal(r.status,201);const smallId=r.data.item.id;
  r=await send("/api/dialogue/statements/"+smallId+"/review",{method:"POST",as:reviewer,body:{decision:"accepted",note:"Deklaratë e përshtatshme për testimin e pragut të privatësisë."}});
  assert.equal(r.status,200);
  r=await send("/api/dialogue/topics/"+topicId);
  assert.equal(r.data.statements.length,2);
  assert.ok(r.data.statements.every(s=>s.participants===null&&s.agree_count===null));
  r=await send("/api/dialogue/statements/"+statementId+"/vote",{method:"POST",as:author,body:{choice:"agree"}});
  assert.equal(r.status,422,"Consent acknowledgement required");
  r=await send("/api/dialogue/statements/"+statementId+"/vote",{method:"POST",as:author,body:{choice:"agree",acknowledge:true}});
  assert.equal(r.status,200);
  r=await send("/api/dialogue/statements/"+statementId+"/vote",{method:"POST",as:author,body:{choice:"disagree",acknowledge:true}});
  assert.equal(r.status,200,"User can change their own vote before close");
  for(let i=0;i<10;i++){
   const choice=i<7?"agree":i<9?"disagree":"pass";
   r=await send("/api/dialogue/statements/"+statementId+"/vote",{method:"POST",as:identities[i+2],body:{choice,acknowledge:true}});
   assert.equal(r.status,200);
  }
  r=await send("/api/dialogue/statements/"+smallId+"/vote",{method:"POST",as:author,body:{choice:"agree",acknowledge:true}});
  assert.equal(r.status,200);
  r=await send("/api/dialogue/topics/"+topicId);
  assert.equal(r.data.item.state,"open");
  assert.ok(r.data.statements.every(s=>s.participants===null),"No live tally despite 11 votes");
  r=await send("/api/dialogue/topics/"+topicId+"/close",{method:"POST",as:author,body:{note:"Mbyllja kërkon rol editorial të autorizuar."}});
  assert.equal(r.status,403);
  r=await send("/api/dialogue/topics/"+topicId+"/close",{method:"POST",as:reviewer,body:{note:"Diskutimi sintetik përfundoi dhe rezultatet agregohen me prag."}});
  assert.equal(r.status,200);
  r=await send("/api/dialogue/topics/"+topicId+"/close",{method:"POST",as:reviewer,body:{note:"Mbyllja e dyfishtë nuk lejohet."}});
  assert.equal(r.status,409);
  r=await send("/api/dialogue/topics/"+topicId);
  assert.equal(r.data.item.state,"closed");
  const main=r.data.statements.find(x=>x.id===statementId),small=r.data.statements.find(x=>x.id===smallId);
  assert.equal(main.participants,11);
  assert.equal(main.agree_count,7);
  assert.equal(main.disagree_count,3);
  assert.equal(main.pass_count,1);
  assert.equal(small.participants,null,"Suppress small groups entirely");
  assert.equal(small.agree_count,null);
  const q=await pool.query("SELECT count(*)::integer n FROM dialogue_votes WHERE statement_id IN($1,$2)",[statementId,smallId]);
  assert.equal(q.rows[0].n,0,"All individual vote records purged on close");
  r=await send("/api/dialogue/statements/"+statementId+"/vote",{method:"POST",as:author,body:{choice:"agree",acknowledge:true}});
  assert.equal(r.status,409);
  r=await send("/api/dialogue/topics/"+topicId+"/statements",{method:"POST",as:author,body:statementData});
  assert.equal(r.status,409);
  await pool.query("UPDATE civic_cases SET state='archived' WHERE id=$1",[publishedCase]);
  r=await send("/api/dialogue/topics/"+topicId);assert.equal(r.status,404);
  r=await send("/api/dialogue/topics");assert.ok(!r.data.items.some(x=>x.id===topicId));
 }finally{
  await new Promise(resolve=>server.close(resolve));
  await pool.end();
 }
});
