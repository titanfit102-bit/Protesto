const STATUSES=new Set(["draft","submitted","acknowledged","answered","disputed","closed"]);
export function institutionPublicSummary(records){
 if(!Array.isArray(records))throw new TypeError("Records array expected");
 const out=[];
 for(const x of records){
  if(!x||typeof x!=="object"||!STATUSES.has(x.status)||typeof x.public_request_id!=="string"||!x.public_request_id||typeof x.institution_label!=="string"||!x.institution_label.trim()||typeof x.last_public_update!=="string"||!Number.isFinite(Date.parse(x.last_public_update)))throw new TypeError("Invalid public response record");
  out.push({
   public_request_id:x.public_request_id,
   institution_label:x.institution_label.trim(),
   status:x.status,
   last_public_update:new Date(x.last_public_update).toISOString(),
   evidence_reference:typeof x.evidence_reference==="string"?x.evidence_reference.slice(0,160):""
  });
 }
 return out.sort((a,b)=>b.last_public_update.localeCompare(a.last_public_update)||a.public_request_id.localeCompare(b.public_request_id));
}
