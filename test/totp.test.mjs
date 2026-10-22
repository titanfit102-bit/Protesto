import test from "node:test";
import assert from "node:assert/strict";
import {generateTotpSecret,encodeBase32,encryptTotpSecret,decryptTotpSecret,totpCodeAt,verifyTotpCode} from "../src/server/totp.mjs";
const key=Buffer.alloc(32,42).toString("base64url");
test("encrypted TOTP secrets survive decrypt but reject tampering and wrong keys",()=>{
 const secret=generateTotpSecret();assert.equal(secret.length,20);assert.equal(encodeBase32(secret).length,32);
 const ciphertext=encryptTotpSecret(secret,key);
 assert.deepEqual(decryptTotpSecret(ciphertext,key),secret);
 assert.throws(()=>decryptTotpSecret(ciphertext,Buffer.alloc(32,43).toString("base64url")));
 assert.throws(()=>decryptTotpSecret("v1:bad",key));
});
test("time-window validation and one-time counter replay protection",()=>{
 const s=Buffer.alloc(20,7),at=1761150000000;
 const count=Math.floor(at/30000),code=totpCodeAt(s,count);
 assert.equal(verifyTotpCode(s,code,-1,at),count);
 assert.equal(verifyTotpCode(s,code,count,at),null);
 assert.equal(verifyTotpCode(s,code,-1,at+61000),null);
 assert.equal(verifyTotpCode(s,"abcdef",-1,at),null);
});
