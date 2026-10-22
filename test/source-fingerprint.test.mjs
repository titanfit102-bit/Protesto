import test from "node:test";
import assert from "node:assert/strict";
import {MAX_FINGERPRINT_BYTES,validateSourceFingerprint,privateFingerprintRecord} from "../src/server/source-fingerprint.mjs";

const good=()=>({
 sha256:"a".repeat(64),byteLength:128,mediaType:"application/pdf",
 acknowledgedCorrespondence:true,acknowledgedPrivacy:true
});
test("only constrained PDF SHA-256 declarations pass validation",()=>{
 assert.deepEqual(validateSourceFingerprint(good()),{sha256_hex:"a".repeat(64),byte_length:128,media_type:"application/pdf"});
 for(const altered of [
  {sha256:"A".repeat(64)},{sha256:"0".repeat(63)},
  {byteLength:4},{byteLength:MAX_FINGERPRINT_BYTES+1},{byteLength:128.5},
  {mediaType:"image/jpeg"},{acknowledgedCorrespondence:false},{acknowledgedPrivacy:false}
 ])assert.equal(validateSourceFingerprint({...good(),...altered}),null);
 assert.equal(validateSourceFingerprint(null),null);
 assert.equal(validateSourceFingerprint([]),null);
});
test("private digest rendering strips reviewer identity and all hidden data",()=>{
 const row={sha256_hex:"b".repeat(64),byte_length:504,media_type:"application/pdf",
  created_at:new Date("2026-10-22T12:00:00Z"),reviewed_by:"PRIVATE",source_url:"PRIVATE",context:"PRIVATE"};
 const result=privateFingerprintRecord(Object.freeze(row));
 assert.deepEqual(Object.keys(result),["sha256","byteLength","mediaType","declaredAt","status"]);
 assert.ok(!JSON.stringify(result).includes("PRIVATE"));
 assert.equal(result.status,"reviewer-declared-not-independently-verified");
 assert.equal(privateFingerprintRecord(null),null);
 assert.throws(()=>privateFingerprintRecord({...row,byte_length:-1}),TypeError);
});
