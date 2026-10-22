import test from "node:test";
import assert from "node:assert/strict";
import {MIN_PUBLIC_DIALOGUE_PARTICIPANTS, publicDialogueReportItems, roundedDialogueShares} from "../src/server/dialogue-report.mjs";

const topic_id = "343f22aa-2de0-4d29-8a1b-fadfa30f0417";
const statement_id = "f34f22aa-2de0-4d29-8a1b-fadfa30f0418";
const case_id = "f34f22aa-2de0-4d29-8a1b-fadfa30f0419";
const row = () => ({
 topic_id, statement_id, case_id, topic_title:"Diskutim sintetik",
 statement:"Publikimi i raporteve për qytetin përmirëson transparencën.",
 case_title:"Dosje testuese", closed_at:new Date("2026-10-22T11:00:00.000Z"),
 source_url:"https://example.org/sintetike",
 participants:11, agree_count:7, disagree_count:3, pass_count:1
});

test("rounded public shares are deterministic and always total 100",()=>{
 const result=roundedDialogueShares(row());
 assert.deepEqual(result,{agree_percent:64,disagree_percent:27,pass_percent:9});
 assert.deepEqual(roundedDialogueShares({participants:12,agree_count:4,disagree_count:4,pass_count:4}),{
  agree_percent:34,disagree_percent:33,pass_percent:33
 });
 assert.equal(Object.values(roundedDialogueShares({participants:10,agree_count:0,disagree_count:0,pass_count:10})).reduce((a,b)=>a+b),100);
 assert.equal(MIN_PUBLIC_DIALOGUE_PARTICIPANTS,10);
});

test("report keeps public context but drops every private or unknown field",()=>{
 const raw={...row(),email:"private@example.org",voter_key:"private",author_id:"private",review_note:"private",individual_votes:["private"]};
 const copy={...raw};
 const result=publicDialogueReportItems([Object.freeze(raw)]);
 assert.equal(result.length,1);
 assert.deepEqual(Object.keys(result[0]),[
  "topic_id","case_id","topic_title","statement_id","statement",
  "participants","agree_count","disagree_count","pass_count",
  "agree_percent","disagree_percent","pass_percent","closed_at","case_title","source_url"
 ]);
 assert.equal(result[0].topic_id,topic_id);
 assert.equal(result[0].statement_id,statement_id);
 assert.equal(result[0].source_url,"https://example.org/sintetike");
 assert.equal(result[0].closed_at,"2026-10-22T11:00:00.000Z");
 assert.ok(!JSON.stringify(result).includes("private"));
 assert.deepEqual(raw,copy);
});

test("small aggregates are suppressed and malformed totals never published",()=>{
 assert.deepEqual(publicDialogueReportItems([{...row(),participants:9,agree_count:5,disagree_count:3,pass_count:1}]),[]);
 for(const bad of [
  {...row(),participants:12},{...row(),agree_count:-1},
  {...row(),agree_count:0.5},{...row(),pass_count:Infinity},
  {...row(),participants:"11"},{...row(),statement_id:"bad-id"},
  {...row(),closed_at:null}
 ]) assert.throws(()=>publicDialogueReportItems([bad]));
 assert.throws(()=>publicDialogueReportItems("bad"));
 assert.throws(()=>roundedDialogueShares({participants:9,agree_count:5,disagree_count:3,pass_count:1}));
});

test("unsafe links are removed and output order is stable",()=>{
 const first={...row(),source_url:"https://private:pass@example.org/"};
 const second={...row(),statement_id:"343f22aa-2de0-4d29-8a1b-fadfa30f0416",source_url:"javascript:alert(1)"};
 const out=publicDialogueReportItems([first,second]);
 assert.deepEqual(out.map(x=>x.statement_id),[first.statement_id,second.statement_id]);
 assert.equal(out[0].source_url,null);assert.equal(out[1].source_url,null);
});
