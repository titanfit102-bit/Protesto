import {randomUUID} from "node:crypto";
import {cleanText,validateSourceUrl} from "../domain.mjs";
import {canReview} from "./security.mjs";
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const casePath=/^\/api\/dossiers\/([^/]+)\/responses$/;
const reviewPath=/^\/api\/editorial\/responses\/([^/]+)\/review$/;
export const responseGetRoute=p=>casePath.test(p)||p==="/api/editorial/responses/mine"||p==="/api/editorial/responses/queue";
export const responsePostRoute=p=>casePath.test(p)||reviewPath.test(p);
export async function responseRoute({pathname,req,res,pool,user,readJSON,json,fail}){
 const match=pathname.match(casePath);
 if(match){
  if(!UUID.test(match[1]))return fail(res,400,"ID dosjeje i pavlefshëm.");
  const c=await pool.query("SELECT id,state,author_id,public_title,public_description,public_area FROM civic_cases WHERE id=$1",[match[1]]);
  if(!c.rowCount||c.rows[0].state!=="published"||!c.rows[0].public_title||!c.rows[0].public_description||!c.rows[0].public_area)return fail(res,404,"Dosja nuk është publike.");
  if(req.method==="GET"){
   const r=await pool.query("SELECT id,public_body AS body,reviewed_at FROM case_responses WHERE case_id=$1 AND state='accepted' AND public_body IS NOT NULL ORDER BY reviewed_at ASC,id ASC LIMIT 50",[match[1]]);
   return json(res,200,{items:r.rows,disclaimer:"Përgjigje qytetare e moderuar, pa verifikim institucional."});
  }
  if(!user)return fail(res,401,"Kërkohet identifikim.");
  const body=await readJSON(req),statement=cleanText(body.body,1801);
  let source="";try{source=body.sourceUrl?validateSourceUrl(body.sourceUrl):"";}catch{return fail(res,422,"URL e pavlefshme.");}
  if(statement.length<40||statement.length>1800)return fail(res,422,"Përgjigjja duhet të ketë 40–1800 karaktere.");
  if(user.id===c.rows[0].author_id)return fail(res,403,"Autori i dosjes duhet të përdorë procesin e korrigjimit.");
  try{
   const r=await pool.query("INSERT INTO case_responses(id,case_id,author_id,body,source_url) VALUES($1,$2,$3,$4,$5) RETURNING id,state,created_at",
    [randomUUID(),match[1],user.id,statement,source]);
   return json(res,201,{item:r.rows[0],message:"Përgjigjja u ruajt privatisht për verifikim."});
  }catch(e){if(e.code==="23505")return fail(res,409,"Ke dorëzuar tashmë një përgjigje për këtë dosje.");throw e;}
 }
 if(!user)return fail(res,401,"Kërkohet identifikim.");
 if(pathname==="/api/editorial/responses/mine"){
  const r=await pool.query("SELECT id,case_id,state,body,created_at FROM case_responses WHERE author_id=$1 ORDER BY created_at DESC LIMIT 50",[user.id]);
  return json(res,200,{items:r.rows});
 }
 if(pathname==="/api/editorial/responses/queue"){
  if(!canReview(user.role))return fail(res,403,"Kërkohet verifikues.");
  const r=await pool.query("SELECT r.id,r.case_id,r.author_id,r.body,r.source_url,c.title,c.author_id AS case_author_id FROM case_responses r JOIN civic_cases c ON c.id=r.case_id WHERE r.state='pending' AND c.state='published' AND c.public_title IS NOT NULL AND c.public_description IS NOT NULL AND c.public_area IS NOT NULL ORDER BY r.created_at ASC LIMIT 100");
  return json(res,200,{items:r.rows});
 }
 const rv=pathname.match(reviewPath);
 if(rv&&req.method==="POST"){
  if(!UUID.test(rv[1]))return fail(res,400,"ID përgjigjeje i pavlefshëm.");
  if(!canReview(user.role))return fail(res,403,"Kërkohet verifikues.");
  const body=await readJSON(req),decision=body.decision,note=cleanText(body.note,1001);
  const publicBody=decision==="accepted"?cleanText(body.publicBody,1801):null;
  if(!["accepted","rejected"].includes(decision)||note.length<20||note.length>1000||
    (decision==="accepted"&&(publicBody.length<40||publicBody.length>1800||body.privacyReviewed!==true)))
   return fail(res,422,"Duhet vendimi, arsyetimi dhe kopja publike e shqyrtuar.");
  const client=await pool.connect();
  try{
   await client.query("BEGIN");
   const record=await client.query(
    "SELECT r.state,r.author_id,c.state AS case_state,c.author_id AS case_author_id,c.public_title,c.public_description,c.public_area FROM case_responses r JOIN civic_cases c ON c.id=r.case_id WHERE r.id=$1 FOR UPDATE OF c,r",
    [rv[1]]
   );
   if(!record.rowCount||record.rows[0].state!=="pending"||record.rows[0].case_state!=="published"||!record.rows[0].public_title||!record.rows[0].public_description||!record.rows[0].public_area){
    await client.query("ROLLBACK");return fail(res,409,"Përgjigjja nuk është në pritje.");
   }
   if([record.rows[0].author_id,record.rows[0].case_author_id].includes(user.id)){
    await client.query("ROLLBACK");return fail(res,403,"Konflikt interesi në shqyrtim.");
   }
   const updated=await client.query(
    "UPDATE case_responses SET state=$1,public_body=$2,reviewer_id=$3,review_note=$4,reviewed_at=now() WHERE id=$5 AND state='pending' RETURNING id,state",
    [decision,publicBody,user.id,note,rv[1]]
   );
   await client.query("INSERT INTO audit_entries(id,actor_id,action,object_type,object_id) VALUES($1,$2,$3,'case-response',$4)",
    [randomUUID(),user.id,"case-response."+decision,rv[1]]);
   await client.query("COMMIT");
   return json(res,200,{item:updated.rows[0]});
  }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
  finally{client.release();}
 }
 return fail(res,404,"Nuk u gjet.");
}
