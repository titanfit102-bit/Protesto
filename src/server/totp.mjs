import {createCipheriv,createDecipheriv,createHmac,randomBytes} from "node:crypto";
const VALID=/^[0-9]{6}$/;
function keyBytes(key){
 if(typeof key!=="string"||!/^[a-zA-Z0-9_-]{43}$/.test(key))throw new Error("PROTESTO_MFA_KEY must be a 32-byte base64url value");
 const out=Buffer.from(key,"base64url");
 if(out.length!==32)throw new Error("Invalid MFA key");
 return out;
}
export function generateTotpSecret(){return randomBytes(20);}
export function encodeBase32(bytes){
 const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";let acc=0,bits=0,out="";
 for(const byte of bytes){acc=(acc<<8)|byte;bits+=8;while(bits>=5){bits-=5;out+=alphabet[(acc>>>bits)&31];}}
 if(bits>0)out+=alphabet[(acc<<(5-bits))&31];
 return out;
}
export function encryptTotpSecret(secret,key){
 if(!Buffer.isBuffer(secret)||secret.length!==20)throw new TypeError("TOTP secret must be 20 random bytes");
 const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",keyBytes(key),iv);
 cipher.setAAD(Buffer.from("PROTESTO-TOTP-v1"));
 const ciphertext=Buffer.concat([cipher.update(secret),cipher.final()]);
 return "v1:"+Buffer.concat([iv,cipher.getAuthTag(),ciphertext]).toString("base64url");
}
export function decryptTotpSecret(record,key){
 if(typeof record!=="string"||!record.startsWith("v1:"))throw new TypeError("Unsupported encrypted secret");
 const all=Buffer.from(record.slice(3),"base64url");
 if(all.length!==48)throw new TypeError("Invalid encrypted secret");
 const decipher=createDecipheriv("aes-256-gcm",keyBytes(key),all.subarray(0,12));
 decipher.setAAD(Buffer.from("PROTESTO-TOTP-v1"));decipher.setAuthTag(all.subarray(12,28));
 const secret=Buffer.concat([decipher.update(all.subarray(28)),decipher.final()]);
 if(secret.length!==20)throw new TypeError("Invalid MFA secret");
 return secret;
}
export function totpCodeAt(secret,counter){
 if(!Buffer.isBuffer(secret)||secret.length!==20||!Number.isSafeInteger(counter)||counter<0)throw new TypeError("Invalid TOTP input");
 const msg=Buffer.alloc(8);msg.writeBigUInt64BE(BigInt(counter));
 const digest=createHmac("sha1",secret).update(msg).digest();
 const offset=digest[digest.length-1]&15;
 const code=(digest.readUInt32BE(offset)&0x7fffffff)%1000000;
 return String(code).padStart(6,"0");
}
export function verifyTotpCode(secret,code,lastCounter=-1,now=Date.now()){
 if(typeof code!=="string"||!VALID.test(code)||!Number.isSafeInteger(now)||now<0)return null;
 const last=Number(lastCounter);
 if(!Number.isSafeInteger(last)||last< -1)return null;
 const current=Math.floor(now/30000);
 for(const offset of [-1,0,1]){
  const counter=current+offset;
  if(counter>last&&counter>=0&&totpCodeAt(secret,counter)===code)return counter;
 }
 return null;
}
