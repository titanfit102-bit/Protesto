function iso(t){if(typeof t!=="string"||!Number.isFinite(Date.parse(t)))throw new TypeError("Valid ISO instant required");const d=new Date(t);if(d.toISOString()!==t.replace(/\+00:00$/,"Z"))throw new TypeError("UTC ISO time required");return d.getTime();}
export function evaluateCaseRetention(record,policy){
 if(!record||!policy||!["pending","published","archived","retracted"].includes(record.state))throw new TypeError("Invalid retention input");
 const created=iso(record.created_at),now=iso(policy.as_of);
 if(now<created)throw new RangeError("Evaluation predates record");
 if(!Number.isInteger(policy.retention_days)||policy.retention_days<0||policy.retention_days>36500)throw new RangeError("Invalid proposed retention");
 const ageDays=(now-created)/86400000;
 const reasons=[];
 if(["archived","retracted"].includes(record.state))reasons.push("human_privacy_review_required");
 const expired=ageDays>=policy.retention_days;
 return {action:reasons.length?"review":expired?"eligible_for_deletion":"retain",expired,age_days:Math.floor(ageDays),reasons,automaticDeletion:false,legalConclusion:false};
}
