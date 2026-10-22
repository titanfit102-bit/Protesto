import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {hashPassword} from "../src/server/security.mjs";
import {createPilotServer} from "../src/server/app.mjs";
test("all sessions are revoked together and request requires origin + auth",{skip:!process.env.DATABASE_URL},async()=>{
 const {default:pg}=await import("pg");
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:4});
 const port=4196,origin="http://127.0.0.1:"+port;
 const server=createPilotServer(pool,{origin,rateLimitSecret:"synthetic-session-revoke-test-secret-min-32",dialogueSecret:"synthetic-dialogue-test-secret-longer-than-32"});
 const user={id:randomUUID(),email:"revoke-"+randomUUID().slice(0,7)+"@example.org",password:"SessionRevokePassword!123"};
 const send=async(path,{cookie,method="GET",body,originHeader=true}={})=>{
  const headers={};if(cookie)headers.Cookie=cookie;
  if(method==="POST"){headers["Content-Type"]="application/json";headers["X-Protesto-Request"]="1";if(originHeader)headers.Origin=origin;}
  const r=await fetch(origin+path,{method,headers,body:body?JSON.stringify(body):undefined});
  return {status:r.status,data:await r.json(),cookie:r.headers.get("set-cookie")};
 };
 try{
  await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,'reporter')",[user.id,user.email,hashPassword(user.password)]);
  await new Promise(resolve=>server.listen(port,"127.0.0.1",resolve));
  const cookies=[];
  for(let i=0;i<2;i++){
   const r=await send("/api/auth/login",{method:"POST",body:{email:user.email,password:user.password}});
   assert.equal(r.status,200);cookies.push(r.cookie.split(";")[0]);
  }
  assert.notEqual(cookies[0],cookies[1]);
  let r=await send("/api/me/sessions/revoke-all",{method:"POST",cookie:cookies[0],originHeader:false});
  assert.equal(r.status,403);
  r=await send("/api/me/sessions/revoke-all",{method:"POST"});
  assert.equal(r.status,401);
  r=await send("/api/me/sessions/revoke-all",{method:"POST",cookie:cookies[0]});
  assert.equal(r.status,200);assert.equal(r.data.revoked,2);assert.match(r.cookie,/Max-Age=0/);
  for(const cookie of cookies){r=await send("/api/me",{cookie});assert.equal(r.status,401);}
 }finally{await new Promise(resolve=>server.close(resolve));await pool.end();}
});
