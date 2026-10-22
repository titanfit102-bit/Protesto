import test from "node:test";
import assert from "node:assert/strict";
import {sourceReviewAttestation,publicSourceItems} from "../src/server/source-publication.mjs";

const sourceId="343f22aa-2de0-4d29-8a1b-fadfa30f0417";
const source=()=>({id:sourceId,title:"Dokument publik sintetik",url:"https://example.org/evidence",
 state:"accepted",created_at:new Date("2026-10-22T12:00:00.000Z"),
 context:"PRIVATE case narrative",submitted_by:"PRIVATE",reviewed_by:"PRIVATE",
 review_note:"PRIVATE",reviewed_at:new Date("2026-10-22T13:00:00Z")});
const checks=()=>({sourceOpened:true,privacyReviewed:true,publicMetadataReviewed:true});

test("public projection preserves useful source link but strips sensitive case context",()=>{
 const raw=Object.freeze(source());
 const out=publicSourceItems([raw]);
 assert.deepEqual(Object.keys(out[0]),["id","title","url","state","created_at"]);
 assert.equal(out[0].url,"https://example.org/evidence");
 assert.equal(out[0].created_at,"2026-10-22T12:00:00.000Z");
 assert.ok(!JSON.stringify(out).includes("PRIVATE"));
 assert.equal(raw.context,"PRIVATE case narrative");
});

test("pending/rejected sources and malformed URLs cannot enter public projection",()=>{
 for(const raw of [
  {...source(),state:"pending"}, {...source(),state:"rejected"},
  {...source(),url:"http://example.org/file"}, {...source(),url:"https://name:secret@example.org/"},
  {...source(),title:" "}, {...source(),created_at:"not a date"}, {...source(),id:"not-uuid"}
 ])assert.throws(()=>publicSourceItems([raw]));
 assert.throws(()=>publicSourceItems("not-array"));
 assert.deepEqual(publicSourceItems([]),[]);
});

test("acceptance requires three independent human confirmations and persists the attestation",()=>{
 const note="Kontroll editorial sintetik i lidhjes dhe të dhënave publike.";
 const accepted=sourceReviewAttestation({decision:"accepted",note,checks:checks()});
 assert.equal(accepted.valid,true);
 assert.match(accepted.reviewNote,/SOURCE_CHECKS_V1:opened,privacy,public-metadata/);
 for(const key of Object.keys(checks())){
  assert.equal(sourceReviewAttestation({decision:"accepted",note,checks:{...checks(),[key]:false}}).valid,false);
 }
 assert.equal(sourceReviewAttestation({decision:"accepted",note}).valid,false);
 assert.equal(sourceReviewAttestation({decision:"accepted",note,checks:checks(),extra:true}).valid,true);
});

test("review length and rejection policy prevent silent truncation or forced acceptance",()=>{
 const note="Refuzim editorial sintetik sepse burimi nuk është i përshtatshëm.";
 assert.deepEqual(sourceReviewAttestation({decision:"rejected",note}),{valid:true,reviewNote:note});
 assert.equal(sourceReviewAttestation({decision:"accepted",note:"x".repeat(1000),checks:checks()}).valid,false);
 assert.equal(sourceReviewAttestation({decision:"accepted",note:"short",checks:checks()}).valid,false);
 assert.equal(sourceReviewAttestation({decision:"unknown",note,checks:checks()}).valid,false);
});
