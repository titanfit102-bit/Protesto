import test from "node:test";
import assert from "node:assert/strict";
import {normalizeEmail,hashPassword,verifyPassword,verifyPasswordAsync,newSessionToken,tokenHash,parseSessionCookie,sessionCookie,clearSessionCookie,secureWrite,canReview} from "../src/server/security.mjs";
test("passwords use unique salt and reject bad credentials",()=>{
 const a=hashPassword("MySecretPassword!2026");
 const b=hashPassword("MySecretPassword!2026");
 assert.notEqual(a,b);
 assert.ok(verifyPassword("MySecretPassword!2026",a));
 assert.ok(!verifyPassword("WrongPassword2026!",a));
 assert.ok(!verifyPassword("MySecretPassword!2026","invalid"));
 assert.throws(()=>hashPassword("too-short"));
});
test("session tokens stay random and only the hash is stored",()=>{
 const a=newSessionToken(),b=newSessionToken();
 assert.equal(a.length,43);assert.notEqual(a,b);assert.notEqual(tokenHash(a),a);
 const cookie=sessionCookie(a,true);
 assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);assert.match(cookie,/Secure/);
 assert.equal(parseSessionCookie(cookie),a);
 assert.equal(parseSessionCookie("foo=bar"),"");
 assert.match(clearSessionCookie(),/Max-Age=0/);
});
test("CSRF controls require exact same origin and a custom request header",()=>{
 const origin="http://127.0.0.1:4174";
 assert.equal(secureWrite({headers:{origin,"x-protesto-request":"1"}},origin),true);
 assert.equal(secureWrite({headers:{origin:"https://evil.example","x-protesto-request":"1"}},origin),false);
 assert.equal(secureWrite({headers:{origin}},origin),false);
 assert.equal(secureWrite({headers:{origin,"x-protesto-request":"1","sec-fetch-site":"cross-site"}},origin),false);
});
test("identities are normalized and roles are limited",()=>{
 assert.equal(normalizeEmail("  Citizen@Example.ORG "),"citizen@example.org");
 assert.throws(()=>normalizeEmail("notanemail"));
 assert.equal(canReview("reporter"),false);
 assert.equal(canReview("reviewer"),true);
 assert.equal(canReview("admin"),true);
});
test("asynchronous scrypt matches existing hashes and fails closed for unknown accounts",async()=>{
 const correct="CompatiblePassphrase!2026";
 const stored=hashPassword(correct);
 const pending=verifyPasswordAsync(correct,stored);
 // Asynchronous verification leaves an opportunity for the event loop to run.
 let immediate=false;
 await new Promise(resolve=>setImmediate(()=>{immediate=true;resolve();}));
 assert.equal(immediate,true);
 assert.equal(await pending,true);
 assert.equal(await verifyPasswordAsync("InvalidPassword!2026",stored),false);
 assert.equal(await verifyPasswordAsync(correct,null),false,"unknown account uses dummy derivation");
 assert.equal(await verifyPasswordAsync(correct,"malformed"),false,"corrupt hash must fail closed");
 assert.equal(await verifyPasswordAsync("a".repeat(257),stored),false);
});
