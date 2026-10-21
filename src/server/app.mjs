import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {randomUUID} from "node:crypto";
import {validateCase,cleanText} from "../domain.mjs";
import {actionRoute,actionGetRoutes,actionPostRoute} from "./actions.mjs";
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
 ["/src/pilot.mjs",["../pilot.mjs","text/javascript; charset=utf-8"]]
]);
const idFormat=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json=(res,status,data,headers={})=>{
 res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...headers});
 res.end(JSON.stringify(data));
};
const fail=(res,status,message)=>json(res,status,{error:message});
async function readJSON(req){
 if(!(req.headers["content-type"]||"").toLowerCase().startsWith("application/json"))throw {status:415,message:"Kërkohet Content-Type: application/json."};
 let result="";let size=0;
 for await(const part of req){
  size+=part.length;
  if(size>16384)throw {status:413,message:"Kërkesa është shumë e madhe."};
  result+=part.toString("utf8");
 }
 try{
  const parsed=JSON.parse(result);
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error();
  return parsed;
 }catch{throw {status:400,message:"JSON i pavlefshëm."};}
}
export function createPilotServer(pool,{origin,production=false}={}){
 if(typeof pool?.query!=="function"||typeof pool?.connect!=="function")throw Error("PostgreSQL pool missing.");
 if(typeof origin!=="string"||!/https?:\/\/[^/]+$/.test(origin))throw Error("APP_ORIGIN missing or invalid.");
 if(production&&!origin.startsWith("https://"))throw Error("HTTPS required in production.");
 const attempts=new Map();
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
  res.setHeader("Permissions-Policy","geolocation=(),camera=(),microphone=()");
  res.setHeader("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
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
  if(pathname==="/api/health"&&req.method==="GET")return json(res,200,{status:"ok",mode:"private-pilot"});
  if(!pathname.startsWith("/api/"))return fail(res,404,"Nuk u gjet.");
  const isReview=/^\/api\/review\/[^/]+$/.test(pathname);
  const isArchive=/^\/api\/archive\/[^/]+$/.test(pathname);
  const getRoutes=["/api/public/cases","/api/me","/api/cases/mine","/api/review/queue"];
  const postRoutes=["/api/auth/login","/api/auth/logout","/api/cases"];
  if(!(req.method==="GET"&&(getRoutes.includes(pathname)||actionGetRoutes.includes(pathname)))&&!(req.method==="POST"&&(postRoutes.includes(pathname)||isReview||isArchive||actionPostRoute(pathname)))){
   return fail(res,404,"API endpoint nuk ekziston.");
  }
  if(req.method==="POST"&&!secureWrite(req,origin))return fail(res,403,"Kërkesë e bllokuar nga mbrojtja CSRF.");
  try{
   if(pathname==="/api/actions"||pathname.startsWith("/api/actions/")){
    const current=pathname==="/api/actions/public"?null:await auth(req);
    return await actionRoute({pathname,req,res,pool,user:current,json,fail,readJSON});
   }
   if(pathname==="/api/public/cases"&&req.method==="GET"){
    const result=await pool.query("SELECT id,title,description,area,category,source_url,created_at FROM civic_cases WHERE state='published' ORDER BY created_at DESC LIMIT 100");
    return json(res,200,{items:result.rows});
   }
   if(pathname==="/api/auth/login"&&req.method==="POST"){
    const ip=String(req.socket.remoteAddress||"unknown").slice(0,80),now=Date.now();
    let count=attempts.get(ip)||{n:0,until:now+15*60*1000};
    if(count.until<now)count={n:0,until:now+15*60*1000};
    if(attempts.size>5000)attempts.clear();
    if(count.n>=5)return fail(res,429,"Shumë tentativa. Provo më vonë.");
    count.n++;attempts.set(ip,count);
    const body=await readJSON(req);
    let email;try{email=normalizeEmail(body.email);}catch{return fail(res,401,"Kredenciale të pavlefshme.");}
    const password=typeof body.password==="string"?body.password:"";
    const found=await pool.query("SELECT id,email,role,password_hash FROM civic_users WHERE email=$1 AND active=true LIMIT 1",[email]);
    const user=found.rows[0];
    if(!user||!verifyPassword(password,user.password_hash))return fail(res,401,"Kredenciale të pavlefshme.");
    const token=newSessionToken();
    await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+($3::integer * interval '1 second'))",[tokenHash(token),user.id,SESSION_AGE_SECONDS]);
    return json(res,200,{user:{id:user.id,email:user.email,role:user.role}},{"Set-Cookie":sessionCookie(token,production)});
   }
   const user=await auth(req);
   if(pathname==="/api/me"&&req.method==="GET")return user?json(res,200,{user}):fail(res,401,"Kërkohet identifikim.");
   if(!user)return fail(res,401,"Kërkohet identifikim.");
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
    const number=await pool.query("SELECT count(*)::integer AS n FROM civic_cases WHERE author_id=$1 AND created_at>now()-interval '1 hour'",[user.id]);
    if(number.rows[0].n>=10)return fail(res,429,"Lejohen deri në 10 raportime në orë.");
    const result=await pool.query("INSERT INTO civic_cases(id,author_id,title,description,area,category,source_url,state) VALUES($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING id,state,created_at",[item.id,user.id,item.title,item.description,item.area,item.category,item.source]);
    return json(res,201,{item:result.rows[0],message:"Dosja u regjistrua për verifikim. Nuk është publikuar."});
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
    const client=await pool.connect();
    try{
     await client.query("BEGIN");
     const updated=await client.query("UPDATE civic_cases SET state=$1,reviewed_at=now(),reviewed_by=$2 WHERE id=$3 AND state='pending' AND author_id<>$2 RETURNING id,state",[decision,user.id,caseId]);
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
