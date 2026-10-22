function time(t){
 if(typeof t!=="string"||! /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(t))throw new TypeError("Explicit UTC instant required");
 const n=Date.parse(t);
 if(!Number.isFinite(n)||new Date(n).toISOString()!==t.replace(/Z$/,(t.includes(".")?"Z":".000Z")))throw new RangeError("Invalid calendar instant");
 return n;
}
export function peacefulEventWindow({starts_at,ends_at,max_minutes=720}={}){
 const start=time(starts_at),end=time(ends_at);
 if(!Number.isSafeInteger(max_minutes)||max_minutes<1||max_minutes>10080)throw new RangeError("Invalid configurable maximum");
 const length=(end-start)/60000;
 const reasons=[];
 if(length<=0)reasons.push("end_must_follow_start");
 else if(length>max_minutes)reasons.push("exceeds_configured_duration");
 return {valid:reasons.length===0,duration_minutes:length,reasons,attendanceTracked:false,legalAuthorization:false};
}
