import test from "node:test";
import assert from "node:assert/strict";
import {sourceReviewAttestation,publicSourceItems} from "../src/server/source-publication.mjs";

const id="343f22aa-2de0-4d29-8a1b-fadfa30f0417";
const raw=()=>({id,state:"accepted",title:"PRIVATE address and name",
 url:"https://example.org/source?private=token",
 public_title:"Document already redacted",public_url:"https://example.org/source",
 created_at:new Date("2026-10-22T12:00:00Z"),
 context:"PRIVATE evidence",review_note:"PRIVATE reviewer",reviewed_by:"PRIVATE"});
const checks=()=>({sourceOpened:true,privacyReviewed:true,publicMetadataReviewed:true});
const metadata=()=>({title:"Document already redacted",url:"https://example.org/source"});

test("public source projection excludes original title, tokenized URL and private notes",()=>{
 const source=Object.freeze(raw()),result=publicSourceItems([source]);
 assert.deepEqual(result,[{id,title:"Document already redacted",url:"https://example.org/source",
  state:"accepted",created_at:"2026-10-22T12:00:00.000Z"}]);
 assert.ok(!JSON.stringify(result).includes("PRIVATE"));
 assert.ok(!JSON.stringify(result).includes("private=token"));
 assert.equal(source.title,"PRIVATE address and name");
});
test("legacy accepted and unsafe source metadata are withheld rather than leaked",()=>{
 for(const changed of [{public_title:null,public_url:null},{public_title:undefined},
  {public_url:"https://localhost/file"},{public_url:"https://example.org/file?secret=1"},
  {public_title:" "},{state:"pending"},{state:"rejected"},{created_at:"invalid"},{id:"bad-uuid"}]){
  assert.deepEqual(publicSourceItems([{...raw(),...changed}]),[],JSON.stringify(changed));
 }
 assert.deepEqual(publicSourceItems([]),[]);
 assert.throws(()=>publicSourceItems({}),TypeError);
});
test("source acceptance requires distinct safe public metadata and three checks",()=>{
 const note="Kontroll editorial sintetik i burimit dhe privatësisë së publikimit.";
 const approved=sourceReviewAttestation({decision:"accepted",note,checks:checks(),publicMetadata:metadata()});
 assert.equal(approved.valid,true);
 assert.equal(approved.publicTitle,metadata().title);
 assert.equal(approved.publicUrl,metadata().url);
 assert.match(approved.reviewNote,/SOURCE_CHECKS_V2:opened,privacy,public-metadata/);
 for(const key of Object.keys(checks())){
  assert.equal(sourceReviewAttestation({decision:"accepted",note,checks:{...checks(),[key]:false},
   publicMetadata:metadata()}).valid,false);
 }
 for(const changed of [{url:"https://example.org/file?private=1"},{url:"https://127.0.0.1/"},
  {title:"short"}]){
  assert.equal(sourceReviewAttestation({decision:"accepted",note,checks:checks(),
   publicMetadata:{...metadata(),...changed}}).valid,false);
 }
 assert.equal(sourceReviewAttestation({decision:"accepted",note,checks:checks()}).valid,false);
});
test("source rejection only needs a valid reviewer explanation",()=>{
 const note="Refuzim editorial sintetik për sigurinë dhe privatësinë e dosjes.";
 assert.deepEqual(sourceReviewAttestation({decision:"rejected",note}),{valid:true,reviewNote:note});
 assert.equal(sourceReviewAttestation({decision:"accepted",note:"short",checks:checks(),publicMetadata:metadata()}).valid,false);
});
