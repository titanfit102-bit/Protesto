import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {mkdtemp,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import pg from 'pg';
const exec=promisify(execFile);
if(!process.env.DATABASE_URL)throw new Error('Disposable integration DATABASE_URL required.');
if(process.env.PROTESTO_BACKUP_TEST!=='1')throw new Error('This test is restricted to disposable integration databases.');
const secret=randomBytes(40).toString('hex');
const root=await mkdtemp(join(tmpdir(),'protesto-backup-drill-'));
const file=join(root,'database.ptbk'),corrupt=join(root,'corrupt.ptbk');
const source=new pg.Pool({connectionString:process.env.DATABASE_URL,max:2});
const database='protesto_restore_'+randomBytes(5).toString('hex');
const adminURL=new URL(process.env.DATABASE_URL);adminURL.pathname='/postgres';
const admin=new pg.Pool({connectionString:adminURL.toString(),max:2});
const restoredURL=new URL(process.env.DATABASE_URL);restoredURL.pathname='/'+database;
const env={...process.env,PROTESTO_BACKUP_FILE:file,PROTESTO_BACKUP_SECRET:secret,RESTORE_DATABASE_URL:restoredURL.toString(),PROTESTO_ALLOW_RESTORE:'I_ACKNOWLEDGE_EMPTY_TEST_DATABASE'};
const run=async(script,overrides={})=>exec(process.execPath,[script],{env:{...env,...overrides},maxBuffer:1024*1024});
const tables=['civic_users','civic_cases','case_sources','source_fingerprints','case_corrections','civic_actions','schema_migrations','audit_entries'];
const getCounts=async pool=>{
 const out={};
 for(const table of tables)out[table]=Number((await pool.query('SELECT count(*)::integer AS n FROM "'+table+'"')).rows[0].n);
 return out;
};
let created=false;
try{
 const syntheticId=randomUUID();
 await source.query('INSERT INTO civic_users(id,email,password_hash,role) VALUES ($1,$2,$3,$4)',[syntheticId,'drill-'+randomBytes(6).toString('hex')+'@example.org','fictional-hash-not-used','reporter']);
 const original=await getCounts(source);
 assert.equal(original.schema_migrations,8);
 const sourceDigests=await source.query("SELECT source_id,sha256_hex,byte_length,media_type FROM source_fingerprints ORDER BY source_id");
 await admin.query('CREATE DATABASE "'+database+'"');created=true;
 await run('tools/backup.mjs');
 const archived=await readFile(file);
 assert.equal((await stat(file)).mode & 0o777,0o600);
 assert.equal(archived.subarray(0,9).toString().includes('PGDMP'),false);
 const sha=createHash('sha256').update(archived).digest('hex');
 await assert.rejects(run('tools/backup.mjs'),'an existing backup must not be overwritten');
 assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),sha);
 const modified=Buffer.from(archived);
 modified[modified.length-32]^=0xa7;await writeFile(corrupt,modified);
 await assert.rejects(run('tools/restore.mjs',{PROTESTO_BACKUP_FILE:corrupt}),'corrupted archive must be rejected');
 const empty=new pg.Pool({connectionString:restoredURL.toString(),max:1});
 try{
  const n=await empty.query("SELECT count(*)::integer n FROM pg_tables WHERE schemaname='public'");
  assert.equal(n.rows[0].n,0,'tampered restore must not change target database');
 }finally{await empty.end();}
 await assert.rejects(run('tools/restore.mjs',{RESTORE_DATABASE_URL:process.env.DATABASE_URL}),'restoring into source database must be blocked');
 await run('tools/restore.mjs');
 const restored=new pg.Pool({connectionString:restoredURL.toString(),max:2});
 try{
  const after=await getCounts(restored);
  assert.deepEqual(after,original,'restored tables must match original row counts');
  const restoredDigests=await restored.query("SELECT source_id,sha256_hex,byte_length,media_type FROM source_fingerprints ORDER BY source_id");
  assert.deepEqual(restoredDigests.rows,sourceDigests.rows,"PDF digest declaration data must survive encrypted restore");
  const proof=await restored.query('SELECT id,email FROM civic_users WHERE id=$1',[syntheticId]);
  assert.equal(proof.rows[0]?.id,syntheticId);
 }finally{await restored.end();}
 await assert.rejects(run('tools/restore.mjs'),'restoring into a non-empty target must be blocked');
 console.log('Protesto encrypted backup drill verified: encrypt, tamper refusal, empty-target restore and data parity.');
}finally{
 await source.end();
 if(created){
  try{await admin.query('DROP DATABASE "'+database+'" WITH (FORCE)');}catch(e){console.error('Manual cleanup of disposable database required:',database);}
 }
 await admin.end();
 await rm(root,{recursive:true,force:true});
}
