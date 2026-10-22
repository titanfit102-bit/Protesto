/** Own-data view for test records; not a legal data portability completeness claim. */
const allowed=new Set(["id","title","status","created_at","public_reference"]);
export function ownCivicExport(records,ownerId){
 if(!Array.isArray(records)||typeof ownerId!=="string"||!ownerId)throw new TypeError("Records and authenticated owner required");
 const items=[];
 for(const x of records){
  if(!x||typeof x!=="object"||Array.isArray(x))throw new TypeError("Invalid record");
  if(x.owner_id!==ownerId)continue;
  const safe={};
  for(const k of allowed)if(Object.hasOwn(x,k)&&(["string","number"].includes(typeof x[k]))&&x[k]!==null)safe[k]=x[k];
  items.push(safe);
 }
 return {format:"own-civic-data-view/1",items,legalCompleteness:false};
}
