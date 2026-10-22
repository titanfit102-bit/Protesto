// Call inside a transaction; write the record before COMMIT.
export async function lockAuthorQuota(client,scope,userId){
 if(!["action-create","appeal-create","dialogue-topic-create"].includes(scope)||
    typeof userId!=="string"||!userId)throw new TypeError("Invalid author quota");
 await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))",
  ["protesto-author-quota:"+scope+":"+userId]);
}
