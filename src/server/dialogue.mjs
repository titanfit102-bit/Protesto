import {publicDialogueReportItems} from "./dialogue-report.mjs";
import {randomUUID} from "node:crypto";
import {cleanText} from "../domain.mjs";
import {canReview} from "./security.mjs";
import {rateKey} from "./rate-limits.mjs";
import {reviewedTopicCopy,reviewedStatementCopy} from "./dialogue-publication.mjs";

// Original, neutral deliberation implementation inspired by the concept of Polis.
// No Polis source code is incorporated. No inferred political profiles or clusters.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const topic=/^\/api\/dialogue\/topics\/([^/]+)$/;
const statementCreate=/^\/api\/dialogue\/topics\/([^/]+)\/statements$/;
const topicClose=/^\/api\/dialogue\/topics\/([^/]+)\/close$/;
const statementReview=/^\/api\/dialogue\/statements\/([^/]+)\/review$/;
const topicReview=/^\/api\/dialogue\/topics\/([^/]+)\/review$/;
const statementVote=/^\/api\/dialogue\/statements\/([^/]+)\/vote$/;
const publicGet=new Set(["/api/dialogue/topics","/api/dialogue/report"]);
const privateGet=new Set(["/api/dialogue/review/queue","/api/dialogue/topic-review/queue"]);
const posts=new Set(["/api/dialogue/topics"]);
export const dialogueGetRoute=path=>publicGet.has(path)||privateGet.has(path)||topic.test(path);
export const dialoguePostRoute=path=>posts.has(path)||statementCreate.test(path)||topicClose.test(path)||statementReview.test(path)||statementVote.test(path)||topicReview.test(path);
const isUUID=v=>UUID.test(String(v||""));
const jsonTopic="t.id,t.case_id,t.public_title AS title,t.public_description AS description,t.state,t.created_at,t.closed_at";

export async function dialogueRoute({pathname,req,res,pool,user,json,fail,readJSON,dialogueSecret}){
 if(pathname==="/api/dialogue/report"&&req.method==="GET"){
  // A descriptive export of finalized counts only. It is not a population poll.
  const q=await pool.query(
   "SELECT t.id AS topic_id,t.case_id,t.public_title AS topic_title,s.id AS statement_id,s.public_body AS statement,r.participants,r.agree_count,r.disagree_count,r.pass_count,t.closed_at,c.public_title AS case_title,c.public_source_url AS source_url FROM dialogue_results r JOIN dialogue_statements s ON s.id=r.statement_id JOIN dialogue_topics t ON t.id=s.topic_id JOIN civic_cases c ON c.id=t.case_id WHERE t.state='closed' AND t.review_state='approved' AND t.public_title IS NOT NULL AND t.public_description IS NOT NULL AND s.state='accepted' AND s.public_body IS NOT NULL AND c.state='published' AND c.public_title IS NOT NULL AND c.public_description IS NOT NULL AND c.public_area IS NOT NULL AND c.public_title IS NOT NULL AND c.public_description IS NOT NULL AND c.public_area IS NOT NULL AND c.public_source_url IS NOT NULL AND EXISTS (SELECT 1 FROM case_sources cs WHERE cs.case_id=c.id AND cs.state='accepted' AND cs.public_title IS NOT NULL AND cs.public_url=c.public_source_url) AND r.participants>=10 ORDER BY t.closed_at DESC,s.created_at ASC LIMIT 100"
  );
  return json(res,200,{
   format:"protesto-dialogue-aggregates/1",
   disclaimer:"Përgjigje vullnetare nga pjesëmarrësit e kësaj platforme. Nuk janë përfaqësuese për popullsinë dhe nuk vërtetojnë fakte.",
   methodology:{minimumRespondents:10,visibility:"Vetëm diskutime të mbyllura dhe deklarata me 10+ përgjigje.",choices:["agree","disagree","pass"],identifiers:"Asnjë identifikues votuesi nuk përfshihet."},
   items:publicDialogueReportItems(q.rows)
  });
 }
 if(pathname==="/api/dialogue/topics"&&req.method==="GET"){
  const data=await pool.query("SELECT "+jsonTopic+" FROM dialogue_topics t JOIN civic_cases c ON c.id=t.case_id WHERE t.review_state='approved' AND t.public_title IS NOT NULL AND t.public_description IS NOT NULL AND c.state='published' AND c.public_title IS NOT NULL AND c.public_description IS NOT NULL AND c.public_area IS NOT NULL ORDER BY t.created_at DESC LIMIT 50");
  return json(res,200,{items:data.rows,disclaimer:"Pjesëmarrja është vullnetare; rezultatet nuk përfaqësojnë popullsinë."});
 }
 const topicMatch=pathname.match(topic);
 if(topicMatch&&req.method==="GET"){
  const id=topicMatch[1];
  if(!isUUID(id))return fail(res,400,"ID i pavlefshëm.");
  const t=await pool.query("SELECT "+jsonTopic+" FROM dialogue_topics t JOIN civic_cases c ON c.id=t.case_id WHERE t.id=$1 AND t.review_state='approved' AND t.public_title IS NOT NULL AND t.public_description IS NOT NULL AND c.state='published' AND c.public_title IS NOT NULL AND c.public_description IS NOT NULL AND c.public_area IS NOT NULL",[id]);
  if(!t.rowCount)return fail(res,404,"Tema nuk është publike.");
  const rows=await pool.query(
   "SELECT s.id,s.public_body AS body,s.created_at,CASE WHEN t.state='closed' AND r.participants>=10 THEN r.participants END AS participants,CASE WHEN t.state='closed' AND r.participants>=10 THEN r.agree_count END AS agree_count,CASE WHEN t.state='closed' AND r.participants>=10 THEN r.disagree_count END AS disagree_count,CASE WHEN t.state='closed' AND r.participants>=10 THEN r.pass_count END AS pass_count FROM dialogue_statements s JOIN dialogue_topics t ON t.id=s.topic_id LEFT JOIN dialogue_results r ON r.statement_id=s.id WHERE s.topic_id=$1 AND s.state='accepted' AND s.public_body IS NOT NULL ORDER BY s.created_at ASC LIMIT 100",
   [id]
  );
  return json(res,200,{item:t.rows[0],statements:rows.rows,minimumParticipants:10,resultsPolicy:"Rezultatet publikohen vetëm pas mbylljes dhe me të paktën 10 përgjigje për deklaratë; jo sondazh përfaqësues."});
 }
 if(!user)return fail(res,401,"Kërkohet identifikim.");
 if(pathname==="/api/dialogue/topic-review/queue"&&req.method==="GET"){
  if(!canReview(user.role))return fail(res,403,"Kërkohet verifikues.");
  const q=await pool.query(
   "SELECT t.id,t.case_id,t.created_by,t.title,t.description,t.public_title,t.public_description,t.created_at,c.author_id AS case_author_id FROM dialogue_topics t JOIN civic_cases c ON c.id=t.case_id WHERE t.review_state='pending' AND t.state='open' AND c.state='published' AND c.public_title IS NOT NULL AND c.public_description IS NOT NULL AND c.public_area IS NOT NULL ORDER BY t.created_at ASC LIMIT 100"
  );
  return json(res,200,{items:q.rows});
 }
 const reviewTopic=pathname.match(topicReview);
 if(reviewTopic&&req.method==="POST"){
  if(!isUUID(reviewTopic[1]))return fail(res,400,"ID teme i pavlefshëm.");
  if(!canReview(user.role))return fail(res,403,"Kërkohet verifikues.");
  const body=await readJSON(req),decision=body.decision,note=cleanText(body.note,1001);
  if(!["approved","rejected"].includes(decision)||note.length<20||note.length>1000)
   return fail(res,422,"Kërkohet vendim dhe arsyetim editorial.");
  const approved=decision==="approved"?reviewedTopicCopy(body):null;
  if(decision==="approved"&&!approved)return fail(res,422,"Kërkohet kopje publike e rishikuar dhe dy konfirmime.");
  const client=await pool.connect();
  try{
   await client.query("BEGIN");
   const q=await client.query(
    "SELECT t.id,t.review_state,t.state,t.created_by,c.author_id AS case_author_id,c.state AS case_state,c.public_title,c.public_description,c.public_area FROM dialogue_topics t JOIN civic_cases c ON c.id=t.case_id WHERE t.id=$1 FOR UPDATE OF c,t",
    [reviewTopic[1]]
   );
   const current=q.rows[0];
   if(!current||current.review_state!=="pending"||current.state!=="open"||current.case_state!=="published"||
      !current.public_title||!current.public_description||!current.public_area){
    await client.query("ROLLBACK");return fail(res,409,"Tema nuk mund të shqyrtohet.");
   }
   if(user.id===current.created_by||user.id===current.case_author_id){
    await client.query("ROLLBACK");return fail(res,403,"Kërkohet verifikues i pavarur.");
   }
   const changed=await client.query(
    "UPDATE dialogue_topics SET review_state=$1,reviewed_by=$2,review_note=$3,reviewed_at=now(),public_title=$4,public_description=$5 WHERE id=$6 AND review_state='pending' RETURNING id,review_state",
    [decision,user.id,note,approved?.title??null,approved?.description??null,reviewTopic[1]]
   );
   await client.query(
    "INSERT INTO audit_entries(id,actor_id,action,object_type,object_id) VALUES($1,$2,$3,'dialogue_topic',$4)",
    [randomUUID(),user.id,"dialogue.topic."+decision,reviewTopic[1]]
   );
   await client.query("COMMIT");
   return json(res,200,{item:changed.rows[0]});
  }catch(error){try{await client.query("ROLLBACK");}catch{}throw error;}
  finally{client.release();}
 }
 if(pathname==="/api/dialogue/review/queue"&&req.method==="GET"){
  if(!canReview(user.role))return fail(res,403,"Kërkohet verifikues.");
  const q=await pool.query(
   "SELECT s.id,s.topic_id,s.author_id,s.body,s.created_at,t.title FROM dialogue_statements s JOIN dialogue_topics t ON t.id=s.topic_id JOIN civic_cases c ON c.id=t.case_id WHERE s.state='pending' AND t.state='open' AND t.review_state='approved' AND t.public_title IS NOT NULL AND t.public_description IS NOT NULL AND c.state='published' AND c.public_title IS NOT NULL AND c.public_description IS NOT NULL AND c.public_area IS NOT NULL ORDER BY s.created_at ASC LIMIT 100"
  );
  return json(res,200,{items:q.rows});
 }
 if(pathname==="/api/dialogue/topics"&&req.method==="POST"){
  if(!canReview(user.role))return fail(res,403,"Vetëm verifikuesit hapin tema.");
  const body=await readJSON(req),caseId=String(body.caseId||""),title=cleanText(body.title,141),description=cleanText(body.description,1201);
  if(!isUUID(caseId)||title.length<8||title.length>140||description.length<35||description.length>1200)
   return fail(res,422,"Përcakto dosjen e publikuar, titullin dhe kontekstin (35–1200 karaktere).");
  const approved=reviewedTopicCopy(body);
  if(!approved)return fail(res,422,"Kërkohet kopje publike e rishikuar dhe kontroll privatësie.");
  const approved=reviewedTopicCopy(body);
  if(!approved)return fail(res,422,"Kërkohet kopje publike e rishikuar dhe kontroll privatësie.");
  const count=await pool.query("SELECT count(*)::integer n FROM dialogue_topics WHERE created_by=$1 AND created_at>now()-interval '1 day'",[user.id]);
  if(count.rows[0].n>=5)return fail(res,429,"Maksimumi pesë tema të reja në ditë.");
  const result=await pool.query(
   "INSERT INTO dialogue_topics(id,case_id,created_by,title,description,public_title,public_description) SELECT $1,c.id,$2,$3,$4,$6,$7 FROM civic_cases c WHERE c.id=$5 AND c.state='published' AND c.public_title IS NOT NULL AND c.public_description IS NOT NULL AND c.public_area IS NOT NULL RETURNING id,state",
   [randomUUID(),user.id,title,description,caseId,approved.title,approved.description]
  );
  if(!result.rowCount)return fail(res,409,"Dosja nuk është e publikuar.");
  return json(res,201,{item:{...result.rows[0],review_state:"pending"},message:"Tema u dërgua për miratim të pavarur dhe nuk është publike."});
 }
 const create=pathname.match(statementCreate);
 if(create&&req.method==="POST"){
  if(!isUUID(create[1]))return fail(res,400,"ID teme i pavlefshëm.");
  const body=await readJSON(req),value=cleanText(body.body,361);
  if(value.length<25||value.length>360)return fail(res,422,"Deklarata duhet të ketë 25–360 karaktere.");
  const client=await pool.connect();
  try{
   await client.query("BEGIN");
   const parent=await client.query(
    "SELECT t.id FROM dialogue_topics t JOIN civic_cases c ON c.id=t.case_id WHERE t.id=$1 AND t.state='open' AND t.review_state='approved' AND t.public_title IS NOT NULL AND t.public_description IS NOT NULL AND c.state='published' AND c.public_title IS NOT NULL AND c.public_description IS NOT NULL AND c.public_area IS NOT NULL FOR UPDATE OF t",[create[1]]
   );
   if(!parent.rowCount){await client.query("ROLLBACK");return fail(res,409,"Tema është e mbyllur ose nuk ekziston.");}
   const quota=await client.query("SELECT count(*)::integer n FROM dialogue_statements WHERE author_id=$1 AND topic_id=$2 AND created_at>now()-interval '1 day'",[user.id,create[1]]);
   if(quota.rows[0].n>=3){await client.query("ROLLBACK");return fail(res,429,"Maksimumi tre deklarata për temë në ditë.");}
   const newId=randomUUID();
   await client.query("INSERT INTO dialogue_statements(id,topic_id,author_id,body) VALUES($1,$2,$3,$4)",[newId,create[1],user.id,value]);
   await client.query("COMMIT");
   return json(res,201,{item:{id:newId,state:"pending"},message:"Deklarata kërkon miratim përpara se të shfaqet."});
  }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
  finally{client.release();}
 }
 const review=pathname.match(statementReview);
 if(review&&req.method==="POST"){
  if(!isUUID(review[1]))return fail(res,400,"ID deklarate i pavlefshëm.");
  if(!canReview(user.role))return fail(res,403,"Kërkohet verifikues.");
  const body=await readJSON(req),decision=body.decision,note=cleanText(body.note,1001);
  if(!["accepted","rejected"].includes(decision)||note.length<20||note.length>1000)return fail(res,422,"Vendim dhe arsyetim (20–1000 karaktere) kërkohen.");
  const approved=decision==="accepted"?reviewedStatementCopy(body):null;
  if(decision==="accepted"&&!approved)return fail(res,422,"Kërkohet deklaratë publike e redaktuar dhe kontroll privatësie.");
  const client=await pool.connect();
  try{
   await client.query("BEGIN");
   const q=await client.query(
    "UPDATE dialogue_statements s SET state=$1,reviewed_by=$2,reviewed_at=now(),public_body=$4 FROM dialogue_topics t,civic_cases c WHERE s.id=$3 AND s.topic_id=t.id AND c.id=t.case_id AND s.state='pending' AND t.state='open' AND t.review_state='approved' AND t.public_title IS NOT NULL AND t.public_description IS NOT NULL AND c.state='published' AND c.public_title IS NOT NULL AND c.public_description IS NOT NULL AND c.public_area IS NOT NULL AND s.author_id<>$2 RETURNING s.id,s.state",[decision,user.id,review[1],approved]
   );
   if(!q.rowCount){await client.query("ROLLBACK");return fail(res,409,"Deklarata nuk shqyrtohet ose të përket ty.");}
   await client.query("INSERT INTO dialogue_reviews(id,statement_id,reviewer_id,decision,note) VALUES($1,$2,$3,$4,$5)",[randomUUID(),review[1],user.id,decision,note]);
   await client.query("INSERT INTO audit_entries(id,actor_id,action,object_type,object_id) VALUES($1,$2,$3,'dialogue_statement',$4)",[randomUUID(),user.id,"dialogue.statement."+decision,review[1]]);
   await client.query("COMMIT");
   return json(res,200,{item:q.rows[0]});
  }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
  finally{client.release();}
 }
 const vote=pathname.match(statementVote);
 if(vote&&req.method==="POST"){
  if(!isUUID(vote[1]))return fail(res,400,"ID deklarate i pavlefshëm.");
  const body=await readJSON(req);
  if(!["agree","disagree","pass"].includes(body.choice)||body.acknowledge!==true)
   return fail(res,422,"Zgjidh përgjigjen dhe konfirmo njoftimin e privatësisë.");
  const voterKey=rateKey(dialogueSecret,"deliberation-vote:"+vote[1],user.id);
  const client=await pool.connect();
  try{
   await client.query("BEGIN");
   const q=await client.query(
    "SELECT t.id FROM dialogue_statements s JOIN dialogue_topics t ON t.id=s.topic_id JOIN civic_cases c ON c.id=t.case_id WHERE s.id=$1 AND s.state='accepted' AND s.public_body IS NOT NULL AND t.state='open' AND t.review_state='approved' AND t.public_title IS NOT NULL AND t.public_description IS NOT NULL AND c.state='published' AND c.public_title IS NOT NULL AND c.public_description IS NOT NULL AND c.public_area IS NOT NULL FOR UPDATE OF t",
    [vote[1]]
   );
   if(!q.rowCount){await client.query("ROLLBACK");return fail(res,409,"Votimi nuk është i hapur.");}
   await client.query(
    "INSERT INTO dialogue_votes(statement_id,voter_key,choice,consent_version) VALUES($1,$2,$3,'v1') ON CONFLICT(statement_id,voter_key) DO UPDATE SET choice=EXCLUDED.choice,consent_version='v1',updated_at=now()",
    [vote[1],voterKey,body.choice]
   );
   await client.query("COMMIT");
   return json(res,200,{recorded:true,message:"Përgjigjja u regjistrua. Mund ta ndryshosh deri në mbylljen e temës."});
  }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
  finally{client.release();}
 }
 const close=pathname.match(topicClose);
 if(close&&req.method==="POST"){
  if(!isUUID(close[1]))return fail(res,400,"ID teme i pavlefshëm.");
  if(!canReview(user.role))return fail(res,403,"Kërkohet verifikues.");
  const body=await readJSON(req),note=cleanText(body.note,1001);
  if(note.length<20||note.length>1000)return fail(res,422,"Kërkohet arsyetim 20–1000 karaktere.");
  const client=await pool.connect();
  try{
   await client.query("BEGIN");
   const q=await client.query(
    "UPDATE dialogue_topics t SET state='closed',closed_at=now(),closed_by=$1 FROM civic_cases c WHERE t.id=$2 AND t.case_id=c.id AND c.state='published' AND c.public_title IS NOT NULL AND c.public_description IS NOT NULL AND c.public_area IS NOT NULL AND t.state='open' AND t.review_state='approved' RETURNING t.id",[user.id,close[1]]
   );
   if(!q.rowCount){await client.query("ROLLBACK");return fail(res,409,"Tema është mbyllur ose dosja nuk është më publike.");}
   // Totals are calculated only once and only for statements with >=10 distinct voters.
   await client.query(
    "INSERT INTO dialogue_results(statement_id,participants,agree_count,disagree_count,pass_count) SELECT s.id,count(*)::integer,count(*) FILTER(WHERE v.choice='agree')::integer,count(*) FILTER(WHERE v.choice='disagree')::integer,count(*) FILTER(WHERE v.choice='pass')::integer FROM dialogue_statements s JOIN dialogue_votes v ON v.statement_id=s.id WHERE s.topic_id=$1 AND s.state='accepted' AND s.public_body IS NOT NULL GROUP BY s.id HAVING count(*)>=10",
    [close[1]]
   );
   // Delete individual-level votes in the same transaction; retain only eligible aggregates.
   await client.query("DELETE FROM dialogue_votes WHERE statement_id IN (SELECT id FROM dialogue_statements WHERE topic_id=$1)",[close[1]]);
   await client.query("INSERT INTO audit_entries(id,actor_id,action,object_type,object_id) VALUES($1,$2,'dialogue.topic.closed','dialogue_topic',$3)",[randomUUID(),user.id,close[1]]);
   await client.query("COMMIT");
   return json(res,200,{closed:true,message:"Tema u mbyll. Votat individuale u fshinë; mbeten vetëm rezultatet e agreguara të kualifikuara."});
  }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
  finally{client.release();}
 }
 return fail(res,404,"Operacioni nuk ekziston.");
}
