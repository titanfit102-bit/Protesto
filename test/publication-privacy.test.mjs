import test from "node:test";
import assert from "node:assert/strict";
import {publicCopyDecision} from "../src/server/publication-privacy.mjs";
const payload=()=>({checks:{publicCopyReviewed:true},public:{title:"Titull publik sintetik",description:"Tekst publik sintetik për demonstrim pa të dhëna private.",area:"Bashkia e testit",sourceUrl:"https://example.org/source"}});
test("requires independently reviewed public content",()=>{
 assert.deepEqual(publicCopyDecision(payload()),payload().public);
 for(const x of [{...payload(),public:{...payload().public,sourceUrl:"https://127.0.0.1/private"}},{...payload(),checks:{}},{...payload(),public:{...payload().public,sourceUrl:"https://example.org/source?token=secret"}},{...payload(),public:{...payload().public,sourceUrl:"https://example.org/source#person"}},{...payload(),public:{...payload().public,description:"too short"}},{...payload(),public:{...payload().public,area:""}},null]){
  assert.equal(publicCopyDecision(x),null);
 }
});
