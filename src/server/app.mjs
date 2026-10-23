import {cancelOpenDialogueTopics} from "./dialogue-cancellation.mjs";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {randomUUID} from "node:crypto";
import {validateCase,cleanText} from "../domain.mjs";
import {actionRoute,actionGetRoutes,actionPostRoute} from "./actions.mjs";
import {dossierRoute,dossierGetRoute,dossierPostRoute} from "./dossiers.mjs";
import {appealRoute,appealGetRoute,appealPostRoute} from "./appeals.mjs";
import {dialogueRoute,dialogueGetRoute,dialoguePostRoute} from "./dialogue.mjs";
import {publicLedgerEvents} from "./public-ledger.mjs";
import {responseRoute,responseGetRoute,responsePostRoute} from "./responses.mjs";
import {publicCopyDecision} from "./publication-privacy.mjs";
import {rateKey,consumeRateLimit} from "./rate-limits.mjs";
import {decryptTotpSecret,verifyTotpCode} from "./totp.mjs";
import {normalizeEmail,verifyPassword,newSessionToken,tokenHash,parseSessionCookie,sessionCookie,clearSessionCookie,secureWrite,canReview,SESSION_AGE_SECONDS} from "./security.mjs";

const publicAssets=new Map([
 ["/",["../../index.html","text/html; charset=utf-8"]],
 ["/index.html",["../../index.html","text/html; charset=utf-8"]],
 ["/pilot.html",["../../pilot.html","text/html; charset=utf-8"]],
 ["/styles.css",["../../styles.css","text/css; charset=utf-8"]],
 ["/pilot.css",["../../pilot.css","text/css; charset=utf-8"]],
 ["/src/app.mjs",["../app.mjs","text/javascript; charset=utf-8"]],
 ["/src/domain.mjs",["../domain.mjs","text/javascript; charset=utf-8"]],
 ["/src/seed.mjs",["../seed.mjs","text/javascript; charset=utf-8"]],
 ["/src/pilot.mjs",["../pilot.mjs","text/javascript; charset=utf-8"]],
 ["/src/pilot-evidence.mjs",["../pilot-evidence.mjs","text/javascript; charset=utf-8"]],
 ["/src/pilot-right-reply.mjs",["../pilot-right-reply.mjs","text/javascript; charset=utf-8"]],
 ["/src/source-integrity.mjs",["../source-integrity.mjs","text/javascript; charset=utf-8"]],
 ["/src/pilot-dialogue.mjs",["../pilot-dialogue.mjs","text/javascript; charset=utf-8"]]
]);
const idFormat=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json=(res,status,data,headers={})=>{
 res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...headers});
 res.end(JSON.stringify(data));
};
const fail=(res,status,message)=>json(res,status,{error:message});
export async function readJSON(req){
 if(!(req.headers["content-type"]||"").toLowerCase().startsWith("application/json"))throw {status:415,message:"Kërkohet Content-Type: application/json."};
 const chunks=[];let size=0;
 for await(const part of req){
  size+=part.length;
  if(size>16384)throw {status:413,message:"Kërkesa është shumë e madhe."};
  chunks.push(part);
 }
 try{
  // Decode once: UTF-8 code points may cross HTTP stream chunk boundaries.
  const result=new TextDecoder("utf-8",{fatal:true}).decode(Buffer.concat(chunks,size));
  const parsed=JSON.parse(result);
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error();
  return parsed;
 }catch{throw {status:400,message:"JSON i pavlefshëm."};}
}
export function createPilotServer(pool,{origin,production=false,rateLimitSecret=process.env.PROTESTO_RATE_LIMIT_SECRET,dialogueSecret=process.env.PROTESTO_DIALOGUE_SECRET,mfaKey=process.env.PROTESTO_MFA_KEY}={}){
 if(typeof pool?.query!=="function"||typeof pool?.connect!=="function")throw Error("PostgreSQL pool missing.");
 if(typeof origin!=="string"||!/https?:\/\/[^/]+$/.test(origin))throw Error("APP_ORIGIN missing or invalid.");
 if(production&&!origin.startsWith("https://"))throw Error("HTTPS required in production.");
 // Reject missing or unstable cross-instance rate-limit secret at startup.
 rateKey(rateLimitSecret,"startup","check");
 rateKey(dialogueSecret,"dialogue-startup","check");
 const auth=async(req)=>{
  const token=parseSessionCookie(req.headers.cookie);
  if(!token)return null;
  const row=await pool.query("SELECT u.id,u.email,u.role FROM sessions s JOIN civic_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true",[tokenHash(token)]);
  return row.rows[0]||null;
 };
 const server=createServer(async(req,res)=>{
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("X-Frame-Options","DENY");
  res.setHeader("Referrer-Policy","no-referrer");
  res.setHeader("Cross-Origin-Opener-Policy","same-origin");
  res.setHeader("Cross-Origin-Resource-Policy","same-origin");
  res.setHeader("X-Permitted-Cross-Domain-Policies","none");
  res.setHeader("Permissions-Policy","geolocation=(),camera=(),microphone=()");
  res.setHeader("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  if(production)res.setHeader("Strict-Transport-Security","max-age=31536000; includeSubDomains");
  let pathname;
  try{pathname=new URL(req.url,origin).pathname;}
  catch{return fail(res,400,"URL e pavlefshme.");}
  if(req.method==="GET"&&publicAssets.has(pathname)){
   try{
    const [path,mime]=publicAssets.get(pathname);
    const file=await readFile(fileURLToPath(new URL(path,import.meta.url)));
    res.writeHead(200,{"Content-Type":mime,"Cache-Control":"no-store"});
    return res.end(file);
   }catch{return fail(res,500,"Skedari nuk u lexua.");}
  }
  if(pathname==="/api/health"&&req.method==="GET")return json(res,200,{status:"ok",check:"liveness"});
  if(pathname==="/api/ready"&&req.method==="GET"){
   try{await pool.query("SELECT 1");return json(res,200,{status:"ok",check:"readiness"});}
   catch{return fail(res,503,"Database unavailable.");}
  }
  if(!pathname.startsWith("/api/"))return fail(res,404,"Nuk u gjet.");
  const isReview=/^\/api\/review\/[^/]+$/.test(pathname);
  const isArchive=/^\/api\/archive\/[^/]+$/.test(pathname);
  const getRoutes=["/api/public/cases","/api/public/ledger","/api/me","/api/me/export","/api/ops/status","/api/cases/mine","/api/review/queue"];
  const postRoutes=["/api/auth/login","/api/auth/logout","/api/me/sessions/revoke-all","/api/cases"];
  if(!(req.method==="GET"&&(getRoutes.includes(pathname)||actionGetRoutes.includes(pathname)||dossierGetRoute(pathname)||responseGetRoute(pathname)||appealGetRoute(pathname)||dialogueGetRoute(pathname)))&&!(req.method==="POST"&&(postRoutes.includes(pathname)||isReview||isArchive||actionPostRoute(pathname)||dossierPostRoute(pathname)||responsePostRoute(pathname)||appealPostRoute(pathname)||dialoguePostRoute(pathname)))){
   return fail(res,404,"API endpoint nuk ekziston.");
  }
  if(req.method==="POST"&&!secureWrite(req,origin))return fail(res,403,"Kërkesë e bllokuar nga mbrojtja CSRF.");
  try{
   if(pathname.startsWith("/api/dialogue/")){
    const current=await auth(req);
    // Existing global write quota remains in force for every dialogue mutation.
    if(req.method==="POST"&&current){
     const q=await consumeRateLimit(pool,rateKey(rateLimitSecret,"write-user",current.id),{limit:120,windowSeconds:3600});
     if(!q.allowed)return json(res,429,{error:"Shumë kërkesa. Provo më vonë."},{"Retry-After":String(q.retrySeconds)});
    }
    return await dialogueRoute({pathname,req,res,pool,user:current,json,fail,readJSON,dialogueSecret});
   }
   if(req.method==="POST"&&pathname!=="/api/auth/login"&&pathname!=="/api/auth/logout"){
    const currentUser=await auth(req);
    if(currentUser){
     const quota=await consumeRateLimit(pool,rateKey(rateLimitSecret,"write-user",currentUser.id),{limit:120,windowSeconds:3600});
     if(!quota.allowed)return json(res,429,{error:"Shumë kërkesa. Provo më vonë."},{"Retry-After":String(quota.retrySeconds)});
    }
   }
   if(responseGetRoute(pathname)||responsePostRoute(pathname)){
    const current=await auth(req);
    return await responseRoute({pathname,req,res,pool,user:current,readJSON,json,fail});
   }
   if(pathname==="/api/appeals"||pathname.startsWith("/api/appeals/")){
    const current=await auth(req);
    return await appealRoute({pathname,req,res,pool,user:current,json,fail,readJSON});
   }
   if(pathname==="/api/corrections"||pathname.startsWith("/api/corrections/")||pathname.startsWith("/api/dossiers/")){
    const current=await auth(req);
    return await dossierRoute({pathname,req,res,pool,user:current,json,fail,readJSON});
   }
   if(pathname==="/api/actions"||pathname.startsWith("/api/actions/")){
    const current=pathname==="/api/actions/public"?null:await auth(req);
    return await actionRoute({pathname,req,res,pool,user:current,json,fail,readJSON});
   }
   if(pathname==="/api/public/ledger"&&req.method==="GET"){
    // Public transparency uses only previously published items.
    // Never expose reporter identities, private notes or unreviewed content.
    const result=await pool.query(`SELECT case_id,event_type,created_at FROM (
      SELECT r.case_id AS case_id,'published'::text AS event_type,r.created_at AS created_at
      FROM review_history r JOIN civic_cases c ON c.id=r.case_id
      WHERE r.decision='published' AND c.state IN ('published','archived')
      UNION ALL
      SELECT r.case_id AS case_id,'archived'::text AS event_type,r.created_at AS created_at
      FROM retraction_history r JOIN civic_cases c ON c.id=r.case_id
      WHERE c.state='archived'
    ) events ORDER BY created_at DESC,case_id DESC LIMIT 100`);
    return json(res,200,{events:publicLedgerEvents(result.rows),disclaimer:"Kjo listë regjistron ndryshimet e statusit; nuk provon vërtetësinë e pretendimeve."});
   }
   if(pathname==="/api/public/cases"&&req.method==="GET"){
    const result=await pool.query("SELECT c.id,c.public_title AS title,c.public_description AS description,c.public_area AS area,c.category,c.created_at,c.public_source_url AS source_url FROM civic_cases c WHERE c.state='published' AND c.public_title IS NOT NULL AND c.public_description IS NOT NULL AND c.public_area IS NOT NULL ORDER BY c.created_at DESC LIMIT 100");
    return json(res,200,{items:result.rows});
   }
   if(pathname==="/api/auth/login"&&req.method==="POST"){
    const ip=String(req.socket.remoteAddress||"unknown");
    const ipLimit=await consumeRateLimit(pool,rateKey(rateLimitSecret,"login-ip",ip),{limit:12,windowSeconds:900});
    if(!ipLimit.allowed)return json(res,429,{error:"Shumë tentativa. Provo më vonë."},{"Retry-After":String(ipLimit.retrySeconds)});
    const body=await readJSON(req);
    let email;try{email=normalizeEmail(body.email);}catch{return fail(res,401,"Kredenciale të pavlefshme.");}
    const accountLimit=await consumeRateLimit(pool,rateKey(rateLimitSecret,"login-email",email),{limit:15,windowSeconds:900});
    if(!accountLimit.allowed)return json(res,429,{error:"Shumë tentativa për këtë llogari."},{"Retry-After":String(accountLimit.retrySeconds)});
    const password=typeof body.password==="string"?body.password:"";
    // Serializes one-time TOTP consumption with session creation.
    const client=await pool.connect();
    try{
     await client.query("BEGIN");
     const found=await client.query("SELECT id,email,role,password_hash,totp_secret_encrypted,totp_last_counter FROM civic_users WHERE email=$1 AND active=true FOR UPDATE",[email]);
     const account=found.rows[0];
     if(!account||!verifyPassword(password,account.password_hash)){
      await client.query("ROLLBACK");return fail(res,401,"Kredenciale të pavlefshme.");
     }
     if(account.totp_secret_encrypted){
      if(!mfaKey){await client.query("ROLLBACK");return fail(res,503,"MFA është e pakonfiguruar në server.");}
      const secret=decryptTotpSecret(account.totp_secret_encrypted,mfaKey);
      const counter=verifyTotpCode(secret,body.totpCode,account.totp_last_counter);
      secret.fill(0);
      if(counter===null){await client.query("ROLLBACK");return fail(res,401,"Kredenciale të pavlefshme.");}
      await client.query("UPDATE civic_users SET totp_last_counter=$1 WHERE id=$2",[counter,account.id]);
     }
     const token=newSessionToken();
     await client.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+($3::integer * interval '1 second'))",[tokenHash(token),account.id,SESSION_AGE_SECONDS]);
     await client.query("COMMIT");
     return json(res,200,{user:{id:account.id,email:account.email,role:account.role}},{"Set-Cookie":sessionCookie(token,production)});
    }catch(error){try{await client.query("ROLLBACK");}catch{}throw error;}
    finally{client.release();}
   }
   const user=await auth(req);
   if(pathname==="/api/me"&&req.method==="GET")return user?json(res,200,{user}):fail(res,401,"Kërkohet identifikim.");
   if(!user)return fail(res,401,"Kërkohet identifikim.");
   if(pathname==="/api/me/sessions/revoke-all"&&req.method==="POST"){
    // Explicit self-service invalidation: current and other sessions are
    // deleted in one statement. Requires an authenticated cookie and CSRF.
    const result=await pool.query("DELETE FROM sessions WHERE user_id=$1",[user.id]);
    return json(res,200,{revoked:result.rowCount,message:"Të gjitha sesionet u çaktivizuan."},
      {"Set-Cookie":clearSessionCookie(production)});
   }
   if(pathname==="/api/ops/status"&&req.method==="GET"){
    if(user.role!=="admin")return fail(res,403,"Kërkohet administrues.");
    const q=await pool.query(`SELECT
      (SELECT count(*)::integer FROM civic_cases WHERE state='pending') AS cases_pending,
      (SELECT count(*)::integer FROM case_corrections WHERE state='pending') AS corrections_pending,
      (SELECT count(*)::integer FROM correction_appeals WHERE state='pending') AS appeals_pending,
      (SELECT count(*)::integer FROM case_responses WHERE state='pending') AS responses_pending,
      (SELECT count(*)::integer FROM sessions WHERE expires_at>now()) AS active_sessions,
      (SELECT count(*)::integer FROM schema_migrations) AS migration_count`);
    const x=q.rows[0];
    return json(res,200,{status:"admin-only-aggregates",counts:{
      casesPending:x.cases_pending,correctionsPending:x.corrections_pending,
      appealsPending:x.appeals_pending,responsesPending:x.responses_pending,
      activeSessions:x.active_sessions,migrations:x.migration_count
    },disclaimer:"Pa identitete; kjo nuk është monitorim i vazhdueshëm."});
   }
   if(pathname==="/api/me/export"&&req.method==="GET"){
    // All categories are scoped to the authenticated author. A response can
    // never silently claim to be a complete export past the 1000-row cap.
    // Pseudonymous dialogue_votes cannot be safely linked back to a user here.
    const exportSql={
     cases:"SELECT id,title,description,area,category,source_url,state,public_title,public_description,public_area,public_source_url,created_at FROM civic_cases WHERE author_id=$1 ORDER BY created_at DESC,id DESC LIMIT 1001",
     actions:"SELECT id,kind,subtype,title,description,area,event_date,state,public_title,public_description,public_area,created_at FROM civic_actions WHERE author_id=$1 ORDER BY created_at DESC,id DESC LIMIT 1001",
     corrections:"SELECT id,case_id,reason,counter_source_url,state,created_at,reviewed_at FROM case_corrections WHERE author_id=$1 ORDER BY created_at DESC,id DESC LIMIT 1001",
     sources:"SELECT id,case_id,title,url,context,state,public_title,public_url,created_at FROM case_sources WHERE submitted_by=$1 ORDER BY created_at DESC,id DESC LIMIT 1001",
     appeals:"SELECT id,correction_id,reason,state,created_at,reviewed_at FROM correction_appeals WHERE author_id=$1 ORDER BY created_at DESC,id DESC LIMIT 1001",
     responses:"SELECT id,case_id,body,source_url,state,public_body,created_at,reviewed_at FROM case_responses WHERE author_id=$1 ORDER BY created_at DESC,id DESC LIMIT 1001",
     dialogue_topics:"SELECT id,case_id,title,description,public_title,public_description,state,review_state,created_at,reviewed_at FROM dialogue_topics WHERE created_by=$1 ORDER BY created_at DESC,id DESC LIMIT 1001",
     dialogue_statements:"SELECT id,topic_id,body,public_body,state,created_at,reviewed_at FROM dialogue_statements WHERE author_id=$1 ORDER BY created_at DESC,id DESC LIMIT 1001"
    };
    const categories=Object.keys(exportSql);
    const results=await Promise.all(categories.map(k=>pool.query(exportSql[k],[user.id])));
    const records={},truncated=[];
    for(let i=0;i<categories.length;i++){
     const rows=results[i].rows;
     records[categories[i]]=rows.slice(0,1000);
     if(rows.length>1000)truncated.push(categories[i]);
    }
    return json(res,200,{
     exported_at:new Date().toISOString(),user,records,
     export_status:{per_category_limit:1000,truncated_categories:truncated,
      complete:false,notice:"Eksport pilot i kufizuar: nuk përfshin votat pseudonime, historikun e plotë të moderimit apo çdo kategori ligjore të të dhënave personale. Kategoritë mbi kufirin 1000 janë të shkurtuara."}
    });
   }
   if(pathname==="/api/auth/logout"&&req.method==="POST"){
    const token=parseSessionCookie(req.headers.cookie);
    if(token)await pool.query("DELETE FROM sessions WHERE token_hash=$1",[tokenHash(token)]);
    return json(res,200,{ok:true},{"Set-Cookie":clearSessionCookie(production)});
   }
   if(pathname==="/api/cases/mine"&&req.method==="GET"){
    const result=await pool.query("SELECT id,title,description,area,category,source_url,state,created_at FROM civic_cases WHERE author_id=$1 ORDER BY created_at DESC LIMIT 100",[user.id]);
    return json(res,200,{items:result.rows});
   }
   if(pathname==="/api/cases"&&req.method==="POST"){
    const body=await readJSON(req);
    let item;try{item=validateCase(body,new Date(),randomUUID);}catch(e){return fail(res,422,e.message);}
    // A shared, atomic quota prevents parallel submissions from racing past
    // the previous SELECT COUNT guard across independent application workers.
    const caseLimit=await consumeRateLimit(pool,rateKey(rateLimitSecret,"case-create-user",user.id),{limit:10,windowSeconds:3600});
    if(!caseLimit.allowed)return json(res,429,{error:"Lejohen deri në 10 raportime në orë."},{"Retry-After":String(caseLimit.retrySeconds)});
    const client=await pool.connect();
    try{
     await client.query("BEGIN");
     const result=await client.query("INSERT INTO civic_cases(id,author_id,title,description,area,category,source_url,state) VALUES($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING id,state,created_at",[item.id,user.id,item.title,item.description,item.area,item.category,item.source]);
     if(item.source) await client.query("INSERT INTO case_sources(id,case_id,submitted_by,title,url,context) VALUES($1,$2,$3,$4,$5,$6)",[randomUUID(),item.id,user.id,item.title,item.source,item.description.slice(0,700)]);
     await client.query("COMMIT");
     return json(res,201,{item:result.rows[0],message:"Dosja u regjistrua për verifikim. Nuk është publikuar."});
    }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
    finally{client.release();}
   }
   if(!canReview(user.role))return fail(res,403,"Kjo veprimtari kërkon rol verifikuesi.");
   if(pathname==="/api/review/queue"&&req.method==="GET"){
    const result=await pool.query("SELECT id,author_id,title,description,area,category,source_url,created_at FROM civic_cases WHERE state='pending' ORDER BY created_at ASC LIMIT 100");
    return json(res,200,{items:result.rows});
   }
   if(isReview&&req.method==="POST"){
    const caseId=pathname.split("/").at(-1);
    if(!idFormat.test(caseId))return fail(res,400,"Identifikues i pavlefshëm.");
    const body=await readJSON(req),decision=body.decision,note=cleanText(body.note,1001);
    if(!["published","rejected"].includes(decision)||note.length<15||note.length>1000)return fail(res,422,"Vendimi dhe arsyetimi 15–1000 karaktere janë të detyrueshëm.");
    if(decision==="published" && !(body.checks?.sourceReviewed===true && body.checks?.privacyReviewed===true && body.checks?.replyConsidered===true))return fail(res,422,"Konfirmo kontrollin e burimit, privatësisë dhe të drejtën e përgjigjes.");
    const approved=decision==="published"?publicCopyDecision(body):null;
    if(decision==="published"&&!approved)return fail(res,422,"Kërkohet një kopje publike e rishikuar dhe URL pa parametra privatë.");
    const client=await pool.connect();
    try{
     await client.query("BEGIN");
     // Lock before evaluating accepted sources, so source decisions cannot
     // race the case's publication/rejection transition.
     const locked=await client.query(
      "SELECT id,state,author_id FROM civic_cases WHERE id=$1 FOR UPDATE",[caseId]
     );
     if(!locked.rowCount||locked.rows[0].state!=="pending"||locked.rows[0].author_id===user.id){
      await client.query("ROLLBACK");return fail(res,409,"Dosja nuk është në pritje ose është e jotja.");
     }
     if(decision==="published"){
      const accepted=await client.query("SELECT 1 FROM case_sources WHERE case_id=$1 AND state='accepted' LIMIT 1",[caseId]);
      if(!accepted.rowCount){await client.query("ROLLBACK");return fail(res,422,"Të paktën një burim duhet verifikuar para publikimit.");}
      const selected=await client.query("SELECT 1 FROM case_sources WHERE case_id=$1 AND state='accepted' AND public_url=$2 AND public_title IS NOT NULL LIMIT 1",[caseId,approved.sourceUrl]);
      if(!selected.rowCount){await client.query("ROLLBACK");return fail(res,422,"URL publike duhet të jetë një burim i pranuar dhe pa parametra.");}
     }
     const updated=await client.query("UPDATE civic_cases SET state=$1,reviewed_at=now(),reviewed_by=$2,public_title=$4,public_description=$5,public_source_url=$6,public_area=$7 WHERE id=$3 AND state='pending' AND author_id<>$2 RETURNING id,state",
      [decision,user.id,caseId,approved?.title??null,approved?.description??null,approved?.sourceUrl??null,approved?.area??null]);
     if(!updated.rowCount){await client.query("ROLLBACK");return fail(res,409,"Dosja nuk është në pritje ose është e jotja.");}
     await client.query("INSERT INTO review_history(id,case_id,reviewer_id,decision,note) VALUES($1,$2,$3,$4,$5)",[randomUUID(),caseId,user.id,decision,note]);
     await client.query("INSERT INTO audit_entries(id,actor_id,action,object_type,object_id) VALUES($1,$2,$3,'case',$4)",[randomUUID(),user.id,"case.review."+decision,caseId]);
     await client.query("COMMIT");
     return json(res,200,{item:updated.rows[0]});
    }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
    finally{client.release();}
   }
   if(isArchive&&req.method==="POST"){
    const caseId=pathname.split("/").at(-1);
    if(!idFormat.test(caseId))return fail(res,400,"Identifikues i pavlefshëm.");
    const body=await readJSON(req);
    const note=cleanText(body.note,1001);
    if(note.length<20||note.length>1000)return fail(res,422,"Arsyetimi 20–1000 karaktere është i detyrueshëm.");
    const client=await pool.connect();
    try{
     await client.query("BEGIN");
     const updated=await client.query("UPDATE civic_cases SET state='archived',reviewed_at=now(),reviewed_by=$1 WHERE id=$2 AND state='published' AND author_id<>$1 RETURNING id,state",[user.id,caseId]);
     if(!updated.rowCount){await client.query("ROLLBACK");return fail(res,409,"Dosja nuk mund të tërhiqet ose të përket ty.");}
     await cancelOpenDialogueTopics(client,{caseId,actorId:user.id});
     await client.query("INSERT INTO retraction_history(id,case_id,reviewer_id,note) VALUES($1,$2,$3,$4)",[randomUUID(),caseId,user.id,note]);
     await client.query("INSERT INTO audit_entries(id,actor_id,action,object_type,object_id) VALUES($1,$2,'case.retracted','case',$3)",[randomUUID(),user.id,caseId]);
     await client.query("COMMIT");
     return json(res,200,{item:updated.rows[0],message:"Publikimi u tërhoq dhe u regjistrua në audit."});
    }catch(e){try{await client.query("ROLLBACK");}catch{}throw e;}
    finally{client.release();}
   }
   return fail(res,404,"API endpoint nuk ekziston.");
  }catch(e){
   if(e?.status)return fail(res,e.status,e.message);
   console.error("Pilot API failure",e?.code||"internal");
   return fail(res,500,"Gabim i brendshëm.");
  }
 });
 server.requestTimeout=15000;
 server.headersTimeout=10000;
 return server;
}
