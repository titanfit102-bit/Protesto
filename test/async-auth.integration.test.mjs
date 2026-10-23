import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {once} from "node:events";
import {createPilotServer} from "../src/server/app.mjs";
import {hashPassword} from "../src/server/security.mjs";
import {encryptTotpSecret,totpCodeAt} from "../src/server/totp.mjs";

test("F05: async auth rejects stale accounts and serializes parallel TOTP consumption",
 {skip:!process.env.DATABASE_URL},async()=>{
  const {default:pg}=await import("pg");
  const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:6});
  const port=4236,origin="http://127.0.0.1:"+port;
  const mfaKey=Buffer.alloc(32,57).toString("base64url");
  const users={
   known:{id:randomUUID(),email:"async-known-"+randomUUID()+"@example.org",password:"KnownSecretPassword!2026"},
   inactive:{id:randomUUID(),email:"async-inactive-"+randomUUID()+"@example.org",password:"InactiveSecretPassword!2026"},
   change:{id:randomUUID(),email:"async-change-"+randomUUID()+"@example.org",password:"ChangeSecretPassword!2026"},
   disable:{id:randomUUID(),email:"async-disable-"+randomUUID()+"@example.org",password:"DisableSecretPassword!2026"},
   mfa:{id:randomUUID(),email:"async-mfa-"+randomUUID()+"@example.org",password:"ReviewerSecretPassword!2026"}
  };
  const secret=Buffer.alloc(20,49);
  // Synchronize mutation with the first password snapshot itself. The login
  // receives the OLD snapshot after this hook has changed actual DB state.
  // A correct implementation must re-check it after the asynchronous scrypt.
  let mutation=null;
  const wrapped={
   query:async(sql,params)=>{
    const result=await pool.query(sql,params);
    if(typeof sql==="string"&&sql.startsWith("SELECT id,password_hash FROM civic_users")&&
      mutation&&params?.[0]===mutation.email){
     const job=mutation;mutation=null;
     if(job.kind==="rotate")
      await pool.query("UPDATE civic_users SET password_hash=$1 WHERE id=$2",
       [hashPassword("RotatedSecretPassword!2026"),job.id]);
     else
      await pool.query("UPDATE civic_users SET active=false WHERE id=$1",[job.id]);
    }
    return result;
   },
   connect:()=>pool.connect()
  };
  const server=createPilotServer(wrapped,{
   origin,mfaKey,
   rateLimitSecret:"synthetic-async-auth-rate-limit-key-2026",
   dialogueSecret:"synthetic-async-auth-dialogue-key-2026"
  });
  let started=false;
  const send=async(email,password,totpCode)=>{
   const res=await fetch(origin+"/api/auth/login",{
    method:"POST",
    headers:{"Content-Type":"application/json","X-Protesto-Request":"1",Origin:origin},
    body:JSON.stringify({email,password,...(totpCode?{totpCode}:{})})
   });
   return {status:res.status,json:await res.json(),cookie:res.headers.get("set-cookie")};
  };
  try{
   for(const [kind,u] of Object.entries(users)){
    const withMfa=kind==="mfa";
    await pool.query(
     "INSERT INTO civic_users(id,email,password_hash,role,active,totp_secret_encrypted) VALUES($1,$2,$3,$4,$5,$6)",
     [u.id,u.email,hashPassword(u.password),withMfa?"reviewer":"reporter",
      kind!=="inactive",withMfa?encryptTotpSecret(secret,mfaKey):null]
    );
   }
   server.listen(port,"127.0.0.1");await once(server,"listening");started=true;
   const valid=await send(users.known.email,users.known.password);
   assert.equal(valid.status,200,"existing hash remains compatible with async KDF");
   assert.match(valid.cookie,/HttpOnly/);
   assert.match(valid.cookie,/SameSite=Strict/);
   const wrong=await send(users.known.email,"IncorrectPassword2026!");
   const unknown=await send("does-not-exist-"+randomUUID()+"@example.org","IncorrectPassword2026!");
   const inactive=await send(users.inactive.email,users.inactive.password);
   for(const response of [wrong,unknown,inactive]){
    assert.equal(response.status,401,"invalid, unknown and inactive users get generic 401");
    assert.equal(response.json.error,"Kredenciale të pavlefshme.");
    assert.equal(response.cookie,null,"failure must not create session cookie");
   }
   mutation={kind:"rotate",email:users.change.email,id:users.change.id};
   const rotated=await send(users.change.email,users.change.password);
   assert.equal(rotated.status,401,"password rotation after snapshot prevents stale login");
   assert.equal(mutation,null,"rotation injection exercised");
   const rotatedSessions=await pool.query("SELECT count(*)::integer n FROM sessions WHERE user_id=$1",[users.change.id]);
   assert.equal(rotatedSessions.rows[0].n,0,"rotated account never gets session");
   mutation={kind:"disable",email:users.disable.email,id:users.disable.id};
   const disabled=await send(users.disable.email,users.disable.password);
   assert.equal(disabled.status,401,"account disabled after snapshot prevents stale login");
   assert.equal(mutation,null,"disable injection exercised");
   const disabledSessions=await pool.query("SELECT count(*)::integer n FROM sessions WHERE user_id=$1",[users.disable.id]);
   assert.equal(disabledSessions.rows[0].n,0);
   const code=totpCodeAt(secret,Math.floor(Date.now()/30000));
   const two=await Promise.all([
    send(users.mfa.email,users.mfa.password,code),
    send(users.mfa.email,users.mfa.password,code)
   ]);
   assert.deepEqual(two.map(x=>x.status).sort((a,b)=>a-b),[200,401],
    "simultaneous attempts with one TOTP code must yield exactly one session");
   const mfaSessions=await pool.query("SELECT count(*)::integer n FROM sessions WHERE user_id=$1",[users.mfa.id]);
   assert.equal(mfaSessions.rows[0].n,1);
   const codeReplay=await send(users.mfa.email,users.mfa.password,code);
   assert.equal(codeReplay.status,401,"MFA counter must reject replay after commit");
   const health=await fetch(origin+"/api/health");
   assert.equal(health.status,200);
  }finally{
   if(started)await new Promise(resolve=>server.close(resolve));
   try{
    const ids=Object.values(users).map(x=>x.id);
    await pool.query("DELETE FROM sessions WHERE user_id=ANY($1::uuid[])",[ids]);
    await pool.query("DELETE FROM civic_users WHERE id=ANY($1::uuid[])",[ids]);
   }finally{await pool.end();}
  }
 });
