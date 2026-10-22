// Advisory policy for a human-reviewed correction. Only a DB transaction can
// enforce current case state; never use this function for automatic decisions.
const CASE_STATES = new Set(["pending", "published", "archived", "rejected"]);
const CORRECTION_STATES = new Set(["pending", "accepted", "rejected"]);

export function correctionDecisionPolicy(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      !CASE_STATES.has(input.case_state) || !CORRECTION_STATES.has(input.correction_state)) {
    throw new TypeError("Invalid case or correction state");
  }
  const reasons = [];
  if (input.case_state !== "published") reasons.push("case_not_published");
  if (input.correction_state !== "pending") reasons.push("already_decided");
  if (typeof input.author_id !== "string" || !input.author_id ||
      typeof input.reviewer_id !== "string" || !input.reviewer_id ||
      input.author_id === input.reviewer_id) {
    reasons.push("independent_reviewer_required");
  }
  return {
    mayReview:reasons.length === 0,
    allowedDecisions:reasons.length === 0 ? ["accepted", "rejected"] : [],
    reasons,
    automaticCaseChange:false
  };
}
