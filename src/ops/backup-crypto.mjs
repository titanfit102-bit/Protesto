import {createCipheriv,createDecipheriv,randomBytes,scryptSync} from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {open,stat,unlink} from 'node:fs/promises';
import {Transform,Writable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

export const MAGIC=Buffer.from('PROTESTO-BACKUP-v1\n','ascii');
const SALT_LENGTH=16,IV_LENGTH=12,TAG_LENGTH=16;
export const HEADER_LENGTH=MAGIC.length+SALT_LENGTH+IV_LENGTH;

function passwordKey(secret,salt){
 if(typeof secret!=='string'||secret.length<24||secret.length>1024)throw new Error('Backup secret must contain 24–1024 characters.');
 return scryptSync(secret,salt,32,{N:16384,r:8,p:1,maxmem:64*1024*1024});
}
function tagWriter(cipher){return new Transform({
 transform(chunk,_enc,callback){callback(null,chunk);},
 flush(callback){this.push(cipher.getAuthTag());callback();}
});}

export async function encryptToFile(source,path,secret){
 const salt=randomBytes(SALT_LENGTH),iv=randomBytes(IV_LENGTH);
 const header=Buffer.concat([MAGIC,salt,iv]);
 const key=passwordKey(secret,salt);
 const cipher=createCipheriv('aes-256-gcm',key,iv);
 cipher.setAAD(header);
 let created=false;
 const file=createWriteStream(path,{flags:'wx',mode:0o600});
 file.once('open',()=>{created=true;});
 file.write(header);
 try{
  await pipeline(source,cipher,tagWriter(cipher),file);
 }catch(error){
  file.destroy();
  if(created){try{await unlink(path);}catch{}}
  throw error;
 }finally{key.fill(0);}
}

async function metadata(path){
 const size=(await stat(path)).size;
 if(size<HEADER_LENGTH+TAG_LENGTH)throw new Error('Backup too small or damaged.');
 const f=await open(path,'r');
 try{
  const header=Buffer.alloc(HEADER_LENGTH),tag=Buffer.alloc(TAG_LENGTH);
  await f.read(header,0,HEADER_LENGTH,0);
  await f.read(tag,0,TAG_LENGTH,size-TAG_LENGTH);
  if(!header.subarray(0,MAGIC.length).equals(MAGIC))throw new Error('Unrecognized archive version.');
  return {size,header,tag,salt:header.subarray(MAGIC.length,MAGIC.length+SALT_LENGTH),iv:header.subarray(MAGIC.length+SALT_LENGTH)};
 }finally{await f.close();}
}
async function runDecrypt(path,secret,destination,info){
 const key=passwordKey(secret,info.salt);
 const decipher=createDecipheriv('aes-256-gcm',key,info.iv);
 decipher.setAAD(info.header);
 decipher.setAuthTag(info.tag);
 try{
  await pipeline(createReadStream(path,{start:HEADER_LENGTH,end:info.size-TAG_LENGTH-1}),decipher,destination);
 }finally{key.fill(0);}
}
export async function verifyEncryptedBackup(path,secret){
 const info=await metadata(path);
 await runDecrypt(path,secret,new Writable({write(_chunk,_encoding,callback){callback();}}),info);
 return {encryptedBytes:info.size,verified:true};
}
export async function decryptToStream(path,secret,target){
 const info=await metadata(path);
 await runDecrypt(path,secret,target,info);
}
