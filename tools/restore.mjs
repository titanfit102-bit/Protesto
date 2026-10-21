import {spawn} from 'node:child_process';
import pg from 'pg';
import {decryptToStream,verifyEncryptedBackup} from '../src/ops/backup-crypto.mjs';
import {postgresEnv} from '../src/ops/pg-env.mjs';

const file=process.env.PROTESTO_BACKUP_FILE, secret=process.env.PROTESTO_BACKUP_SECRET;
if(!file||!secret||!process.env.RESTORE_DATABASE_URL)throw new Error('Backup file, passphrase and RESTORE_DATABASE_URL required.');
if(process.env.PROTESTO_ALLOW_RESTORE!=='I_ACKNOWLEDGE_EMPTY_TEST_DATABASE')throw new Error('Private pilot restore requires explicit disposable-target acknowledgement.');
if(process.env.NODE_ENV==='production')throw new Error('Do not run the prototype restore tool in production.');
const target=postgresEnv(process.env.RESTORE_DATABASE_URL);
if(process.env.DATABASE_URL){
 const source=postgresEnv(process.env.DATABASE_URL);
 if(source.name===target.name&&source.host===target.host&&source.port===target.port)throw new Error('Restore target must differ from source database.');
}
// Verify GCM authentication *before* any target database writes.
await verifyEncryptedBackup(file,secret);
const pool=new pg.Pool({connectionString:process.env.RESTORE_DATABASE_URL,max:1});
try{
 const objects=await pool.query("SELECT count(*)::integer AS n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND c.relkind IN ('r','p','v','m','S','f')");
 if(objects.rows[0].n!==0)throw new Error('Restore target is not empty; refusing to overwrite data.');
}finally{await pool.end();}
const child=spawn('pg_restore',['--dbname',target.name,'--single-transaction','--exit-on-error','--no-owner','--no-acl'],{env:target.env,stdio:['pipe','ignore','pipe']});
child.stderr.on('data',()=>{}); // Do not leak credentials or private content.
const exited=new Promise((resolve,reject)=>{
 child.once('error',reject);
 child.once('close',code=>code===0?resolve():reject(new Error('pg_restore failed (exit '+code+').')));
});
try{
 await Promise.all([decryptToStream(file,secret,child.stdin),exited]);
 console.log('Encrypted archive restored into verified empty database.');
}catch(error){
 child.kill('SIGTERM');
 throw error;
}
