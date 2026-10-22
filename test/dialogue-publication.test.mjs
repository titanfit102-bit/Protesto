import test from "node:test";
import assert from "node:assert/strict";
import {reviewedTopicCopy,reviewedStatementCopy} from "../src/server/dialogue-publication.mjs";
const input=()=>({public:{title:"Tema e rishikuar për publikim",description:"Ky tekst është një kontekst sintetik i shqyrtuar për publikun."},
 checks:{privacyReviewed:true,publicCopyReviewed:true}});
test("topic requires explicit separate reviewed copy and both attestations",()=>{
 assert.deepEqual(reviewedTopicCopy(input()),input().public);
 for(const bad of [
  {...input(),checks:{privacyReviewed:false,publicCopyReviewed:true}},
  {...input(),checks:{privacyReviewed:true,publicCopyReviewed:false}},
  {...input(),public:{...input().public,title:"short"}},
  {...input(),public:{...input().public,description:"too short"}},
  {...input(),public:null},null
 ])assert.equal(reviewedTopicCopy(bad),null);
});
test("statement cannot be accepted without privacy acknowledgment and public text",()=>{
 const body="Deklarata publike e redaktuar për provën e privatësisë.";
 assert.equal(reviewedStatementCopy({privacyReviewed:true,publicBody:body}),body);
 for(const bad of [{publicBody:body},{privacyReviewed:false,publicBody:body},
  {privacyReviewed:true,publicBody:"short"},null])
  assert.equal(reviewedStatementCopy(bad),null);
});
