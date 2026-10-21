# Protesto

A privacy-first civic accountability **browser prototype**, with Albanian UI, clearly fictional examples and zero runtime dependencies.

## Start

Requires Node.js 20 or newer.

```bash
npm run dev
# open http://127.0.0.1:4173
npm run verify
```

## Features in this branch

- Dashboard with **fictional** cases, counts and descriptions.
- Cases with category/status filters and search.
- New cases, initiatives and peaceful gatherings through validated forms.
- Local browser-only persistence; JSON backup export and reset.
- HTML escaping on user-provided text and HTTPS-only evidence links.
- Responsive layout, keyboard focus indicators and no attendee tracking.
- Automated unit tests for domain logic, validation and fallback recovery.

## Not yet available

This is **not** a production-ready platform. No real civic allegations have been verified or published. There is no shared database, public login, content moderation, legal review, petition signature verification, official notification, real AI investigation, map or backoffice. Browser data can disappear if local storage is cleared, so export before clearing it.

**Privacy caution:** Don't enter sensitive details, addresses of private people or political preferences. None of the prototype data is transmitted by the application.

## Design principles

Nonpartisan accountability, lawful and peaceful civic engagement, traceable sources, right of reply, limited personal data, and no political microtargeting.

## Structure

```text
index.html                 App shell
styles.css                 Responsive visual system
src/app.mjs                UI, routing, forms, local persistence
src/domain.mjs             Rules, sanitization, filters
src/seed.mjs               Fictional demonstration records
test/domain.test.mjs       Unit tests
tools/dev-server.mjs       Local development server
tools/check.mjs            Static shape checks
docs/MASTER_BLUEPRINT.md   Product scope and release gates
docs/DECISION_LOG.md       Technical decision history
```

## Next release gates

1. Real browser/E2E and accessibility tests.
2. PostgreSQL, role based access and moderation queue.
3. Evidence storage, citation trails and institutional right of reply.
4. Security audit and legal/privacy evaluation.
5. Private pilot before any public release.

Repository policy: develop on branches and PRs; never merge into main or deploy publicly without explicit owner approval.
