import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable,Writable} from 'node:stream';
import {mkdtemp,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {encryptToFile,verifyEncryptedBackup,decryptToStream,MAGIC} from '../src/ops/backup-crypto.mjs';
import {postgresEnv} from '../src/ops/pg-env.mjs';
const secret='Unique private backup test secret that is more than 24 characters';

test('authenticated stream encryption survives roundtrip; corruption and bad key are rejected',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'protesto-crypto-'));
 try{
  const path=join(dir,'backup.ptbk');
  const plain=Buffer.from('synthetic-private-test-data'.repeat(3000));
  await encryptToFile(Readable.from(plain),path,secret);
  const stored=await readFile(path);
  assert.equal(stored.subarray(0,MAGIC.length).toString(),MAGIC.toString());
  assert.equal(stored.includes(Buffer.from('synthetic-private-test-data')),false);
  assert.equal((await stat(path)).mode & 0o777,0o600);
  await verifyEncryptedBackup(path,secret);
  const output=[];
  await decryptToStream(path,secret,new Writable({write(buf,_e,cb){output.push(buf);cb();}}));
  assert.deepEqual(Buffer.concat(output),plain);
  await assert.rejects(verifyEncryptedBackup(path,'A distinct passphrase that also exceeds minimum length'));
  await assert.rejects(encryptToFile(Readable.from('attempt overwrite'),path,secret));
  assert.deepEqual(await readFile(path),stored,'existing backup must be preserved on failed write');
  stored[stored.length-33]^=0xff;
  const corrupt=join(dir,'corrupt.ptbk');await writeFile(corrupt,stored);
  await assert.rejects(verifyEncryptedBackup(corrupt,secret));
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('postgres connection args use environment, never CLI secrets',()=>{
 const pg=postgresEnv('postgresql://testuser:secret%402026@127.0.0.1:5432/protesto?sslmode=require');
 assert.equal(pg.name,'protesto');
 assert.equal(pg.env.PGPASSWORD,'secret@2026');
 assert.equal(pg.env.PGSSLMODE,'require');
 assert.throws(()=>postgresEnv('https://example.org/notdb'));
});
