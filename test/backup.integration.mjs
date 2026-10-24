import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {randomBytes,randomUUID,createHash} from "node:crypto";
import {mkdtemp,readFile,writeFile,rm,stat} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import pg from "pg";

const exec=promisify(execFile);
const ROOT_FIXTURE="postgres://postgres:postgres@127.0.0.1:5432/protesto";
const EXPECTED_TABLES=[
 "action_reviews","audit_entries","case_corrections","case_responses",
 "case_sources","civic_actions","civic_cases","civic_users",
 "correction_appeals","dialogue_results","dialogue_reviews",
 "dialogue_statements","dialogue_topics","dialogue_votes",
 "request_rate_limits","retraction_history","review_history",
 "schema_migrations","sessions","source_fingerprints"
].sort();

// No operations, not even provisioning, on an ambient or non-CI database.
// The pre-existing 'protesto' fixture is used ONLY to reach the disposable
// CI Postgres instance's administrative maintenance database.
if(process.env.GITHUB_ACTIONS!=="true" ||
 process.env.PROTESTO_BACKUP_TEST!=="1" ||
 process.env.NODE_ENV==="production" ||
 process.env.DATABASE_URL!==ROOT_FIXTURE)
 throw Error("F09 backup drill requires exact synthetic GitHub PostgreSQL fixture; refusing ambient DB.");

const suffix=randomBytes(6).toString("hex");
const srcName="protesto_bsrc_"+suffix, dstName="protesto_bdst_"+suffix;
const role="protesto_bci_"+suffix,password=randomBytes(24).toString("hex");
const secret=randomBytes(40).toString("hex");
const root=await mkdtemp(join(tmpdir(),"protesto-backup-drill-"));
const file=join(root,"database.ptbk"),corrupt=join(root,"corrupt.ptbk");
const admin=new pg.Pool({connectionString:ROOT_FIXTURE.replace("/protesto","/postgres"),max:1});
const connectUrl=name=>"postgres://"+role+":"+password+"@127.0.0.1:5432/"+name;
const sourceURL=connectUrl(srcName),destURL=connectUrl(dstName);
const env={...process.env,DATABASE_URL:sourceURL,
 RESTORE_DATABASE_URL:destURL,PROTESTO_BACKUP_FILE:file,
 PROTESTO_BACKUP_SECRET:secret,
 PROTESTO_ALLOW_RESTORE:"I_ACKNOWLEDGE_EMPTY_TEST_DATABASE"};
const run=(script,overrides={})=>exec(process.execPath,[script],{
 env:{...env,...overrides},maxBuffer:1024*1024
});
const qname=x=>'"'+x+'"'; // only generated [a-z0-9_] names may reach identifiers
const sha=v=>createHash("sha256").update(v).digest("hex");
let createdRole=false,createdSource=false,createdDestination=false,source;

const tableNames=async pool=>{
 const {rows}=await pool.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name");
 return rows.map(x=>x.table_name);
};
const rowProof=async pool=>{
 const actual=await tableNames(pool);
 assert.deepEqual(actual,EXPECTED_TABLES,"all 20 tables must be inspected (fail on new or omitted tables)");
 const out={};
 for(const table of EXPECTED_TABLES){
  const {rows}=await pool.query(
   'SELECT to_jsonb(t)::text AS row_json FROM public."'+table+'" t ORDER BY to_jsonb(t)::text');
  // Do not emit sensitive rows in GitHub Actions. The backup drill compares
  // canonical complete row contents, including timestamps, MFA data and keys.
  out[table]={count:rows.length,sha256:sha(JSON.stringify(rows.map(r=>r.row_json)))};
 }
 return out;
};
const schemaProof=async pool=>{
 const queries=[
  "SELECT table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default,"+
  "character_maximum_length,numeric_precision,numeric_scale FROM information_schema.columns "+
  "WHERE table_schema='public' ORDER BY table_name,ordinal_position",
  "SELECT cl.relname AS table_name,c.conname,c.contype,"+
  "pg_get_constraintdef(c.oid,true) AS definition "+
  "FROM pg_constraint c JOIN pg_class cl ON cl.oid=c.conrelid "+
  "JOIN pg_namespace n ON n.oid=cl.relnamespace WHERE n.nspname='public' "+
  "ORDER BY cl.relname,c.conname",
  "SELECT tablename,indexname,indexdef FROM pg_indexes "+
  "WHERE schemaname='public' ORDER BY tablename,indexname",
  "SELECT cl.relname AS table_name,t.tgname,pg_get_triggerdef(t.oid,true) AS definition "+
  "FROM pg_trigger t JOIN pg_class cl ON cl.oid=t.tgrelid "+
  "JOIN pg_namespace n ON n.oid=cl.relnamespace "+
  "WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY cl.relname,t.tgname",
  "SELECT p.proname,pg_get_functiondef(p.oid) AS definition "+
  "FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace "+
  "WHERE n.nspname='public' ORDER BY p.proname"
 ];
 const out={};
 for(let i=0;i<queries.length;i++){
  const {rows}=await pool.query(queries[i]);
  out[["columns","constraints","indexes","triggers","functions"][i]]={
   count:rows.length,sha256:sha(JSON.stringify(rows))
  };
  if(i===1){
   // Keys plus digest only: never print PII or full application row content.
   out.constraintFingerprintByName=Object.fromEntries(
    rows.map(r=>[r.table_name+"."+r.conname,sha(r.definition)]));
   out.constraintDefinitionByName=Object.fromEntries(
    rows.map(r=>[r.table_name+"."+r.conname,r.definition]));
  }
 }
 return out;
};

async function seedSynthetic(source){
 const ids=Array.from({length:19},()=>randomUUID());
 const [citizen,reviewer,second,caseId,archived,action,sourceId,
  correction,appeal,response,topicOpen,topicClosed,topicCancelled,
  statementOpen,statementClosed,caseReview,withdrawal,actionReview,reviewVote]=ids;
 const put=(sql,params)=>source.query(sql,params);
 await put(
  "INSERT INTO civic_users(id,email,password_hash,role,totp_secret_encrypted,totp_last_counter) "+
  "VALUES ($1,$2,$3,'reporter',NULL,-1),($4,$5,$6,'reviewer',$7,8),($8,$9,$10,'reviewer',NULL,-1)",
  [citizen,"synthetic-"+citizen+"@example.org","fictional-citizen-hash",
   reviewer,"synthetic-"+reviewer+"@example.org","fictional-reviewer-hash",
   "synthetic-mfa-ciphertext-not-a-real-key",
   second,"synthetic-"+second+"@example.org","fictional-secondary-hash"]);
 await put("INSERT INTO sessions(token_hash,user_id,expires_at) "+
  "VALUES($1,$3,now()+interval '3 hours'),($2,$3,now()-interval '1 day')",
  ["active-session-"+suffix,"expired-session-"+suffix,citizen]);
 await put("INSERT INTO request_rate_limits(key_hash,hits,expires_at) "+
  "VALUES($1,3,now()+interval '15 minutes'),($2,5,now()-interval '1 minute')",
  ["a".repeat(52)+suffix,"b".repeat(52)+suffix]);
 await put("INSERT INTO civic_cases(id,author_id,title,description,area,category,source_url,state,reviewed_by,"+
  "public_title,public_description,public_source_url,public_area) "+
  "VALUES($1,$2,$3,$4,$5,'Mjedis',$6,'published',$7,$8,$9,$10,$11)",
  [caseId,citizen,"PRIVATE: fictional environmental case",
   "Synthetic original private description not approved for public disclosure.",
   "PRIVATE: example apartment","https://example.org/private-case?synthetic=1",reviewer,
   "Reviewed public case title","Public redacted description of the invented issue.",
   "https://example.org/public-case","Example municipality"]);
 await put("INSERT INTO civic_cases(id,author_id,title,description,area,category,state) "+
  "VALUES($1,$2,$3,$4,'Synthetic area','Mjedis','archived')",
  [archived,citizen,"Archived example case",
   "Synthetic case withdrawn from the public view in this backup fixture."]);
 await put("INSERT INTO review_history(id,case_id,reviewer_id,decision,note) "+
  "VALUES($1,$2,$3,'published',$4)",
  [caseReview,caseId,reviewer,"Synthetic independent editorial review decision."]);
 await put("INSERT INTO audit_entries(id,actor_id,action,object_type,object_id) "+
  "VALUES($1,$2,'civic_case.published','civic_case',$3),"+
  "($4,$2,'civic_case.archived','civic_case',$5)",
  [randomUUID(),reviewer,caseId,randomUUID(),archived]);
 await put("INSERT INTO retraction_history(id,case_id,reviewer_id,note) VALUES($1,$2,$3,$4)",
  [withdrawal,archived,reviewer,"Original correction/retraction history retained synthetically."]);
 await put("INSERT INTO civic_actions(id,author_id,kind,subtype,title,description,area,state,reviewer_id,"+
  "public_title,public_description,public_area) "+
  "VALUES($1,$2,'initiative','Peticion',$3,$4,$5,'published',$6,$7,$8,$9)",
  [action,citizen,"PRIVATE fictional initiative",
   "Synthetic internal action description separate from public approved text.",
   "PRIVATE: example street",reviewer,"Public reviewed initiative",
   "Reviewed public-safe description of synthetic initiative.","Example region"]);
 await put("INSERT INTO action_reviews(id,action_id,reviewer_id,decision,note) "+
  "VALUES($1,$2,$3,'published',$4)",
  [actionReview,action,reviewer,"Independent fictional approval note."]);
 await put("INSERT INTO case_sources(id,case_id,submitted_by,title,url,context,state,reviewed_by,"+
  "review_note,public_title,public_url) "+
  "VALUES($1,$2,$3,$4,$5,$6,'accepted',$7,$8,$9,$10)",
  [sourceId,caseId,citizen,"Private fictional source title",
   "https://example.org/raw-source?private=1",
   "Original private synthetic source context requiring review.",reviewer,
   "Synthetic review checked source metadata.",
   "Reviewed public source title","https://example.org/public-source"]);
 await put("INSERT INTO source_fingerprints(source_id,sha256_hex,byte_length,media_type,reviewed_by) "+
  "VALUES($1,$2,150,'application/pdf',$3)",[sourceId,"c".repeat(64),reviewer]);
 await put("INSERT INTO case_corrections(id,case_id,author_id,reason,state,reviewer_id,review_note) "+
  "VALUES($1,$2,$3,$4,'rejected',$5,$6)",
  [correction,caseId,citizen,
   "Synthetic private correction requesting re-examination of the fictional report.",
   reviewer,"Original editorial rejection explanation."]);
 await put("INSERT INTO correction_appeals(id,correction_id,author_id,reason,state) "+
  "VALUES($1,$2,$3,$4,'pending')",
  [appeal,correction,citizen,
   "Synthetic appeal challenge retained for second independent review."]);
 await put("INSERT INTO case_responses(id,case_id,author_id,body,state,public_body,reviewer_id,review_note) "+
  "VALUES($1,$2,$3,$4,'accepted',$5,$6,$7)",
  [response,caseId,second,
   "Original long synthetic response with private fictional details removed for public view.",
   "Public reviewed synthetic citizen statement for the invented case.",
   reviewer,"Synthetic response moderation note."]);
 const topicSql="INSERT INTO dialogue_topics(id,case_id,created_by,title,description,state,"+
  "public_title,public_description,review_state,reviewed_by,review_note,reviewed_at,"+
  "closed_at,closed_by,cancelled_at,cancelled_by) "+
  "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now(),$12,$13,$14,$15)";
 await put(topicSql,[topicOpen,caseId,reviewer,"Private open dialogue",
  "Synthetic discussion description that is entirely fictional.",
  "open","Reviewed open dialogue","Public neutral description for synthetic open dialogue.",
  "approved",second,"Synthetic independent topic approval.",null,null,null,null]);
 await put(topicSql,[topicClosed,caseId,reviewer,"Private closed dialogue",
  "Synthetic completed dialogue description for aggregate snapshot.",
  "closed","Reviewed closed dialogue","Public reviewed description of concluded discussion.",
  "approved",second,"Synthetic closed-topic approval.",new Date(),reviewer,null,null]);
 await put(topicSql,[topicCancelled,archived,reviewer,"Cancelled private topic",
  "Synthetic cancelled topic related to an archived report.",
  "cancelled",null,null,"pending",null,null,null,null,new Date(),reviewer]);
 await put("INSERT INTO dialogue_statements(id,topic_id,author_id,body,state,public_body,reviewed_by) "+
  "VALUES($1,$2,$3,$4,'accepted',$5,$6),($7,$8,$3,$9,'accepted',$10,$6)",
  [statementOpen,topicOpen,citizen,
   "Original fictional private statement with details.",
   "Public reviewed open dialogue statement.",reviewer,
   statementClosed,topicClosed,
   "Original fictional closed discussion statement.",
   "Reviewed public closed discussion statement."]);
 await put("INSERT INTO dialogue_reviews(id,statement_id,reviewer_id,decision,note) "+
  "VALUES($1,$2,$3,'accepted',$4)",
  [reviewVote,statementOpen,reviewer,"Approved private synthetic statement note."]);
 await put("INSERT INTO dialogue_votes(statement_id,voter_key,choice,consent_version) "+
  "VALUES($1,$2,'agree','v1')",[statementOpen,"d".repeat(64)]);
 await put("INSERT INTO dialogue_results(statement_id,participants,agree_count,disagree_count,pass_count) "+
  "VALUES($1,10,6,3,1)",[statementClosed]);
}

try{
 // The sole privileged operations are CREATE/DROP of unpredictable names in
 // GitHub's dedicated disposable CI cluster. Never dump the ambient root DB.
 await admin.query('CREATE ROLE '+qname(role)+" LOGIN PASSWORD '"+password+"'");
 createdRole=true;
 await admin.query('CREATE DATABASE '+qname(srcName)+" OWNER "+qname(role));
 createdSource=true;
 await admin.query('CREATE DATABASE '+qname(dstName)+" OWNER "+qname(role));
 createdDestination=true;
 const owner=await admin.query(
  "SELECT rolname,rolsuper,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=$1",
  [role]);
 assert.deepEqual(owner.rows[0],{
  rolname:role,rolsuper:false,rolcreatedb:false,rolcreaterole:false
 },"test data connections must use a non-admin principal");
 source=new pg.Pool({connectionString:sourceURL,max:2});
 assert.deepEqual((await source.query(
  "SELECT current_database() AS db,current_user AS role")).rows[0],
  {db:srcName,role});
 await run("tools/migrate.mjs");
 await seedSynthetic(source);
 const initialRows=await rowProof(source);
 assert.ok(EXPECTED_TABLES.every(t=>initialRows[t].count>0),
  "representative fixture rows are mandatory in all 20 tables");
 assert.equal(initialRows.schema_migrations.count,17);
 const initialSchema=await schemaProof(source);

 await run("tools/backup.mjs");
 const archived=await readFile(file);
 assert.equal((await stat(file)).mode & 0o777,0o600);
 assert.equal(archived.subarray(0,9).toString().includes("PGDMP"),false);
 const archiveHash=sha(archived);
 await assert.rejects(run("tools/backup.mjs"),"backup must never overwrite existing archive");
 assert.equal(sha(await readFile(file)),archiveHash);
 const modified=Buffer.from(archived);
 modified[modified.length-32]^=0xa7;
 await writeFile(corrupt,modified);
 await assert.rejects(run("tools/restore.mjs",{PROTESTO_BACKUP_FILE:corrupt}),
  "corrupt encrypted archive must be rejected before target writes");
 await assert.rejects(run("tools/restore.mjs",{
  PROTESTO_BACKUP_SECRET:"synthetic-incorrect-archive-passphrase-2026"
 }),"wrong passphrase must be rejected before target writes");
 await assert.rejects(run("tools/restore.mjs",{RESTORE_DATABASE_URL:sourceURL}),
  "source and target must not be identical");
 const empty=new pg.Pool({connectionString:destURL,max:1});
 try{
  assert.equal((await empty.query(
   "SELECT count(*)::integer n FROM pg_tables WHERE schemaname='public'")).rows[0].n,0);
 }finally{await empty.end();}
 await run("tools/restore.mjs");
 const restored=new pg.Pool({connectionString:destURL,max:2});
 try{
  assert.deepEqual(await rowProof(restored),initialRows,
   "all 20 table counts and full row contents must match byte-for-byte canonical hashes");
  const restoredSchema=await schemaProof(restored);
  if(restoredSchema.constraints.sha256!==initialSchema.constraints.sha256){
   const before=initialSchema.constraintFingerprintByName;
   const after=restoredSchema.constraintFingerprintByName;
   const names=[...new Set([...Object.keys(before),...Object.keys(after)])].sort();
   const differing=names.filter(name=>before[name]!==after[name]);
   const samples=differing.slice(0,2).map(name=>({
    name,source:initialSchema.constraintDefinitionByName[name],
    restored:restoredSchema.constraintDefinitionByName[name]
   }));
   throw Error("F09 constraint deparser differences: "+JSON.stringify(samples));
  }
  assert.deepEqual(restoredSchema,initialSchema,
   "columns, constraints, indexes, custom triggers and functions must match");
  const foreignKeys=await restored.query(
   "SELECT count(*)::integer n FROM pg_constraint WHERE contype='f' "+
   "AND connamespace='public'::regnamespace");
  assert.ok(foreignKeys.rows[0].n>10);
  await assert.rejects(run("tools/restore.mjs"),
   "restore must refuse non-empty target even with valid backup");
  assert.deepEqual(await rowProof(restored),initialRows,
   "rejected second restore must leave rows intact");
 }finally{await restored.end();}
 assert.deepEqual(await rowProof(source),initialRows,
  "source fixture must not mutate as a side effect of dumping/restoring");
 console.log("Protesto encrypted backup: all 20 tables, full content hashes, schema parity, negative restore and isolated CI source verified.");
}finally{
 if(source)await source.end();
 for(const [name,created] of [[dstName,createdDestination],[srcName,createdSource]]){
  if(created)await admin.query("DROP DATABASE "+qname(name)+" WITH (FORCE)");
 }
 if(createdRole)await admin.query("DROP ROLE "+qname(role));
 await admin.end();
 await rm(root,{recursive:true,force:true});
}
