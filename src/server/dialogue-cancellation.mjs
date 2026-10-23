import {randomUUID} from "node:crypto";

// The caller MUST already hold an UPDATE/SELECT FOR UPDATE lock on the parent
// civic_cases row within the SAME transaction, after validating archive rights.
// Taking the parent lock first serializes vote/close/archive transitions.
export async function cancelOpenDialogueTopics(client,{caseId,actorId}){
 const locked=await client.query(
  "SELECT id FROM dialogue_topics WHERE case_id=$1 AND state='open' ORDER BY id FOR UPDATE",
  [caseId]
 );
 const ids=locked.rows.map(row=>row.id);
 if(!ids.length)return {cancelled:0,votesDeleted:0};
 // Explicit cancellation is distinct from a normal, aggregate-producing close.
 const changed=await client.query(
  "UPDATE dialogue_topics SET state='cancelled',cancelled_at=now(),cancelled_by=$2 WHERE case_id=$1 AND state='open' AND id=ANY($3::uuid[]) RETURNING id",
  [caseId,actorId,ids]
 );
 if(changed.rowCount!==ids.length)throw Error("Dialogue cancellation changed unexpectedly.");
 // No new totals are produced. Already finalized, closed-topic aggregates stay
 // internal under the approved interim synthetic retention policy.
 const removed=await client.query(
  "DELETE FROM dialogue_votes WHERE statement_id IN (SELECT id FROM dialogue_statements WHERE topic_id=ANY($1::uuid[]))",
  [ids]
 );
 for(const id of ids){
  await client.query(
   "INSERT INTO audit_entries(id,actor_id,action,object_type,object_id) VALUES($1,$2,'dialogue.topic.cancelled','dialogue_topic',$3)",
   [randomUUID(),actorId,id]
  );
 }
 return {cancelled:ids.length,votesDeleted:removed.rowCount};
}
