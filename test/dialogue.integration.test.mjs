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
 const secondReviewer={id:randomUUID(),email:"dialogue-independent-"+u+"@example.org",role:"reviewer"};
 const identities=[reviewer,author,...Array.from({length:10},(_,i)=>({id:randomUUID(),email:"dialogue-voter-"+i+"-"+u+"@example.org",role:"reporter"})),secondReviewer];
 const cookies=new Map();
 const sharedHash=hashPassword("ExampleStrongPassword!2026");
 for(const person of identities){
  await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",[person.id,person.email,sharedHash,person.role]);
  const token=newSessionToken();cookies.set(person.id,"protesto_session="+token);
  await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[tokenHash(token),person.id]);
 }
 const publishedCase=randomUUID(),pendingCase=randomUUID();
 for(const [id,state] of [[publishedCase,"published"],[pendingCase,"pending"]]){
  await pool.query("INSERT INTO civic_cases(id,author_id,title,description,area,category,state,public_title,public_description,public_source_url,public_area) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
   [id,author.id,"PRIVATE synthetic case title","Regjistrim origjinal PRIVAT për kontroll API.",u,"Mjedis",state,
    state==="published"?"Dosje publike e rishikuar për dialog":null,
    state==="published"?"Kopje publike sintetike e rishikuar për raportin qytetar.":null,
    state==="published"?"https://example.org/public-dialogue":null,state==="published"?"Zona publike e testit":null]);
 }
 await pool.query("INSERT INTO case_sources(id,case_id,submitted_by,title,url,context,state,public_title,public_url) VALUES($1,$2,$3,$4,$5,$6,'accepted',$7,$8)",[
  randomUUID(),publishedCase,author.id,"PRIVATE identifying source title",
  "https://example.org/original?private=token","Sintetik për të provuar privatësinë e API-së publike.",
  "Dokument publik i rishikuar","https://example.org/public-dialogue"
 ]);
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
  const topicData={caseId:publishedCase,
    title:"PRIVATE topic title from reviewer",description:"PRIVATE original internal context; not intended for publication.",
    public:{title:"Diskutim publik për transparencën",description:"Përmbajtje e redaktuar publike e këtij diskutimi sintetik."},
    checks:{privacyReviewed:true,publicCopyReviewed:true}};
   let hidden=await send("/api/dialogue/topics",{method:"POST",as:reviewer,body:{
    ...topicData,public:undefined
   }});assert.equal(hidden.status,422,"Topic requires reviewed public copy");
  let r=await send("/api/dialogue/topics",{method:"POST",body:topicData});assert.equal(r.status,401);
  r=await send("/api/dialogue/topics",{method:"POST",body:topicData,as:author});assert.equal(r.status,403);
  r=await send("/api/dialogue/topics",{method:"POST",body:{...topicData,caseId:pendingCase},as:reviewer});assert.equal(r.status,409);
  r=await send("/api/dialogue/topics",{method:"POST",body:topicData,as:reviewer,csrf:false});assert.equal(r.status,403);
  r=await send("/api/dialogue/topics",{method:"POST",body:topicData,as:reviewer});
  assert.equal(r.status,201);const topicId=r.data.item.id;
  assert.equal(r.data.item.review_state,"pending");
  r=await send("/api/dialogue/topics");
  assert.ok(!r.data.items.some(x=>x.id===topicId),"Proposed topic must stay private");
  r=await send("/api/dialogue/topics/"+topicId);assert.equal(r.status,404);
  r=await send("/api/dialogue/topics/"+topicId+"/statements",{method:"POST",as:author,body:{body:"Ky është tekst sintetik për një temë ende të pamiratuar."}});
  assert.equal(r.status,409,"No submissions before independent approval");
  r=await send("/api/dialogue/topic-review/queue");
  assert.equal(r.status,401,"Review queue not public");
  r=await send("/api/dialogue/topic-review/queue",{as:author});
  assert.equal(r.status,403);
  r=await send("/api/dialogue/topic-review/queue",{as:secondReviewer});
  assert.ok(r.data.items.some(x=>x.id===topicId),"Independent reviewer can view pending proposal");
  const reviewedTopic={title:"Diskutim publik i verifikuar në mënyrë të pavarur",
    description:"Kontekst publik sintetik, i redaktuar nga një verifikues tjetër."};
  const reviewPayload={decision:"approved",note:"Kontrolli i pavarur i përmbajtjes dhe privatësisë është përfunduar.",
    public:reviewedTopic,checks:{privacyReviewed:true,publicCopyReviewed:true}};
  const reviewPath="/api/dialogue/topics/"+topicId+"/review";
  r=await send(reviewPath,{method:"POST",as:reviewer,body:reviewPayload});
  assert.equal(r.status,403,"Creator cannot approve own topic");
  r=await send(reviewPath,{method:"POST",as:author,body:reviewPayload});
  assert.equal(r.status,403,"A reporter cannot approve a topic");
  r=await send(reviewPath,{method:"POST",as:secondReviewer,body:{...reviewPayload,checks:{privacyReviewed:false,publicCopyReviewed:true}}});
  assert.equal(r.status,422,"Both attestation checks required");
  r=await send(reviewPath,{method:"POST",as:secondReviewer,body:reviewPayload});
  assert.equal(r.status,200);assert.equal(r.data.item.review_state,"approved");
  r=await send(reviewPath,{method:"POST",as:secondReviewer,body:{decision:"rejected",note:"Nuk lejohet vendim i dytë për të njëjtën temë."}});
  assert.equal(r.status,409,"Decisions are immutable through the review endpoint");
  const reviewDb=await pool.query("SELECT created_by,reviewed_by,review_state,public_title FROM dialogue_topics WHERE id=$1",[topicId]);
  assert.equal(reviewDb.rows[0].created_by,reviewer.id);
  assert.equal(reviewDb.rows[0].reviewed_by,secondReviewer.id);
  assert.equal(reviewDb.rows[0].public_title,reviewedTopic.title);
  const audit=await pool.query("SELECT count(*)::integer n FROM audit_entries WHERE object_id=$1 AND action='dialogue.topic.approved'",[topicId]);
  assert.equal(audit.rows[0].n,1);
  r=await send("/api/dialogue/topic-review/queue",{as:secondReviewer});
  assert.ok(!r.data.items.some(x=>x.id===topicId));
  r=await send("/api/dialogue/topics");assert.ok(r.data.items.some(x=>x.id===topicId));assert.equal(JSON.stringify(r.data).includes(author.email),false);
  const visibleTopic=r.data.items.find(x=>x.id===topicId);
  assert.equal(visibleTopic.title,reviewedTopic.title);
  assert.equal(visibleTopic.description,reviewedTopic.description);
  assert.ok(!JSON.stringify(visibleTopic).includes("PRIVATE"));
  const statementData={body:"PRIVATE source statement: citizen identifying street, not for public release."};
  const approvedStatement="Publikisht kërkojmë raporte mujore të verifikueshme për shërbimet.";
  r=await send("/api/dialogue/topics/"+topicId+"/statements",{method:"POST",body:{body:"too short"},as:author});assert.equal(r.status,422);
  r=await send("/api/dialogue/topics/"+topicId+"/statements",{method:"POST",body:statementData,as:author});
  assert.equal(r.status,201);const statementId=r.data.item.id;
  r=await send("/api/dialogue/topics/"+topicId);assert.equal(r.data.statements.length,0,"Pending declarations stay private");
  r=await send("/api/dialogue/review/queue",{as:author});assert.equal(r.status,403);
  r=await send("/api/dialogue/review/queue",{as:reviewer});assert.ok(r.data.items.some(x=>x.id===statementId));
  r=await send("/api/dialogue/statements/"+statementId+"/review",{method:"POST",as:author,body:{decision:"accepted",note:"Vetëmoderimi nuk duhet të jetë i mundur."}});
  assert.equal(r.status,403);
  r=await send("/api/dialogue/statements/"+statementId+"/review",{method:"POST",as:reviewer,body:{
   decision:"accepted",note:"Përmbajtje e shqyrtuar për publikim, mungon kopja publike."
  }});
  assert.equal(r.status,422,"Cannot accept raw statement without approved public text");
  r=await send("/api/dialogue/statements/"+statementId+"/review",{method:"POST",as:reviewer,body:{
   decision:"accepted",note:"Përmbajtje e shqyrtuar për publikim me redaktim.",
   privacyReviewed:true,publicBody:approvedStatement
  }});
  assert.equal(r.status,200);
  r=await send("/api/dialogue/statements/"+statementId+"/review",{method:"POST",as:reviewer,body:{decision:"rejected",note:"Vendimi nuk mund të ndryshohet dy herë."}});
  assert.equal(r.status,409);
  const smallStatement={body:"Institucioni duhet të tregojë publikisht afatet e kërkesave qytetare."};
  r=await send("/api/dialogue/topics/"+topicId+"/statements",{method:"POST",as:author,body:smallStatement});
  assert.equal(r.status,201);const smallId=r.data.item.id;
  r=await send("/api/dialogue/statements/"+smallId+"/review",{method:"POST",as:reviewer,body:{
   decision:"accepted",note:"Deklaratë e përshtatshme për testimin e pragut të privatësisë.",
   privacyReviewed:true,publicBody:smallStatement.body
  }});
  assert.equal(r.status,200);
  r=await send("/api/dialogue/topics/"+topicId);
  assert.equal(r.data.statements.length,2);
  assert.equal(r.data.statements.find(x=>x.id===statementId).body,approvedStatement);
  assert.ok(!JSON.stringify(r.data).includes("PRIVATE"));
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
  r=await send("/api/dialogue/report");
  assert.equal(r.status,200);
  assert.ok(!r.data.items.some(x=>x.topic_id===topicId),"Report must not reveal open-topic results");

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
  r=await send("/api/dialogue/report");
  assert.equal(r.status,200);
  const entry=r.data.items.find(x=>x.statement_id===statementId);
  assert.ok(entry,"Eligible finalized statement should be in public report");
  assert.equal(entry.participants,11);
  assert.equal(entry.agree_count,7);
  assert.equal(entry.agree_percent+entry.disagree_percent+entry.pass_percent,100);
  assert.equal(entry.agree_percent,64);
  assert.equal(entry.statement_id,statementId);
  assert.equal(entry.topic_id,topicId);
  assert.equal(entry.statement,approvedStatement);
  assert.equal(entry.topic_title,reviewedTopic.title);
  assert.ok(!JSON.stringify(r.data).includes("PRIVATE"));
  assert.equal(entry.case_title,"Dosje publike e rishikuar për dialog");
  assert.equal(entry.source_url,"https://example.org/public-dialogue");
  assert.ok(!JSON.stringify(r.data).includes("PRIVATE"));
  assert.ok(!JSON.stringify(r.data).includes("private=token"));
  assert.ok(!r.data.items.some(x=>x.statement_id===smallId),"Single-vote statement must never be reported");
  assert.equal(JSON.stringify(r.data).includes(author.email),false,"No private identities in aggregate report");

  const privateOriginal=await pool.query("SELECT s.body,s.public_body,t.title,t.public_title FROM dialogue_statements s JOIN dialogue_topics t ON t.id=s.topic_id WHERE s.id=$1",[statementId]);
  assert.equal(privateOriginal.rows[0].body,statementData.body);
  assert.equal(privateOriginal.rows[0].public_body,approvedStatement);
  assert.equal(privateOriginal.rows[0].title,topicData.title);
  assert.equal(privateOriginal.rows[0].public_title,reviewedTopic.title);
  const q=await pool.query("SELECT count(*)::integer n FROM dialogue_votes WHERE statement_id IN($1,$2)",[statementId,smallId]);
  assert.equal(q.rows[0].n,0,"All individual vote records purged on close");
  r=await send("/api/dialogue/statements/"+statementId+"/vote",{method:"POST",as:author,body:{choice:"agree",acknowledge:true}});
  assert.equal(r.status,409);
  r=await send("/api/dialogue/topics/"+topicId+"/statements",{method:"POST",as:author,body:statementData});
  assert.equal(r.status,409);
  // An old case missing reviewed fields must be withheld by public endpoints.
  await pool.query("UPDATE civic_cases SET public_title=NULL,public_description=NULL WHERE id=$1",[publishedCase]);
  r=await send("/api/dialogue/report");
  assert.ok(!r.data.items.some(x=>x.topic_id===topicId));
  r=await send("/api/dialogue/topics");
  assert.ok(!r.data.items.some(x=>x.id===topicId));
  r=await send("/api/dialogue/topics/"+topicId);
  assert.equal(r.status,404);
  r=await send("/api/dossiers/"+publishedCase+"/responses");
  assert.equal(r.status,404);
  await pool.query("UPDATE civic_cases SET public_title=$1,public_description=$2 WHERE id=$3",[
   "Dosje publike e rishikuar për dialog","Kopje publike sintetike e rishikuar për raportin qytetar.",publishedCase
  ]);
  await pool.query("UPDATE civic_cases SET state='archived' WHERE id=$1",[publishedCase]);
  r=await send("/api/dialogue/topics/"+topicId);assert.equal(r.status,404);
  r=await send("/api/dialogue/topics");assert.ok(!r.data.items.some(x=>x.id===topicId));
  r=await send("/api/dialogue/report");
  assert.ok(!r.data.items.some(x=>x.topic_id===topicId),"Archived case removes its report from public listing");

 }finally{
  await new Promise(resolve=>server.close(resolve));
  await pool.end();
 }
});
