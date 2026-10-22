const CASES=new Set(["published","archived","pending"]);
const CORRECTIONS=new Set(["pending","accepted","rejected"]);
export function correctionDecisionPolicy(input){
 if(!input||!CASES.has(input.case_state)||!CORRECTIONS.has(input.correction_state))throw new TypeError("Invalid case/correction state");
 const reasons=[];
 if(input.case_state!=="published")reasons.push("case_not_published");
 if(input.correction_state!=="pending")reasons.push("already_decided");
 if(typeof input.author_id!=="string"||typeof input.reviewer_id!=="string"||!input.reviewer_id||input.author_id===input.reviewer_id)reasons.push("independent_reviewer_required");
 return {mayReview:reasons.length===0,allowedDecisions:reasons.length?[]:["accepted","rejected"],reasons,automaticCaseChange:false};
}
