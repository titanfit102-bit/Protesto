// CI is evidence for scoped flows, not legal or human authorization to launch.
const EXTERNAL_P0=Object.freeze([
 "independent-security-audit",
 "privacy-legal-review-and-DPIA",
 "verified-editorial-governance-and-institution-identity",
 "account-recovery-and-MFA-enrollment",
 "hosted-staging-acceptance",
 "operational-offsite-backup-monitoring",
 "incident-owner-and-response-drills",
 "explicit-owner-production-approval"
]);
export function evaluateReadiness({ciPassed=false,manualEvidence={}}={}){
 const open=EXTERNAL_P0.filter(x=>manualEvidence[x]!==true);
 // This build intentionally cannot authorize production via a CLI flag.
 // Future release process requires owner-approved separate code/design review.
 return {
  technicalCandidate:ciPassed===true,
  releaseAllowed:false,
  openCriticalGates:open,
  authorizationRequired:true,
  message:"Production blocked. Human evidence and explicit authorized release procedure remain mandatory."
 };
}
export const requiredExternalGates=()=>[...EXTERNAL_P0];
