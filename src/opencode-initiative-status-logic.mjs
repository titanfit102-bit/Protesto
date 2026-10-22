const NEXT={draft:["under-review"],"under-review":["published","archived"],published:["completed","archived"],completed:["archived"],archived:[]};
export function initiativeStatusLogic({from,to,author_id,reviewer_id,reviewAcknowledged=false}={}){
 if(!Object.hasOwn(NEXT,from)||!Object.hasOwn(NEXT,to))throw new TypeError("Unknown initiative state");
 const reasons=[];
 if(!NEXT[from].includes(to))reasons.push("invalid_transition");
 if(to==="published"&&(!reviewAcknowledged||typeof reviewer_id!=="string"||!reviewer_id||author_id===reviewer_id))reasons.push("independent_review_required");
 return {allowed:reasons.length===0,reasons,nextStates:[...NEXT[from]],automaticPublish:false,attendeesTracked:false};
}
