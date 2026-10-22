import test from "node:test";
import assert from "node:assert/strict";
import {publicCopyDecision} from "../src/server/publication-privacy.mjs";
const payload=()=>({checks:{publicCopyReviewed:true},public:{title:"Titull publik sintetik",description:"Tekst publik sintetik për demonstrim pa të dhëna private.",sourceUrl:"https://example.org/source"}});
test("requires independently reviewed public content",()=>{
 assert.deepEqual(publicCopyDecision(payload()),payload().public);
 for(const x of [{...payload(),checks:{}},{...payload(),public:{...payload().public,sourceUrl:"https://example.org/source?token=secret"}},{...payload(),public:{...payload().public,sourceUrl:"https://example.org/source#person"}},{...payload(),public:{...payload().public,description:"too short"}},null]){
  assert.equal(publicCopyDecision(x),null);
 }
});
