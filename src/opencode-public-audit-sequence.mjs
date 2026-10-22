const TYPES=new Set(["published","corrected","withdrawn"]);
export function validatePublicAuditSequence(events){
 if(!Array.isArray(events))throw new TypeError("Events list required");
 const state=new Map(),issues=[];
 const normalized=events.map((e,i)=>{
  if(!e||typeof e.case_id!=="string"||!e.case_id||!TYPES.has(e.type)||typeof e.at!=="string"||!Number.isFinite(Date.parse(e.at))){issues.push({index:i,reason:"invalid_event"});return null;}
  return {case_id:e.case_id,type:e.type,at:new Date(e.at).toISOString(),index:i};
 }).filter(Boolean).sort((a,b)=>a.at.localeCompare(b.at)||a.index-b.index);
 for(const e of normalized){
  const previous=state.get(e.case_id)||"new";
  if(e.type==="published"&&previous!=="new")issues.push({index:e.index,reason:"duplicate_publication"});
  if(e.type==="corrected"&&previous!=="published")issues.push({index:e.index,reason:"correction_without_publication"});
  if(e.type==="withdrawn"&&previous!=="published")issues.push({index:e.index,reason:"repeated_or_unpublished_withdrawal"});
  if(e.type==="published"&&previous==="new")state.set(e.case_id,"published");
  if(e.type==="withdrawn"&&previous==="published")state.set(e.case_id,"withdrawn");
 }
 return {valid:issues.length===0,issues,checked:events.length,provesTruth:false};
}
