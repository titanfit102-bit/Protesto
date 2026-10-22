const STATES=new Set(["accepted","pending","rejected"]);
const TYPES=new Set(["document","official_record","public_notice","media_report"]);
export function summarizeSourceProvenance(rows){
 if(!Array.isArray(rows))throw new TypeError("Sources array required");
 const accepted=[],pending=[];
 for(const x of rows){
  if(!x||typeof x!=="object"||typeof x.id!=="string"||!x.id||!STATES.has(x.state)||!TYPES.has(x.source_type)||typeof x.title!=="string"||!x.title.trim()||x.title.length>180||typeof x.publisher!=="string"||!x.publisher.trim()||typeof x.reviewed_at!=="string"&&x.state==="accepted")throw new TypeError("Invalid provenance");
  const row={id:x.id,title:x.title.trim(),publisher:x.publisher.trim(),source_type:x.source_type,state:x.state};
  if(x.state==="accepted"){
   if(!Number.isFinite(Date.parse(x.reviewed_at)))throw new TypeError("Invalid review date");
   row.reviewed_at=new Date(x.reviewed_at).toISOString();
   accepted.push(row);
  }else if(x.state==="pending")pending.push({id:x.id,state:"pending"});
 }
 accepted.sort((a,b)=>a.id.localeCompare(b.id));pending.sort((a,b)=>a.id.localeCompare(b.id));
 return {accepted,pending,warning:"Etiketa e burimit nuk provon autenticitetin e tij."};
}
