import {randomUUID} from "node:crypto";
import {cleanText, validateSourceUrl} from "../domain.mjs";
import {canReview} from "./security.mjs";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sourceList=/^\/api\/dossiers\/([^/]+)\/sources$/;
const sourceReview=/^\/api\/dossiers\/([^/]+)\/sources\/([^/]+)\/review$/;
const correctionReview=/^\/api\/corrections\/review\/([^/]+)$/;
export const dossierGetRoute=path=>sourceList.test(path)||["/api/corrections/mine","/api/corrections/queue"].includes(path);
export const dossierPostRoute=path=>sourceList.test(path)||sourceReview.test(path)||path==="/api/corrections"||correctionReview.test(path);

function checkedUrl(value) {
  try{return validateSourceUrl(value);}
  catch{return null;}
}

export async function dossierRoute({pathname,req,res,pool,user,json,fail,readJSON}) {
  const srcMatch=pathname.match(sourceList);
  if(srcMatch&&req.method==="GET"){
    if(!UUID.test(srcMatch[1]))return fail(res,400,"ID dosjeje i pavlefshëm.");
    const item=await pool.query("SELECT author_id,state FROM civic_cases WHERE id=$1",[srcMatch[1]]);
    if(!item.rowCount)return fail(res,404,"Dosja nuk ekziston.");
    const record=item.rows[0], privileged=!!user&&(user.id===record.author_id||canReview(user.role));
    if(record.state!=="published"&&!privileged)return fail(res,404,"Dosja nuk është publike.");
    const sources=await pool.query(
      "SELECT id,title,url,context,state,created_at FROM case_sources WHERE case_id=$1 AND ($2::boolean OR state='accepted') ORDER BY created_at ASC LIMIT 20",
      [srcMatch[1],privileged]
    );
    return json(res,200,{items:sources.rows});
  }
  if(!user)return fail(res,401,"Kërkohet identifikim.");

  if(srcMatch&&req.method==="POST"){
    if(!UUID.test(srcMatch[1]))return fail(res,400,"ID dosjeje i pavlefshëm.");
    const input=await readJSON(req);
    const title=cleanText(input.title,161),context=cleanText(input.context,701);
    const url=checkedUrl(input.url);
    if(!url||title.length<8||title.length>160||context.length<20||context.length>700)
      return fail(res,422,"Kërkohet titull, URL HTTPS dhe kontekst i saktë (20–700 karaktere).");
    const client=await pool.connect();
    try{
      await client.query("BEGIN");
      const c=await client.query("SELECT id,state,author_id FROM civic_cases WHERE id=$1 FOR UPDATE",[srcMatch[1]]);
      if(!c.rowCount||c.rows[0].author_id!==user.id||c.rows[0].state!=="pending"){
        await client.query("ROLLBACK");return fail(res,403,"Vetëm autori mund të shtojë burime në një dosje në pritje.");
      }
      const n=await client.query("SELECT count(*)::integer n FROM case_sources WHERE case_id=$1",[srcMatch[1]]);
      if(n.rows[0].n>=8){await client.query("ROLLBACK");return fail(res,429,"Kufiri është 8 burime për dosje.");}
      const id=randomUUID();
      await client.query("INSERT INTO case_sources(id,case_id,submitted_by,title,url,context) VALUES($1,$2,$3,$4,$5,$6)",[id,srcMatch[1],user.id,title,url,context]);
      await client.query("COMMIT");
      return json(res,201,{item:{id,state:"pending"},message:"Burimi u shtua. Nuk është verifikuar."});
    }catch(e){
      try{await client.query("ROLLBACK");}catch{}
      if(e.code==="23505")return fail(res,409,"Ky burim ekziston tashmë për dosjen.");
      throw e;
    }finally{client.release();}
  }
  const reviewMatch=pathname.match(sourceReview);
  if(reviewMatch&&req.method==="POST"){
    const [caseId,sourceId]=reviewMatch.slice(1);
    if(!UUID.test(caseId)||!UUID.test(sourceId))return fail(res,400,"ID i pavlefshëm.");
    if(!canReview(user.role))return fail(res,403,"Kërkohet verifikues.");
    const input=await readJSON(req);
    const note=cleanText(input.note,1001),decision=input.decision;
    if(!["accepted","rejected"].includes(decision)||note.length<20||note.length>1000)
      return fail(res,422,"Vendimi dhe arsyetimi 20–1000 karaktere janë të detyrueshëm.");
    const client=await pool.connect();
    try{
      await client.query("BEGIN");
      const row=await client.query(
        "UPDATE case_sources s SET state=$1,reviewed_by=$2,reviewed_at=now(),review_note=$3 FROM civic_cases c WHERE s.id=$4 AND s.case_id=$5 AND c.id=s.case_id AND c.state='pending' AND c.author_id<>$2 AND s.state='pending' RETURNING s.id,s.state,s.case_id",
        [decision,user.id,note,sourceId,caseId]
      );
      if(!row.rowCount){await client.query("ROLLBACK");return fail(res,409,"Burimi nuk mund të shqyrtohet.");}
      await client.query("INSERT INTO audit_entries(id,actor_id,action,object_type,object_id) VALUES($1,$2,$3,'source',$4)",[randomUUID(),user.id,"source."+decision,sourceId]);
      await client.query("COMMIT");
      return json(res,200,{item:row.rows[0]});
    }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
    finally{client.release();}
  }
  if(pathname==="/api/corrections"&&req.method==="POST"){
    const input=await readJSON(req),caseId=String(input.caseId||"");
    const reason=cleanText(input.reason,2001);
    const source=input.source?checkedUrl(input.source):"";
    if(!UUID.test(caseId)||reason.length<30||reason.length>2000||source===null)
      return fail(res,422,"ID, arsye 30–2000 karaktere dhe një URL HTTPS opsionale kërkohen.");
    const item=await pool.query("SELECT id FROM civic_cases WHERE id=$1 AND state='published'",[caseId]);
    if(!item.rowCount)return fail(res,404,"Dosja nuk është publike.");
    const recent=await pool.query("SELECT count(*)::integer n FROM case_corrections WHERE author_id=$1 AND created_at>now()-interval '1 day'",[user.id]);
    if(recent.rows[0].n>=5)return fail(res,429,"Lejohen deri në 5 kërkesa korrigjimi në ditë.");
    const created=await pool.query(
      "INSERT INTO case_corrections(id,case_id,author_id,reason,counter_source_url) VALUES($1,$2,$3,$4,$5) RETURNING id,state,created_at",
      [randomUUID(),caseId,user.id,reason,source]
    );
    return json(res,201,{item:created.rows[0],message:"Kërkesa u dërgua për vlerësim, jo për publikim."});
  }
  if(pathname==="/api/corrections/mine"&&req.method==="GET"){
    const items=await pool.query("SELECT id,case_id,state,reason,created_at FROM case_corrections WHERE author_id=$1 ORDER BY created_at DESC LIMIT 50",[user.id]);
    return json(res,200,{items:items.rows});
  }
  if(pathname==="/api/corrections/queue"&&req.method==="GET"){
    if(!canReview(user.role))return fail(res,403,"Kërkohet verifikues.");
    const items=await pool.query("SELECT r.id,r.case_id,r.author_id,r.reason,r.counter_source_url,r.created_at,c.title FROM case_corrections r JOIN civic_cases c ON c.id=r.case_id WHERE r.state='pending' ORDER BY r.created_at ASC LIMIT 100");
    return json(res,200,{items:items.rows});
  }
  const match=pathname.match(correctionReview);
  if(match&&req.method==="POST"){
    if(!UUID.test(match[1]))return fail(res,400,"ID i pavlefshëm.");
    if(!canReview(user.role))return fail(res,403,"Kërkohet verifikues.");
    const input=await readJSON(req),decision=input.decision,note=cleanText(input.note,1001);
    if(!["accepted","rejected"].includes(decision)||note.length<20||note.length>1000)
      return fail(res,422,"Vendimi dhe arsyetimi 20–1000 karaktere kërkohen.");
    const client=await pool.connect();
    try{
      await client.query("BEGIN");
      const r=await client.query("UPDATE case_corrections SET state=$1,reviewer_id=$2,review_note=$3,reviewed_at=now() WHERE id=$4 AND state='pending' AND author_id<>$2 RETURNING id,case_id,state",[decision,user.id,note,match[1]]);
      if(!r.rowCount){await client.query("ROLLBACK");return fail(res,409,"Kërkesa është shqyrtuar ose të përket ty.");}
      if(decision==="accepted"){
        const c=await client.query("UPDATE civic_cases SET state='archived',reviewed_at=now(),reviewed_by=$1 WHERE id=$2 AND state='published' RETURNING id",[user.id,r.rows[0].case_id]);
        if(!c.rowCount){await client.query("ROLLBACK");return fail(res,409,"Dosja nuk mund të tërhiqet.");}
        await client.query("INSERT INTO retraction_history(id,case_id,reviewer_id,note) VALUES($1,$2,$3,$4)",[randomUUID(),c.rows[0].id,user.id,"Korrigjim i pranuar: "+note]);
      }
      await client.query("INSERT INTO audit_entries(id,actor_id,action,object_type,object_id) VALUES($1,$2,$3,'correction',$4)",[randomUUID(),user.id,"correction."+decision,match[1]]);
      await client.query("COMMIT");
      return json(res,200,{item:r.rows[0]});
    }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
    finally{client.release();}
  }
  return fail(res,404,"Nuk ekziston.");
}
