export function independentAppealGates(input){
 if(!input||typeof input!=="object"||Array.isArray(input))throw new TypeError("Appeal required");
 if(!["pending","accepted","rejected"].includes(input.state))throw new TypeError("Invalid appeal state");
 const reasons=[];
 if(input.state!=="pending")reasons.push("already_decided");
 if(input.reviewer_role!=="reviewer"&&input.reviewer_role!=="admin")reasons.push("role_required");
 if(typeof input.reviewer_id!=="string"||!input.reviewer_id||[input.appeal_author_id,input.case_author_id,input.first_reviewer_id].includes(input.reviewer_id))reasons.push("independent_second_reviewer_required");
 return {mayReview:reasons.length===0,reasons,automaticDecision:false};
}
