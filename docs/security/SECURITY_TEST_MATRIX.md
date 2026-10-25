# Protesto — SECURITY_TEST_MATRIX

**Baseline i testuar:** `8f46a94ecc8fb8e3b5e860c6656f07dea15ef661` — [CI #40089967166](https://github.com/titanfit102-bit/Protesto/actions/runs/40089967166): `verify` SUCCESS, **75 PASS/0 FAIL/0 SKIP** Node/PostgreSQL; npm audit 0 vulnerabilitete në atë ekzekutim; migrime dy herë; Chromium E2E, contrast dhe dialogu; restore sintetik F09 me 20 tabela; `releaseAllowed:false`. Testet **nuk** u riekzekutuan për këto dokumente. `docs/security` është vetëm dokumentacion në degën e izoluar dhe nuk është integruar me degën e kodit apo me CI.

**Sistemi i provave:** Çdo rast ka ID të qëndrueshme, `status`, komandë/skemë, test pozitiv & negativ, commit/CI. `VERIFIED` = sjellje sintetikisht e testuar në kodin e referuar; `PARTIAL` = shtrirje e kufizuar; `FAILED` = gate joefektiv sipas provës; `UNKNOWN` = s'ka provë; `NOT APPLICABLE` vetëm për rrugë jashtë scope-it aktual. Statusi i release-it është gjithmonë [RELEASE_GATES](../RELEASE_GATES.md), jo kjo tabelë.

## Matrica e kontrollit

| Test ID / link rreziku | Invarianti dhe provë ekzistuese | Status në baseline | Shtesa / negative acceptance |
|---|---|---|---|
| ST-01 / SEC-009 | Login, passwords/scrypt, cookie security, CSRF: `test/security.test.mjs`, `test/async-auth.integration.test.mjs` | VERIFIED sintetik | Timing/load, account disabled/rotated, malformed hash, guessing dhe CSRF proxy boundary |
| ST-02 / SEC-002 | TOTP AES-GCM/replay, session atomicity: `test/totp.test.mjs`, auth integration | PARTIAL | Enforce mandatory MFA për recensues, pajisje të humbur/recovery, role escalation/rotation |
| ST-03 / SEC-008 | Server RBAC owner/reviewer/admin, anonymous, archive/legacy: `test/role-boundary-matrix.integration.test.mjs` | VERIFIED sintetik | Të gjitha rrugët e reja dhe metodologjitë; conflict-Of-interest, 401/403, ownership switch |
| ST-04 / SEC-008 | Logout, revoke-all, UI state isolation: `test/session-revocation.integration.test.mjs`, `test/browser.e2e.mjs` | VERIFIED për rrugët e përfshira | Stale async A→B, 401/503 mid-transition, çdo modul privat dhe e2e e plotë |
| ST-05 / SEC-003 | Public only reviewed copy, source/link allowlists: `test/public-source-eligibility.integration.test.mjs`, `test/source-publication.test.mjs`, `test/public-read-snapshot.integration.test.mjs` | VERIFIED sintetik për rrugët e testuara | SQL/projection audit i çdo endpoint, race me archival, PII review njerëzor |
| ST-06 / SEC-003 | Correction/appeal independent and note integrity: `test/correction-policy.test.mjs`, `test/retraction-note-boundaries.integration.test.mjs`, `test/submissions-concurrency.integration.test.mjs` | VERIFIED sintetik | Reviewer conflict/appeal policy audit, dalje e sigurt në ledger publik |
| ST-07 / SEC-004 | 10+ aggregation, no live tallies, withdrawal cancellation/purge: `test/dialogue.integration.test.mjs`, `test/dialogue-cancellation.integration.test.mjs`, `test/dialogue.browser.e2e.mjs` | VERIFIED sintetik | Identitete të dyfishta, backups/retention, metadata inferential leakage |
| ST-08 / SEC-009 | Input/URL safety, JSON strict, CSRF: `test/domain.test.mjs`, `test/http-json-utf8.test.mjs`, `test/public-url.test.mjs` | PARTIAL | URL pseudo-private TLD/suffix policy, redirects if later fetching, more legacy #4/#5/#7 boundaries; dedupe existing tests |
| ST-09 / SEC-012 | F06 synthetic expiry under attested disposable role: `test/operational-retention.test.mjs` and related integration CI | VERIFIED synthetic boundary | Wrong-DB/role/token/refusal cases must stay fail-closed; legal retention still NOT approved |
| ST-10 / SEC-005 | F09 full encrypted backup, restores exact table/schema data from scratch DB: `test/backup.integration.mjs` | VERIFIED synthetic boundary | Offsite drills, RPO/RTO, owner/ACL restoration, key rotation, legal hold |
| ST-11 / SEC-011 | Local-only startup and release fail-closed: `test/private-startup.test.mjs`, `test/release-gate.test.mjs` | VERIFIED synthetic boundary | Reject unknown environment, host/origin mismatch and alternate launcher |
| ST-12 / SEC-010 | `npm ci` lockfile, audit and pinning; `tools/check-ci-toolchain.mjs`; workflow `verify.yml` | VERIFIED për versionet në CI; lifecycle PARTIAL | No floating ref, maintain SHA provenance; reviewed scheduled security upgrades |
| ST-13 / SEC-006 | Dedicated SAST/CodeQL, secret scanning dhe kontrolli për workflow privilege escalation | PARTIAL: nuk janë hapa në `verify.yml` | Draft PR i veçuar i autorizuar; false-positive triage, low privileges; prova e skanerit real |
| ST-14 / SEC-001 | Protected main / required exact check `verify` / independent review | FAILED sipas GitHub settings të verifikuara | Owner-configured active ruleset + test real merge refusal without review/status |
| ST-15 / SEC-007 | 40-PR cumulative integration, legacy 22 comparison | PARTIAL | Review 135 skedarë nga person i pavarur, plan docs reconciliation, vendim/raport për çdo legacy PR |
| ST-16 / SEC-014 | Monitore, incident-response, privacy notifications | UNKNOWN | Drill sintetik, përgjegjës & plan incident, pa eksport logs të qytetarëve |
| ST-17 / SEC-003/004 | Independent threat/privacy/editorial audit and legal DPIA | UNKNOWN / RELEASE BLOCKED | Raport i palës së pavarur; approve signoff, jo automatizim |
| ST-18 / SEC-015 | TLS/hosted stage/production secrets | NOT APPLICABLE për local-only pilot | Bëhet P0 e detyrueshme për Production; test vetëm pas miratimit të hosting |

## Politika e ekzekutimit në zhvillim (risk-based)

| Ndryshimi | Kontroll minimal i nevojshëm | Kur kërkohet pipeline i plotë |
|---|---|---|
| Vetëm tekst/dokumente ose CSS kozmetike | Diff kontroll + format/syntax + prekje e të dhënave private?; asnjë status sigurie i shpikur | Jo, përveç nëse prek CSP/theme accessibility/security docs me premtime |
| UI ose funksion normal | Testet e moduli/rrjedhës + regresion pozitiv/negativ, browser kur ndryshon DOM | Nëse prek sesi prodhohen kërkesat/privatësia |
| Login/RBAC/session/MFA/CSRF | Unit + API role matrix + negative + concurrency dhe CI i plotë sintetik | **Gjithmonë** |
| Public API, evidence, editorial, dialogue, PII | Unit + PostgreSQL authorization + privacy allowlists/archival + browser kritike | **Gjithmonë** |
| Schema/migrations/cleanup, backup, restore | Disposable DB attestation, migrations replay, DB parity dhe negatives; asnjë DB reale | **Gjithmonë** |
| GitHub workflow, dependencies, tooling, release | Change review, secure permissions/pinning, reproducible full CI | **Gjithmonë** |
| Merge/release/prod | ASVS/independent review, legal/editorial/privacy, hosted stage, ops drills + explicit owner approval | **Release gate P0; CI nuk mjafton** |

## Komandat dhe kufijtë praktikë

- Pa DB: `npm ci --no-audit --no-fund`, `npm run check`, `npm test` (testet PostgreSQL mund të *skip* jashtë mjedisit të plotë).
- Për provë reale si CI: `.github/workflows/verify.yml` me PostgreSQL **të hedhshëm** dhe credentials **sintetike**; `npm run db:migrate` 2 herë, `npm run verify`, `npm run test:e2e`, `npm run test:backup`; `node tools/release-audit.mjs`. Duhet të shihet **zero skip** për tests e DB, jo vetëm exit 0.
- Mos ekzekuto prova fshirjeje, backup ose test bootstrap kundër environmentit real të përdoruesit, database/shared instance ose serveri publik. Lidhja e testit duhet të vërtetohet nga mjedisi/role/attestation sipas F06/F09.
- Për ndryshime doks: asnjë `GREEN` i ri nuk nënkuptohet nga CI e kodit të mëparshëm; CI është provë vetëm për SHA përkatëse.

## Propozimi i automatizimit CI — **NOT IMPLEMENTED; kërkon miratim të ndarë**

1. **Secret scanning i sigurt:** skan global në kodin/PR diff pa ekspozuar gjetje të fshehta në logs; skaner me version/digest të kontrolluar; kufizim false-positives dhe përjashtime të arsyetuara; për historikun e plotë vetëm një proces i kontrolluar.
2. **SAST:** CodeQL për JavaScript (ose ekuivalent offline pa llogari pagesë), me kontrolle për të drejtat e tokenit, PR fork events, query pack/pinning dhe ndalim i publikimit të SARIF sensitive pa vlerësim.
3. **Policy checks:** kontroll i `permissions`, action SHA pinning, mungesë `pull_request_target` të privilegjuar, bashkë me existing `npm audit --audit-level=high` dhe Node/PostgreSQL/Chromium/recovery.
4. **Testet e sigurisë funksionale:** zgjerim i kontrolluar për route-role/PII/retention/negative auth, vetëm në mjedis sintetik. Mos mbështet vitrinën green duke kapërcyer DB tests.
5. **Mbrojtja e `main`:** check i detyrueshëm i **emërtuar realisht** `verify` nga GitHub Actions; të paktën një reviewer real, stale reviews, no bypass. Vetëm pronari/administratori e miraton.

**Kusht para një Draft PR të ri:** propozim i ndryshimeve të sakta në `AGENTS.md`, workflow dhe teste; autorizim specifik; pastaj review për lejet/costs/no real data. `docs/security` mund të drejtojë agjentët vetëm pasi të jetë qasur/integurar në degën e tyre të kodit.
