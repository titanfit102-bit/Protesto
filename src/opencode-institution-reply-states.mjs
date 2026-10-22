const NEXT=Object.freeze({
 draft:["submitted"],submitted:["acknowledged","answered"],acknowledged:["answered"],answered:["disputed","closed"],disputed:["answered","closed"],closed:[]
});
export function institutionReplyTransition(from,to,{humanApproved=false}={}){
 if(!Object.hasOwn(NEXT,from)||!Object.hasOwn(NEXT,to))throw new TypeError("Unknown response state");
 const allowed=NEXT[from].includes(to);
 const reasons=[];
 if(!allowed)reasons.push("transition_not_permitted");
 if(!humanApproved)reasons.push("human_review_required");
 return {allowed:reasons.length===0,reasons,nextStates:[...NEXT[from]],automaticallySubmitted:false,legalDeadline:undefined};
}
export function institutionReplyNextStates(state){
 if(!Object.hasOwn(NEXT,state))throw new TypeError("Unknown state");
 return [...NEXT[state]];
}
