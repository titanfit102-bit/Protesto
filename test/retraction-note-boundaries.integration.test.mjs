import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {once} from "node:events";
import {hashPassword} from "../src/server/security.mjs";
import {createPilotServer} from "../src/server/app.mjs";

test("PostgreSQL: full correction and appeal reasoning survives 1000-character boundaries",
 {skip:!process.env.DATABASE_URL},async()=>{
  const {default:pg}=await import("pg");
  const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:5});
  const origin="http://127.0.0.1:4174";
  const server=createPilotServer(pool,{
   origin,
   rateLimitSecret:"synthetic-retraction-rate-limit-secret-2026",
   dialogueSecret:"synthetic-retraction-dialogue-secret-2026"
  });
  const accounts=[
   {id:randomUUID(),email:"retraction-author-"+randomUUID()+"@example.org",role:"reporter"},
   {id:randomUUID(),email:"retraction-reviewer-"+randomUUID()+"@example.org",role:"reviewer"},
   {id:randomUUID(),email:"retraction-independent-"+randomUUID()+"@example.org",role:"reviewer"}
  ];
  const password="SyntheticPassphrase!2026";
  const cases=[],corrections=[],appeals=[];
  let listening=false;
  try{
   for(const u of accounts){
    await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",
     [u.id,u.email,hashPassword(password),u.role]);
   }
   server.listen(0,"127.0.0.1");
   await once(server,"listening");listening=true;
   const base="http://127.0.0.1:"+server.address().port;
   const send=async(path,body,cookie)=>{
    const headers={"Origin":origin,"X-Protesto-Request":"1","Content-Type":"application/json"};
    if(cookie)headers.Cookie=cookie;
    const response=await fetch(base+path,{method:"POST",headers,body:JSON.stringify(body)});
    return {status:response.status,data:await response.json(),cookie:response.headers.get("set-cookie")};
   };
   const reviewerCookies=[];
   for(const u of accounts.slice(1)){
    const login=await send("/api/auth/login",{email:u.email,password});
    assert.equal(login.status,200,"synthetic reviewer login");
    reviewerCookies.push(login.cookie.split(";")[0]);
   }
   const createCase=async()=>{
    const id=randomUUID();cases.push(id);
    await pool.query("INSERT INTO civic_cases(id,author_id,title,description,area,category,state) VALUES($1,$2,$3,$4,$5,$6,'published')",
     [id,accounts[0].id,"Synthetic editorial review","This is a fully fictional published case for boundary regression tests.","Test area","Testing"]);
    return id;
   };
   const createCorrection=async(caseId,state="pending")=>{
    const id=randomUUID();corrections.push(id);
    await pool.query("INSERT INTO case_corrections(id,case_id,author_id,reason,state,reviewer_id) VALUES($1,$2,$3,$4,$5,$6)",
     [id,caseId,accounts[0].id,"Synthetic editorial correction reason for integration testing.",state,state==="rejected"?accounts[1].id:null]);
    return id;
   };
   const createAppeal=async(correctionId)=>{
    const id=randomUUID();appeals.push(id);
    await pool.query("INSERT INTO correction_appeals(id,correction_id,author_id,reason) VALUES($1,$2,$3,$4)",
     [id,correctionId,accounts[0].id,"Synthetic appeal reason for an independently reviewed rejection."]);
    return id;
   };
   for(const kind of ["correction","appeal"]){
    const lengths=kind==="correction"?[979,980,1000]:[981,982,1000];
    for(const [i,n] of [...lengths,1000,1001].entries()){
     const decision=i===lengths.length?"rejected":"accepted";
     const tooLong=i===lengths.length+1;
     const caseId=await createCase();
     const correctionId=await createCorrection(caseId,kind==="appeal"?"rejected":"pending");
     const reviewId=kind==="appeal"?await createAppeal(correctionId):correctionId;
     const note="ë".repeat(tooLong?1001:n);
     const path=kind==="appeal"?"/api/appeals/review/":"/api/corrections/review/";
     const result=await send(path+reviewId,{decision,note},
      kind==="appeal"?reviewerCookies[1]:reviewerCookies[0]);
     assert.equal(result.status,tooLong?422:200,kind+" decision "+decision+" with "+note.length+" chars: "+JSON.stringify(result.data));
     const archived=decision==="accepted"&&!tooLong;
     const state=await pool.query("SELECT state FROM civic_cases WHERE id=$1",[caseId]);
     assert.equal(state.rows[0].state,archived?"archived":"published");
     const history=await pool.query("SELECT note FROM retraction_history WHERE case_id=$1",[caseId]);
     assert.equal(history.rowCount,archived?1:0);
     if(archived)assert.equal(history.rows[0].note,note,"Store complete original reasoning, including Albanian Unicode");
     const q=kind==="appeal"
      ?"SELECT state,review_note FROM correction_appeals WHERE id=$1"
      :"SELECT state,review_note FROM case_corrections WHERE id=$1";
     const reviewed=await pool.query(q,[reviewId]);
     assert.equal(reviewed.rows[0].state,tooLong?"pending":decision);
     assert.equal(reviewed.rows[0].review_note,tooLong?null:note);
     const audit=await pool.query("SELECT action FROM audit_entries WHERE object_id=$1",[reviewId]);
     assert.equal(audit.rowCount,tooLong?0:1);
     if(!tooLong)assert.equal(audit.rows[0].action,(kind==="appeal"?"appeal.":"correction.")+decision);
    }
   }
  }finally{
   if(listening)await new Promise(resolve=>server.close(resolve));
   const caseIDs=cases,correctionIDs=corrections,accountIDs=accounts.map(u=>u.id);
   try{
    await pool.query("DELETE FROM audit_entries WHERE actor_id=ANY($1::uuid[])",[accountIDs]);
    await pool.query("DELETE FROM retraction_history WHERE case_id=ANY($1::uuid[])",[caseIDs]);
    await pool.query("DELETE FROM correction_appeals WHERE correction_id=ANY($1::uuid[])",[correctionIDs]);
    await pool.query("DELETE FROM case_corrections WHERE id=ANY($1::uuid[])",[correctionIDs]);
    await pool.query("DELETE FROM civic_cases WHERE id=ANY($1::uuid[])",[caseIDs]);
    await pool.query("DELETE FROM sessions WHERE user_id=ANY($1::uuid[])",[accountIDs]);
    await pool.query("DELETE FROM civic_users WHERE id=ANY($1::uuid[])",[accountIDs]);
   }finally{await pool.end();}
  }
 });
