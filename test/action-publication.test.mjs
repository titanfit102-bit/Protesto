import test from "node:test";
import assert from "node:assert/strict";
import {reviewedActionCopy} from "../src/server/action-publication.mjs";
const raw=()=>({checks:{privacyReviewed:true,publicCopyReviewed:true},public:{
 title:"Nismë publike sintetike",
 description:"Përshkrim publik për testimin editorial të nismës.",
 area:"Zona publike"
}});
test("only explicit reviewed action copy is accepted",()=>{
 assert.deepEqual(reviewedActionCopy(raw()),raw().public);
 for(const changed of [
  {checks:{privacyReviewed:false,publicCopyReviewed:true}},{checks:{privacyReviewed:true,publicCopyReviewed:false}},
  {public:{...raw().public,title:"short"}},{public:{...raw().public,description:"brief"}},
  {public:{...raw().public,area:""}}, {public:null}
 ]){
  assert.equal(reviewedActionCopy({...raw(),...changed}),null);
 }
 assert.equal(reviewedActionCopy(null),null);
});
