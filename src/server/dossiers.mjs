import {randomUUID} from "node:crypto";
import {cleanText, validateSourceUrl} from "../domain.mjs";
import {canReview} from "./security.mjs";
import {correctionDecisionPolicy} from "./correction-policy.mjs";
import {publicSourceItems,sourceReviewAttestation} from "./source-publication.mjs";
import {validateSourceFingerprint,privateFingerprintRecord} from "./source-fingerprint.mjs";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sourceList=/^\/api\/dossiers\/([^/]+)\/sources$/;
const sourceReview=/^\/api\/dossiers\/([^/]+)\/sources\/([^/]+)\/review$/;
const sourceFingerprint=/^\/api\/dossiers\/([^/]+)\/sources\/([^/]+)\/fingerprint$/;
const correctionReview=/^\/api\/corrections\/review\/([^/]+)$/;
export const dossierGetRoute=path=>sourceList.test(path)||sourceFingerprint.test(path)||["/api/corrections/mine","/api/corrections/queue"].includes(path);
export const dossierPostRoute=path=>sourceList.test(path)||sourceReview.test(path)||sourceFingerprint.test(path)||path==="/api/corrections"||correctionReview.test(path);

function checkedUrl(value) {
  try{return validateSourceUrl(value);}
  catch{return null;}
}

export async function dossierRoute({pathname,req,res,pool,user,json,fail,readJSON}) {
  const srcMatch=pathname.match(sourceList);
  if(srcMatch&&req.method==="GET"){
    if(!UUID.test(srcMatch[1]))return fail(res,400,"ID dosjeje i pavlefshëm.");
    const item=await pool.query("SELECT author_id,state,public_title,public_description,public_area FROM civic_cases WHERE id=$1",[srcMatch[1]]);
    if(!item.rowCount)return fail(res,404,"Dosja nuk ekziston.");
    const record=item.rows[0], privileged=!!user&&(user.id===record.author_id||canReview(user.role));
    if((record.state!=="published"||!record.public_title||!record.public_description||!record.public_area)&&!privileged)return fail(res,404,"Dosja nuk është publike.");
    const sources=await pool.query(
      "SELECT s.id,s.title,s.url,s.context,s.state,s.created_at,s.public_title,s.public_url FROM case_sources s JOIN civic_cases c ON c.id=s.case_id WHERE s.case_id=$1 AND ($2::boolean OR (c.state='published' AND c.public_title IS NOT NULL AND c.public_description IS NOT NULL AND c.public_area IS NOT NULL AND s.state='accepted')) ORDER BY s.created_at ASC LIMIT 20",
      [srcMatch[1],privileged]
    );
    return json(res,200,{
      items:privileged?sources.rows:publicSourceItems(sources.rows),
      disclaimer:"Burimet janë shqyrtuar nga redaktorë. Lidhjet mund të ndryshojnë dhe nuk provojnë vetë vërtetësinë e pretendimit."
    });
  }
  const fingerprintMatch=pathname.match(sourceFingerprint);
  if(fingerprintMatch&&req.method==="GET"){
    const [caseId,sourceId]=fingerprintMatch.slice(1);
    if(!UUID.test(caseId)||!UUID.test(sourceId))return fail(res,400,"ID i pavlefshëm.");
    if(!user)return fail(res,404,"Regjistrimi nuk është publik.");
    const source=await pool.query(
      "SELECT c.author_id FROM case_sources s JOIN civic_cases c ON c.id=s.case_id WHERE s.id=$1 AND s.case_id=$2",
      [sourceId,caseId]
    );
    if(!source.rowCount||!(source.rows[0].author_id===user.id||canReview(user.role)))
      return fail(res,404,"Regjistrimi nuk është publik.");
    const declared=await pool.query(
      "SELECT sha256_hex,byte_length,media_type,created_at FROM source_fingerprints WHERE source_id=$1",
      [sourceId]
    );
    return json(res,200,{item:privateFingerprintRecord(declared.rows[0]||null),
      disclaimer:"SHA-256 i deklaruar nga verifikuesi, jo provë e pavarur autenticiteti."});
  }
  if(!user)return fail(res,401,"Kërkohet identifikim.");
  if(fingerprintMatch&&req.method==="POST"){
    const [caseId,sourceId]=fingerprintMatch.slice(1);
    if(!UUID.test(caseId)||!UUID.test(sourceId))return fail(res,400,"ID i pavlefshëm.");
    if(!canReview(user.role))return fail(res,403,"Kërkohet verifikues.");
    const details=validateSourceFingerprint(await readJSON(req));
    if(!details)return fail(res,422,"Kërkohet hash SHA-256 i PDF-së deri 8 MiB dhe konfirmimet editoriale.");
    const client=await pool.connect();
    try{
      await client.query("BEGIN");
      const record=await client.query(
        "SELECT c.author_id,c.state AS case_state,s.state AS source_state FROM civic_cases c JOIN case_sources s ON s.case_id=c.id WHERE c.id=$1 AND s.id=$2 FOR UPDATE OF c,s",
        [caseId,sourceId]
      );
      if(!record.rowCount||record.rows[0].case_state!=="pending"||
         record.rows[0].source_state!=="accepted"){
        await client.query("ROLLBACK");return fail(res,409,"Vetëm burimet e pranuara, para publikimit, mund të marrin gjurmë.");
      }
      if(record.rows[0].author_id===user.id){
        await client.query("ROLLBACK");return fail(res,403,"Autori i dosjes nuk mund të certifikojë gjurmën.");
      }
      const inserted=await client.query(
        "INSERT INTO source_fingerprints(source_id,sha256_hex,byte_length,media_type,reviewed_by) VALUES($1,$2,$3,$4,$5) ON CONFLICT (source_id) DO NOTHING RETURNING sha256_hex,byte_length,media_type,created_at",
        [sourceId,details.sha256_hex,details.byte_length,details.media_type,user.id]
      );
      if(!inserted.rowCount){
        await client.query("ROLLBACK");return fail(res,409,"Gjurmë e regjistruar më parë; nuk mund të zëvendësohet.");
      }
      await client.query(
        "INSERT INTO audit_entries(id,actor_id,action,object_type,object_id) VALUES($1,$2,'source.fingerprint.declared','source',$3)",
        [randomUUID(),user.id,sourceId]
      );
      await client.query("COMMIT");
      return json(res,201,{item:privateFingerprintRecord(inserted.rows[0]),
        disclaimer:"Gjurmë e deklaruar nga verifikuesi, jo dokument i ruajtur në server."});
    }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
    finally{client.release();}
  }

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
    const attestation=sourceReviewAttestation({decision,note,checks:input.checks,publicMetadata:input.publicMetadata});
    if(!attestation.valid)
      return fail(res,422,"Jep arsyetimin (20–1000 karaktere); për pranim konfirmo kontrollin e lidhjes, privatësisë dhe fushave publike.");
    const client=await pool.connect();
    try{
      await client.query("BEGIN");
      // Serialize source review with case publication/withdrawal. Reading
      // c.state through UPDATE ... FROM alone does not lock the parent case.
      const parent=await client.query(
        "SELECT c.id,c.state AS case_state,c.author_id,s.state AS source_state FROM civic_cases c JOIN case_sources s ON s.case_id=c.id WHERE c.id=$1 AND s.id=$2 FOR UPDATE OF c,s",
        [caseId,sourceId]
      );
      if(!parent.rowCount||parent.rows[0].case_state!=="pending"||parent.rows[0].source_state!=="pending"){
        await client.query("ROLLBACK");return fail(res,409,"Burimi nuk mund të shqyrtohet pas vendimit mbi dosjen.");
      }
      if(parent.rows[0].author_id===user.id){
        await client.query("ROLLBACK");return fail(res,403,"Nuk mund të shqyrtosh burimin e dosjes tënde.");
      }
      const row=await client.query(
        "UPDATE case_sources s SET state=$1,reviewed_by=$2,reviewed_at=now(),review_note=$3,public_title=$6,public_url=$7 FROM civic_cases c WHERE s.id=$4 AND s.case_id=$5 AND c.id=s.case_id AND c.state='pending' AND c.author_id<>$2 AND s.state='pending' RETURNING s.id,s.state,s.case_id",
        [decision,user.id,attestation.reviewNote,sourceId,caseId,attestation.publicTitle??null,attestation.publicUrl??null]
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
    const client=await pool.connect();
    try{
      await client.query("BEGIN");
      // A correction cannot be created after a concurrent case withdrawal.
      const locked=await client.query(
        "SELECT id,state FROM civic_cases WHERE id=$1 FOR UPDATE",[caseId]
      );
      if(!locked.rowCount||locked.rows[0].state!=="published"){
        await client.query("ROLLBACK");return fail(res,409,"Dosja nuk është më publike.");
      }
      // Serialize an author's daily quota even when several different cases
      // are targeted concurrently from distinct application workers.
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))",
        ["correction-author:"+user.id]
      );
      const recent=await client.query(
        "SELECT count(*)::integer n FROM case_corrections WHERE author_id=$1 AND created_at>now()-interval '1 day'",[user.id]
      );
      if(recent.rows[0].n>=5){
        await client.query("ROLLBACK");return fail(res,429,"Lejohen deri në 5 kërkesa korrigjimi në ditë.");
      }
      const created=await client.query(
        "INSERT INTO case_corrections(id,case_id,author_id,reason,counter_source_url) VALUES($1,$2,$3,$4,$5) RETURNING id,state,created_at",
        [randomUUID(),caseId,user.id,reason,source]
      );
      await client.query("COMMIT");
      return json(res,201,{item:created.rows[0],message:"Kërkesa u dërgua për vlerësim, jo për publikim."});
    }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
    finally{client.release();}
  }
  if(pathname==="/api/corrections/mine"&&req.method==="GET"){
    const items=await pool.query("SELECT id,case_id,state,reason,created_at FROM case_corrections WHERE author_id=$1 ORDER BY created_at DESC LIMIT 50",[user.id]);
    return json(res,200,{items:items.rows});
  }
  if(pathname==="/api/corrections/queue"&&req.method==="GET"){
    if(!canReview(user.role))return fail(res,403,"Kërkohet verifikues.");
    const items=await pool.query("SELECT r.id,r.case_id,r.author_id,r.reason,r.counter_source_url,r.created_at,c.title FROM case_corrections r JOIN civic_cases c ON c.id=r.case_id WHERE r.state='pending' AND c.state='published' ORDER BY r.created_at ASC LIMIT 100");
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
      // Lock the parent case and correction before deciding. Prevent a rejected
      // correction from being reviewed after publication was withdrawn, and
      // serialize review with competing case archival transactions.
      const locked=await client.query(
        "SELECT r.id,r.case_id,r.author_id,c.author_id AS case_author_id,r.state AS correction_state,c.state AS case_state FROM case_corrections r JOIN civic_cases c ON c.id=r.case_id WHERE r.id=$1 FOR UPDATE OF c,r",
        [match[1]]
      );
      if(!locked.rowCount){await client.query("ROLLBACK");return fail(res,409,"Kërkesa nuk ekziston.");}
      const context=locked.rows[0];
      const policy=correctionDecisionPolicy({
        case_state:context.case_state,correction_state:context.correction_state,
        author_id:context.author_id,case_author_id:context.case_author_id,reviewer_id:user.id
      });
      if(!policy.mayReview){
        await client.query("ROLLBACK");
        if(policy.reasons.includes("independent_reviewer_required")){
          return fail(res,403,"Autori i dosjes ose i korrigjimit nuk mund të shqyrtojë kërkesën.");
        }
        return fail(res,409,"Dosja nuk është më e publikuar ose korrigjimi është shqyrtuar.");
      }
      const r=await client.query(
        "UPDATE case_corrections SET state=$1,reviewer_id=$2,review_note=$3,reviewed_at=now() WHERE id=$4 AND state='pending' RETURNING id,case_id,state",
        [decision,user.id,note,match[1]]
      );
      if(!r.rowCount){await client.query("ROLLBACK");return fail(res,409,"Kërkesa është shqyrtuar tashmë.");}
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
