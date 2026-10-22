import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {hashPassword} from "../src/server/security.mjs";
import {createPilotServer} from "../src/server/app.mjs";
test("citizen response remains private until independent reviewed public copy",{skip:!process.env.DATABASE_URL},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:4});
 const origin="http://127.0.0.1:4197",server=createPilotServer(pool,{origin,rateLimitSecret:"synthetic-response-quota-secret-longer-than-32",dialogueSecret:"synthetic-response-dialogue-secret-long-32"});
 const citizen={id:randomUUID(),email:"response-"+randomUUID().slice(0,8)+"@example.org",pass:"ResponsePassword!123"};
 const reviewer={id:randomUUID(),email:"response-reviewer-"+randomUUID().slice(0,8)+"@example.org",pass:"ResponseReviewPassword!123"};
 const author={id:randomUUID(),email:"response-author-"+randomUUID().slice(0,8)+"@example.org",pass:"ResponseAuthorPassword!123"};
 const dossier=randomUUID();
 const request=async(p,{method="GET",cookie,body}={})=>{
  const headers={};if(cookie)headers.Cookie=cookie;
  if(method==="POST")Object.assign(headers,{"Content-Type":"application/json","X-Protesto-Request":"1",Origin:origin});
  const r=await fetch(origin+p,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,data:await r.json(),cookie:r.headers.get("set-cookie")};
 };
 try{
  for(const u of [citizen,reviewer,author])await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",
   [u.id,u.email,hashPassword(u.pass),u===reviewer?"reviewer":"reporter"]);
  await pool.query("INSERT INTO civic_cases(id,author_id,title,description,area,category,state,public_title,public_description,public_source_url,public_area) VALUES($1,$2,$3,$4,$5,$6,'published',$7,$8,$9,$10)",
   [dossier,author.id,"Dosje prove për përgjigje","Raportim sintetik për procesin e kundërpërgjigjes.","Zona e testit","Tjetër","Dosje prove për përgjigje","Përmbajtje publike sintetike për testim të kundërpërgjigjeve.","https://example.org/reply","Zona publike e përgjigjeve"]);
  await new Promise(resolve=>server.listen(4197,"127.0.0.1",resolve));
  const tokens=[];
  for(const u of [citizen,reviewer,author]){
   let r=await request("/api/auth/login",{method:"POST",body:{email:u.email,password:u.pass}});
   assert.equal(r.status,200);tokens.push(r.cookie.split(";")[0]);
  }
  const path="/api/dossiers/"+dossier+"/responses",textBody="Kjo përgjigje sintetike kërkon një kontroll të pavarur dhe publikim të kontrolluar.";
  let r=await request(path,{method:"POST",cookie:tokens[0],body:{body:textBody}});assert.equal(r.status,201);
  const id=r.data.item.id;
  r=await request(path);assert.deepEqual(r.data.items,[]);
  r=await request(path,{method:"POST",cookie:tokens[0],body:{body:textBody}});assert.equal(r.status,409);
  r=await request("/api/editorial/responses/queue",{cookie:tokens[0]});assert.equal(r.status,403);
  r=await request("/api/editorial/responses/"+id+"/review",{method:"POST",cookie:tokens[2],body:{decision:"accepted",note:"Kontroll sintetik i të dhënave.",publicBody:textBody,privacyReviewed:true}});assert.equal(r.status,403);
  r=await request("/api/editorial/responses/"+id+"/review",{method:"POST",cookie:tokens[1],body:{decision:"accepted",note:"Kontroll sintetik i të dhënave.",publicBody:textBody}});assert.equal(r.status,422);
  r=await request("/api/editorial/responses/"+id+"/review",{method:"POST",cookie:tokens[1],body:{decision:"accepted",note:"Përgjigjja u kontrollua për privatësi nga verifikuesi.",publicBody:"Versioni publik sintetik i përgjigjes, i redaktuar për testim.",privacyReviewed:true}});assert.equal(r.status,200);
  r=await request(path);assert.equal(r.status,200);assert.equal(r.data.items.length,1);
  assert.deepEqual(Object.keys(r.data.items[0]),["id","body","reviewed_at"]);
  assert.ok(!JSON.stringify(r.data).includes(citizen.id));
  assert.ok(!JSON.stringify(r.data).includes(textBody));
  r=await request("/api/editorial/responses/"+id+"/review",{method:"POST",cookie:tokens[1],body:{decision:"rejected",note:"Vendim tjetër nuk lejohet."}});assert.equal(r.status,409);
 }finally{await new Promise(resolve=>server.close(resolve));await pool.end();}
});
