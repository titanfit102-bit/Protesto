# PROTESTO — SECURITY, PRIVACY AND EDITORIAL REVIEW

## Nonpartisan guarantees
Apply identical moderation and evidence rules to material concerning any party or public authority. Prohibit threatening content, violence, doxxing, voter profiling and non-consensual publication of private political beliefs. The project is not a covert mobilization or persuasion engine.

## Threat model and controls
| Threat | Current defense | Still needed before public release |
|---|---|---|
| Unauthenticated publishing | Every report is pending; roles and separated review | Independent editorial procedures |
| Account compromise | scrypt passwords; 8-hour HttpOnly sessions | MFA, recovery, device/session revocation |
| CSRF | exact-origin POST and custom header; SameSite cookie | Reverse-proxy security testing |
| SQL injection | Parameterized PostgreSQL statements | Review all future query code |
| Stored XSS | Client escapes user content | Browser E2E, CSP regression review |
| Harassment/doxxing | No automatic publication | Moderation, redaction, appeals and reporting |
| Credential stuffing | Basic IP throttle | Central rate limit, lockout/alert policy |
| Reviewer conflicts | Cannot approve own case | Conflict-of-interest policy and two-person review for high-risk claims |
| False documentation | Reviewer note and review history | Source provenance, correction history, right to reply |
| Data loss | No public data in prototype | Encrypted backup with restore proof |
| Data overcollection | No participation/attendance lists | DPO and privacy review for any new data |

## Publication policy — must be implemented operationally
1. Separate *reported allegation* from *established fact*.
2. Check cited sources and context before publication.
3. Remove unnecessary sensitive personal identifiers.
4. Offer an appropriate and documented opportunity for institutional response.
5. Record publication rationale, timestamps and reviewer identity.
6. Allow corrections, withdrawal and appeals with public history when appropriate.
7. Escalate threats, urgent safety hazards and potentially unlawful content to qualified staff.

At present the software technically supports **only** a pending → published/rejected decision with an internal review note. It does not enforce the full policy above. In particular, do not treat publication as safe based on software checks alone.

## Data protection
Before processing live political or highly sensitive user information, complete data inventory, lawful-basis analysis, notices and retention rules, cross-border transfer assessment (where applicable), data-subject request process, and DPIA if required. Consult competent local counsel. Do not use real whistleblower reports in this system; that requires a separate audited channel.

## Test artifacts
\`test/domain.test.mjs\` covers form validation and filtering.
\`test/security.test.mjs\` checks password hashing, session cookies, origins and role logic.
\`test/pilot.integration.test.mjs\` exercises PostgreSQL reporting, cross-origin defenses, publishing workflow, audit and logout. Passing CI does not replace external security review.

## Atomic abuse defenses and session revocation — development tranche
Case creation uses a shared PostgreSQL quota keyed with HMAC for 10 attempts/hour/user, replacing a race-prone count check. Authenticated users can explicitly invalidate **all** their sessions at `POST /api/me/sessions/revoke-all` (same-origin anti-CSRF required). This intentionally includes the current device, clears the cookie and returns a count. These controls reduce simple automation and provide containment; they do not replace IP reputation, trusted account recovery, MFA enrollment policy or external security assessment.

## Public URL and browser containment gate
Public external URLs now reject query/fragment tokens, userinfo, local hosts and known private IP destinations; accepted internal source links remain privately reviewable. This is **not** a complete phishing URL scanner, DNS-rebinding defense or a proof of source authenticity. The pilot API refuses to expose accepted sources for legacy published cases missing an approved public title, and returns only redacted public copy. COOP/CORP and form-action CSP were added. Automated accessibility checks now detect broken ARIA labelling references, but WCAG and manual assistive-technology audits remain OPEN.
