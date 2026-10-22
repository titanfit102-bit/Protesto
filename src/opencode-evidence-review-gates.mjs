/** Advisory only: a human must verify sources and independently decide publication. */
export function evidenceReviewGates(input){
 if(!input||typeof input!=="object"||Array.isArray(input))throw new TypeError("Case required");
 const reasons=[];
 if(typeof input.author_id!=="string"||typeof input.reviewer_id!=="string"||!input.author_id||!input.reviewer_id||input.author_id===input.reviewer_id)reasons.push("independent_reviewer_required");
 if(!Array.isArray(input.sources)||!input.sources.some(s=>s&&s.state==="accepted"&&s.source_type==="documentary"))reasons.push("accepted_documentary_source_required");
 for(const k of ["source_checked","privacy_checked","reply_checked"])if(input[k]!==true)reasons.push(k+"_required");
 return {eligible:reasons.length===0,reasons,requiresHumanDecision:true,verifiedTruth:false};
}
