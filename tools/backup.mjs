import {spawn} from 'node:child_process';
import {unlink} from 'node:fs/promises';
import {encryptToFile} from '../src/ops/backup-crypto.mjs';
import {postgresEnv} from '../src/ops/pg-env.mjs';

const path=process.env.PROTESTO_BACKUP_FILE;
const secret=process.env.PROTESTO_BACKUP_SECRET;
if(!path||!secret)throw new Error('PROTESTO_BACKUP_FILE and PROTESTO_BACKUP_SECRET are required.');
const conn=postgresEnv(process.env.DATABASE_URL);
const child=spawn('pg_dump',['-Fc','--no-owner','--no-acl','--dbname',conn.name],{env:conn.env,stdio:['ignore','pipe','pipe']});
child.stderr.on('data',()=>{}); // Avoid credentials in logs.
const exited=new Promise((resolve,reject)=>{
 child.once('error',reject);
 child.once('close',code=>code===0?resolve():reject(new Error('pg_dump failed (exit '+code+').')));
});
let encryptedOk=false;
try{
 await Promise.all([encryptToFile(child.stdout,path,secret).then(()=>{encryptedOk=true;}),exited]);
 console.log('Encrypted database archive created. Verify restoration before treating this as a usable backup.');
}catch(error){
 child.kill('SIGTERM');
 if(encryptedOk){try{await unlink(path);}catch{}}
 throw error;
}
