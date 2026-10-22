# Protesto — Staging rehearsal (offline and disposable only)

This work adds an automated **CI-based rehearsal**, not a hosted staging website. The guard refuses non-loopback PostgreSQL, a non-test database name or public application origin, and requires explicit rehearsal and GitHub Actions flags. This is a defense-in-depth guard, not a sandbox or substitute for network isolation.

Automated tests cover Node, PostgreSQL migrations, browser flows, dependency audit and encrypted restore using synthetic data. The offline demo is additionally inspected at 320×568, 360×780, 390×844, 768×1024 and desktop. Screenshot artifacts are retained for 14 days in GitHub Actions. The actual authenticated app also requires manual assistive-technology and workflow review; static demo screenshots are not full mobile verification.

**Not done:** live Staging environment provision/deployment, data-retention/legal policy, MFA enrollment/recovery, pen test, real incident response, monitored backups, owner-approved public release. These must not be implied by a passing CI run. Production remains forbidden until explicit approval.
