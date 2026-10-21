# Protesto — Appeals and shared abuse controls

## Appeals as implemented (private pilot only)

An authenticated user who submitted a **rejected correction** of a currently published case may file one appeal. The API never exposes that appeal publicly.

State transitions: `rejected correction → pending appeal → accepted / rejected appeal`.

A reviewer may not decide the appeal when that reviewer is the appeal author, original correction reviewer or author of the affected case. A reviewer must give a rationale of 25–1000 characters. Acceptance archives the case and creates a retraction and audit entry in the same PostgreSQL transaction, while preserving the original correction rejection. Rejection leaves the public case unchanged. No self-approval, duplicate appeal or repeated decision is permitted. This does **not** constitute a verified legal right-to-reply service; no formal notice, SLA or external ombudsman exists.

API: `POST /api/appeals`, `GET /api/appeals/mine`, `GET /api/appeals/queue`, `POST /api/appeals/review/:id`. POST requests require authentication, exact-origin protection, reviewer role for decisions, and validation of case history.

## Abuse protection as implemented

PostgreSQL table `request_rate_limits` stores HMAC identity tokens (not raw IP or email), an integer attempt count and expiry. Atomic upserts provide a shared time-window limit across server instances. Login per socket IP: 12 attempts per 15 minutes. Login per normalized email: 15 attempts per 15 minutes. Authenticated write requests: 120 per 60 minutes. Denials return HTTP 429 plus Retry-After.

A stable 32+ character `PROTESTO_RATE_LIMIT_SECRET` is mandatory to launch the private pilot. The same secret is required across all nodes; keep it out of GitHub and all logs. The CI string is synthetic and is **not** for production.

## Open production gates

- Not a substitute for network-layer WAF, DDoS controls, spam/content moderation or behavior-based abuse detection.
- Socket-level address behind a reverse proxy may identify the proxy rather than the true user. Do not trust unverified forwarding headers; configure a trusted gateway before deployment.
- A malicious party can intentionally exhaust an account quota. Define support, recovery, appeals and lockout fairness rules.
- Expired rate-limit rows must be pruned by a scheduled, reviewed database retention job before production.
- Formal editorial appeal handling, dispute deadlines, notifications, evidence authenticity and review independence need documented human governance.
- A successful CI test is not proof of live reliability or compliance.
