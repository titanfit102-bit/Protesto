const TYPES=new Set(["published","archived"]);
export function publicLedgerView(rows){
 if(!Array.isArray(rows))throw new TypeError("List expected");
 const seen=new Set(),out=[];
 for(const e of rows){
  if(!e||typeof e!=="object"||Array.isArray(e)||typeof e.case_id!=="string"||!/^[a-z0-9-]{3,64}$/i.test(e.case_id)||!TYPES.has(e.event_type)||typeof e.created_at!=="string"||!Number.isFinite(Date.parse(e.created_at)))throw new TypeError("Invalid public event");
  const at=new Date(e.created_at).toISOString();
  const key=[e.case_id,e.event_type,at].join("|");
  if(seen.has(key))continue;
  seen.add(key);out.push({case_id:e.case_id,event_type:e.event_type,created_at:at});
 }
 return out.sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.case_id.localeCompare(b.case_id)||a.event_type.localeCompare(b.event_type));
}
