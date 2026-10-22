function parseDate(value){
 if(typeof value!=="string"||! /^\d{4}-\d{2}-\d{2}$/.test(value))throw new TypeError("YYYY-MM-DD required");
 const d=new Date(value+"T00:00:00.000Z");
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)throw new RangeError("Invalid calendar date");
 return d;
}
export function addInstitutionWorkingDays(startDate,count,closureDates=[]){
 const d=parseDate(startDate);
 if(!Number.isInteger(count)||count<0||count>3650)throw new RangeError("Invalid working-day count");
 if(!Array.isArray(closureDates))throw new TypeError("Closure dates array required");
 const closed=new Set(closureDates.map(x=>parseDate(x).toISOString().slice(0,10)));
 let left=count;
 while(left>0){
  d.setUTCDate(d.getUTCDate()+1);
  const day=d.getUTCDay(),iso=d.toISOString().slice(0,10);
  if(day!==0&&day!==6&&!closed.has(iso))left--;
 }
 return {date:d.toISOString().slice(0,10),kind:"configurable_followup_not_legal_deadline"};
}
