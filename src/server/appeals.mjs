import {randomUUID} from "node:crypto";
import {cleanText} from "../domain.mjs";
import {canReview} from "./security.mjs";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const reviewPath=/^\/api\/appeals\/review\/([^/]+)$/;
export const appealGetRoute=path=>path==="/api/appeals/mine"||path==="/api/appeals/queue";
export const appealPostRoute=path=>path==="/api/appeals"||reviewPath.test(path);

/**
 * Rejected correction appeals preserve the original rejection unchanged.
 * A second, independent reviewer may accept the appeal, withdrawing an
 * active publication with an audit trail. No automatic republication.
 */
export async function appealRoute({pathname,req,res,pool,user,json,fail,readJSON}){
 if(!user)return fail(res,401,"Identifikimi është i detyrueshëm.");
 if(pathname==="/api/appeals/mine"&&req.method==="GET"){
  const result=await pool.query(
   "SELECT a.id,a.correction_id,a.reason,a.state,a.created_at,a.reviewed_at FROM correction_appeals a WHERE a.author_id=$1 ORDER BY a.created_at DESC LIMIT 50",[user.id]);
  return json(res,200,{items:result.rows});
 }
 if(pathname==="/api/appeals"&&req.method==="POST"){
  const body=await readJSON(req),correctionId=String(body.correctionId||"");
  const reason=cleanText(body.reason,2001);
  if(!UUID.test(correctionId)||reason.length<30||reason.length>2000)
   return fail(res,422,"Kërkohet ID e korrigjimit dhe arsyetim 30–2000 karaktere.");
  const row=await pool.query(
   "SELECT r.id FROM case_corrections r JOIN civic_cases c ON c.id=r.case_id WHERE r.id=$1 AND r.author_id=$2 AND r.state='rejected' AND c.state='published'",
   [correctionId,user.id]
  );
  if(!row.rowCount)return fail(res,409,"Apelimi lejohet vetëm për korrigjimin tënd të refuzuar mbi dosje ende të publikuar.");
  const recent=await pool.query("SELECT count(*)::integer n FROM correction_appeals WHERE author_id=$1 AND created_at>now()-interval '1 day'",[user.id]);
  if(recent.rows[0].n>=3)return fail(res,429,"Maksimumi 3 apelime në ditë.");
  try{
   const created=await pool.query(
    "INSERT INTO correction_appeals(id,correction_id,author_id,reason) VALUES($1,$2,$3,$4) RETURNING id,state,created_at",
    [randomUUID(),correctionId,user.id,reason]
   );
   return json(res,201,{item:created.rows[0],message:"Apelimi u dërgua për verifikim të pavarur."});
  }catch(e){if(e.code==="23505")return fail(res,409,"Për këtë korrigjim është dërguar tashmë një apelim.");throw e;}
 }
 if(!canReview(user.role))return fail(res,403,"Kërkohet rol i verifikuesit.");
 if(pathname==="/api/appeals/queue"&&req.method==="GET"){
  const result=await pool.query(
   "SELECT a.id,a.correction_id,a.author_id,a.reason,a.created_at,r.reviewer_id AS original_reviewer_id,c.title,c.author_id AS case_author_id FROM correction_appeals a JOIN case_corrections r ON r.id=a.correction_id JOIN civic_cases c ON c.id=r.case_id WHERE a.state='pending' AND r.state='rejected' AND c.state='published' ORDER BY a.created_at ASC LIMIT 100"
  );
  return json(res,200,{items:result.rows});
 }
 const match=pathname.match(reviewPath);
 if(!match||req.method!=="POST"||!UUID.test(match[1]))return fail(res,404,"Operacioni nuk ekziston.");
 const body=await readJSON(req),decision=body.decision,note=cleanText(body.note,1001);
 if(!["accepted","rejected"].includes(decision)||note.length<25||note.length>1000)
  return fail(res,422,"Vendimi dhe arsyetimi 25–1000 karaktere janë të detyrueshëm.");
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  // Lock the appeal row and check editorial independence before doing any writes.
  const q=await client.query(
   "SELECT a.id,a.correction_id,a.author_id,a.state,r.case_id,r.reviewer_id AS original_reviewer_id,c.author_id AS case_author_id,c.state AS case_state FROM correction_appeals a JOIN case_corrections r ON r.id=a.correction_id JOIN civic_cases c ON c.id=r.case_id WHERE a.id=$1 FOR UPDATE OF c,a",
   [match[1]]
  );
  const appeal=q.rows[0];
  if(!appeal||appeal.state!=="pending"||appeal.case_state!=="published"){
   await client.query("ROLLBACK");return fail(res,409,"Apelimi ose dosja nuk janë më aktive.");
  }
  if([appeal.author_id,appeal.original_reviewer_id,appeal.case_author_id].includes(user.id)){
   await client.query("ROLLBACK");return fail(res,403,"Apelimin duhet ta shqyrtojë një verifikues tjetër, i pavarur nga vendimi fillestar.");
  }
  if(decision==="accepted"){
   const updated=await client.query(
    "UPDATE civic_cases SET state='archived',reviewed_at=now(),reviewed_by=$1 WHERE id=$2 AND state='published' RETURNING id",
    [user.id,appeal.case_id]
   );
   if(!updated.rowCount){await client.query("ROLLBACK");return fail(res,409,"Dosja nuk është më e publikuar; nuk mund të miratohet tërheqja.");}
   await client.query(
    "INSERT INTO retraction_history(id,case_id,reviewer_id,note) VALUES($1,$2,$3,$4)",
    [randomUUID(),appeal.case_id,user.id,"Apelimi i pranuar: "+note]
   );
  }
  await client.query("UPDATE correction_appeals SET state=$1,reviewer_id=$2,review_note=$3,reviewed_at=now() WHERE id=$4",[decision,user.id,note,match[1]]);
  await client.query("INSERT INTO audit_entries(id,actor_id,action,object_type,object_id) VALUES($1,$2,$3,'appeal',$4)",[randomUUID(),user.id,"appeal."+decision,match[1]]);
  await client.query("COMMIT");
  return json(res,200,{item:{id:match[1],state:decision}});
 }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
 finally{client.release();}
}
