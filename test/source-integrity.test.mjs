import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto,createHash} from "node:crypto";
import {hashLocalPdf,comparePdfWithDeclaration} from "../src/source-integrity.mjs";
const b=new TextEncoder().encode("%PDF-1.5\nsynthetic bytes").buffer;
test("local digest and comparison do not require server or source URL",async()=>{
 const sha=createHash("sha256").update(new Uint8Array(b)).digest("hex");
 assert.equal(await hashLocalPdf(b,webcrypto.subtle),sha);
 assert.equal((await comparePdfWithDeclaration(b,{sha256:sha},webcrypto.subtle)).matches,true);
 assert.equal((await comparePdfWithDeclaration(b,{sha256:"0".repeat(64)},webcrypto.subtle)).matches,false);
});
test("wrong format and invalid declarations fail closed",async()=>{
 await assert.rejects(hashLocalPdf(new TextEncoder().encode("not a pdf").buffer,webcrypto.subtle));
 await assert.rejects(comparePdfWithDeclaration(b,{sha256:"invalid"},webcrypto.subtle));
});
