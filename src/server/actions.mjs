import {randomUUID} from "node:crypto";
import {cleanText,validateInitiative,validateGathering} from "../domain.mjs";
import {canReview} from "./security.mjs";
import {reviewedActionCopy} from "./action-publication.mjs";
import {lockAuthorQuota} from "./author-quotas.mjs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const actionGetRoutes=["/api/actions/public","/api/actions/mine","/api/actions/review/queue"];
export const actionPostRoute=pathname=>pathname==="/api/actions"||/^\/api\/actions\/review\/[^/]+$/.test(pathname)||/^\/api\/actions\/archive\/[^/]+$/.test(pathname);
export async function actionRoute({pathname,req,res,pool,user,json,fail,readJSON}){
 if(pathname==="/api/actions/public"&&req.method==="GET"){
  const rows=await pool.query("SELECT id,kind,subtype,public_title AS title,public_description AS description,public_area AS area,event_date,created_at FROM civic_actions WHERE state='published' AND public_title IS NOT NULL AND public_description IS NOT NULL AND public_area IS NOT NULL ORDER BY created_at DESC LIMIT 100");
  return json(res,200,{items:rows.rows});
 }
 if(!user)return fail(res,401,"Kërkohet identifikim.");
 if(pathname==="/api/actions/mine"&&req.method==="GET"){
  const rows=await pool.query("SELECT id,kind,subtype,title,description,area,event_date,state,created_at FROM civic_actions WHERE author_id=$1 ORDER BY created_at DESC LIMIT 100",[user.id]);
  return json(res,200,{items:rows.rows});
 }
 if(pathname==="/api/actions"&&req.method==="POST"){
  const input=await readJSON(req);
  let entry;
  try{
   if(input.kind==="initiative")entry={...validateInitiative(input,new Date(),randomUUID),kind:"initiative"};
   else if(input.kind==="gathering")entry={...validateGathering(input,new Date(),randomUUID),kind:"gathering"};
   else return fail(res,422,"Lloji i veprimit nuk është i vlefshëm.");
  }catch(e){return fail(res,422,e.message);}
  const client=await pool.connect();
  try{
   await client.query("BEGIN");
   await lockAuthorQuota(client,"action-create",user.id);
   const recent=await client.query("SELECT count(*)::integer AS n FROM civic_actions WHERE author_id=$1 AND created_at>now()-interval '1 hour'",[user.id]);
   if(recent.rows[0].n>=6){await client.query("ROLLBACK");return fail(res,429,"Maksimumi 6 nisma ose takime për orë.");}
   const result=await client.query("INSERT INTO civic_actions(id,author_id,kind,subtype,title,description,area,event_date,state) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'pending') RETURNING id,kind,state,created_at",[entry.id,user.id,entry.kind,entry.kind==="initiative"?entry.type:null,entry.title,entry.description,entry.area,entry.kind==="gathering"?entry.date:null]);
   await client.query("COMMIT");
   return json(res,201,{item:result.rows[0],message:"Regjistrimi është në pritje të shqyrtimit."});
  }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
  finally{client.release();}
 }
 if(!canReview(user.role))return fail(res,403,"Kërkohet rol verifikuesi.");
 if(pathname==="/api/actions/review/queue"&&req.method==="GET"){
  const rows=await pool.query("SELECT id,author_id,kind,subtype,title,description,area,event_date,created_at FROM civic_actions WHERE state='pending' ORDER BY created_at ASC LIMIT 100");
  return json(res,200,{items:rows.rows});
 }
 const parts=pathname.split("/");
 const id=parts.at(-1),operation=parts.at(-2);
 if(req.method!=="POST"||!UUID.test(id)||!["review","archive"].includes(operation))return fail(res,400,"Operacion i pavlefshëm.");
 const body=await readJSON(req);
 const decision=operation==="archive"?"archived":body.decision;
 const note=cleanText(body.note,1001);
 const minimum=operation==="archive"?20:15;
 if(!["published","rejected","archived"].includes(decision)||note.length<minimum||note.length>1000)return fail(res,422,"Vendimi ose arsyetimi nuk është i vlefshëm.");
 if(operation==="review"&&decision==="archived")return fail(res,422,"Përdor tërheqjen për një publikim ekzistues.");
 const approved=operation==="review"&&decision==="published"?reviewedActionCopy(body):null;
 if(operation==="review"&&decision==="published"&&!approved)
  return fail(res,422,"Kërkohet kopje publike e redaktuar dhe kontrolle privatësie.");
 const expectedState=operation==="archive"?"published":"pending";
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  const updated=operation==="archive"
    ?await client.query("UPDATE civic_actions SET state=$1,reviewer_id=$2,reviewed_at=now() WHERE id=$3 AND state=$4 AND author_id<>$2 RETURNING id,kind,state",[decision,user.id,id,expectedState])
    :await client.query("UPDATE civic_actions SET state=$1,reviewer_id=$2,reviewed_at=now(),public_title=$5,public_description=$6,public_area=$7 WHERE id=$3 AND state=$4 AND author_id<>$2 RETURNING id,kind,state",
      [decision,user.id,id,expectedState,approved?.title??null,approved?.description??null,approved?.area??null]);
  if(!updated.rowCount){await client.query("ROLLBACK");return fail(res,409,"Regjistrimi nuk mund të shqyrtohet, është shqyrtuar ose të përket ty.");}
  await client.query("INSERT INTO action_reviews(id,action_id,reviewer_id,decision,note) VALUES($1,$2,$3,$4,$5)",[randomUUID(),id,user.id,decision,note]);
  await client.query("INSERT INTO audit_entries(id,actor_id,action,object_type,object_id) VALUES($1,$2,$3,'action',$4)",[randomUUID(),user.id,"action."+decision,id]);
  await client.query("COMMIT");
  return json(res,200,{item:updated.rows[0]});
 }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
 finally{client.release();}
}
