# Protesto — SECURITY_REGISTER (kanonik për sigurinë)

**Vlerësuar:** 2026-10-25. **Objekti:** vetëm `titanfit102-bit/Protesto`; aplikacion sintetik lokal, jo Production. **Baza e analizuar e kodit:** Draft [PR #69](https://github.com/titanfit102-bit/Protesto/pull/69), `8f46a94ecc8fb8e3b5e860c6656f07dea15ef661`. **CI e të njëjtit SHA:** [run 40089967166](https://github.com/titanfit102-bit/Protesto/actions/runs/40089967166), `verify` SUCCESS: 75/75 teste, 0 dështime, 0 të anashkaluara, npm audit 0 në atë ekzekutim, prova sintetike e rikthimit dhe releaseAllowed:false. Gjendja duhet ri-verifikuar në çdo zhvillim.

**Autorizimi i kësaj faze:** vetëm dokumentacion sigurie në degën e izoluar `docs/protesto-permanent-security-governance`, krijuar nga kodi i PR #69. Dokumentet kanonike të vazhdimësisë janë **vetëm** [STATUS](https://github.com/titanfit102-bit/Protesto/blob/docs/protesto-continuity/docs/STATUS.md) dhe [MASTER_HANDOFF](https://github.com/titanfit102-bit/Protesto/blob/docs/protesto-continuity/docs/MASTER_HANDOFF.md) në degën `docs/protesto-continuity`. Versioni i `docs/STATUS.md` në degën e aplikacionit është historik. Ndryshimet e kodit, `AGENTS.md`, CI, settings/rulesets, PR lifecycle, real data dhe release kërkojnë kufijtë e miratimit përkatës. Asnjë dobësi e paadresuar nuk duhet të shpjegohet në repository publik me payload, rrugë shfrytëzimi ose të dhëna private.

## Kontrata e regjistrit

- Një rresht për rrezik/kontroll unik; **ID të qëndrueshme**, komponent, rrezik P0/P1/P2, status `VERIFIED | PARTIAL | FAILED | UNKNOWN | NOT APPLICABLE`, provë, masë dhe hap pasues.
- `VERIFIED` zbatohet vetëm për invariantin dhe SHA/CI e testuar; **jo certifikim global**. `FAILED` = kontroll i kërkuar pa mbrojtje/rezultat sipas evidencës, jo konfirmim sulmi. `UNKNOWN` = prova të pamjaftueshme.
- Provat e testimit dhe komandat referohen në [SECURITY_TEST_MATRIX](./SECURITY_TEST_MATRIX.md). Kufijtë e besimit në [THREAT_MODEL](./THREAT_MODEL.md). Struktura dhe kontrolli teknik në [SECURITY_ARCHITECTURE](./SECURITY_ARCHITECTURE.md).
- Politika e **publikimit** dhe autorizimi i release: [RELEASE_GATES](../RELEASE_GATES.md) dhe [RELEASE_READINESS](../RELEASE_READINESS.md); regjistri i **mbajtjes/fshirjes së të dhënave**: [DATA_RETENTION_AND_ERASURE_REGISTER](../DATA_RETENTION_AND_ERASURE_REGISTER.md); qeverisja editoriale: [SECURITY_AND_REVIEW](../SECURITY_AND_REVIEW.md). Këto nuk kopjohen këtu.
- Gjetje të reja: provo statusin në kod, krijo test proporcional, lidh commit/PR/CI, regjistro kufizimet. Ndrysho statusin vetëm pas provës në SHA e re dhe verifikimit të pavarur kur kërkohet.

## Regjistri i kontrolleve dhe boshllëqeve

| ID | Komponenti / rreziku | Prioritet; status | Mbrojtja / prova në SHA e analizuar | Hapi pasues / kriteri |
|---|---|---|---|---|
| SEC-001 | Integriteti i `main`, rruga e miratimit | **P0; FAILED** | GitHub `main.protected=false`; repository rulesets `[]`; 65 Draft PR, përfshirë #69 | Pronari të krijojë ruleset me PR të detyrueshëm, check real `verify`, rishikim të pavarur, pa bypass/force push; **pa ndryshim automatik** |
| SEC-002 | MFA/identitet/rikuperim i recensuesit | **P0; PARTIAL** | TOTP i enkriptuar, anti-replay dhe teste; regjistrimi i MFA mbetet opsional, rikuperimi/rotacioni jo i miratuar | Vendim për MFA të detyrueshëm, rikuperim të sigurt, zbatim/tregues nga operator i pavarur |
| SEC-003 | Kufijtë e privatësisë në publikim | **P0; PARTIAL** | Kopje publike e ndarë, filtër i fushave, moderim dhe testet e privatësisë (F01–F03) | Audit i pavarur për PII, proveniencë, redaktim dhe të drejtën e përgjigjes |
| SEC-004 | Pseudonime, dialogu dhe backup-et | **P0; PARTIAL** | Agregim pas mbylljes me prag ≥10, votat e fshira nga tabela aktive; backups mund të ruajnë histori | DPIA/vlerësim ligjor, ruajtje për backup, kundër llogarive të rreme, politika e pjesëmarrjes |
| SEC-005 | Backup/restore operacional | **P0; PARTIAL** | F09 sintetik: PostgreSQL 20/20 tabela + skemë të krahasuara pas restore të enkriptuar në CI | Offsite real, pronari i çelësave, RPO/RTO, plan dhe ushtrime të mbikëqyrura; jo përdorim real tani |
| SEC-006 | SAST dhe analiza e sekreteve në pipeline | **P1; PARTIAL** | `.github/workflows/verify.yml` ekzekuton audit varësish, sintaksë dhe teste; nuk përmban hap të dedikuar SAST/secret scan | Propozo CodeQL / skaner lokal pa sekret, me privilegje minimale, versione të kontrolluara e prova negative; shërbimet native/org settings janë `UNKNOWN` |
| SEC-007 | Shqyrtim i pavarur i stack-ut 40-PR | **P0; PARTIAL** | PR #69 është Draft mbi #68; mungojnë prova miratimi të pavarur për integrimin e 135 skedarëve | Zgjidh rrugën e vetme të integrimit dhe trajto 22 PR historike; pa merge para rishikimit |
| SEC-008 | Server-side RBAC / izolimi i llogarive | **P1; VERIFIED (sintetik)** | `test/role-boundary-matrix.integration.test.mjs`, testet e eksportit personal dhe kalimit A→B në E2E; CI #40089967166 | Zgjero testet negative për të gjitha rrugët, gjendjet konkurruese dhe session-staleness; audit i pavarur |
| SEC-009 | CSRF, sesione, login, TOTP replay | **P1; VERIFIED (sintetik)** | `src/server/security.mjs`, `app.mjs`; teste `security`, `async-auth`, `session-revocation`; CI i fundit | Review kundër proxy/timing/DoS; nuk provon readiness për përdorues real |
| SEC-010 | Përditësimet e zinxhirit të furnizimit | **P1; PARTIAL** | `npm ci` lockfile; F12 pins Node 22.23.4, PostgreSQL 16.15 digest, Chrome 156.0.8078.47 dhe 3 Actions SHAs | Politika e patch-eve, rinovim i varësive/digesteve, proveniencë për Chrome dhe imazhin e runner-it |
| SEC-011 | Izolim i pilotit dhe databazës | **P0; VERIFIED (hyrja kanonike sintetikisht)** | `src/ops/private-startup.mjs` refuzon nisjen jo-loopback/politikë release; `test/private-startup.test.mjs` në CI | Hostile-wrapper/hosted-stage audit; nuk autorizon hosted pilot |
| SEC-012 | Fshirje aksidentale/retention | **P0; PARTIAL** | F06 lejon pastrim vetëm të rreshtave operacionalë të skaduar me PostgreSQL sintetik të izoluar dhe atestim; default read-only | Politika ligjore dhe operator i autorizuar për çdo të dhënë reale; mos vendos scheduler live |
| SEC-013 | Proveniencë e burimeve dhe URL publike | **P1; PARTIAL** | Filtër HTTPS pa kredenciale/query dhe kopje e verifikuar; deklarata lokale SHA-256 nuk provon autenticitetin e PDF | Kontrata për hostet pseudo-private/redirect, dokumentet, zinxhiri i ruajtjes; pa server-side fetch |
| SEC-014 | Detektim/incident response | **P0; UNKNOWN** | Ekziston liveness/readiness dhe status agregat admin; nuk ka provë shërbimi të miratuar të alarmimit/on-call | Pronar incidentesh, procedurë, metrika pa PII, test reagimi dhe mbikëqyrje |
| SEC-015 | TLS, storage dhe secrets në Production | **P0; NOT APPLICABLE** për pilotin *vetëm lokal*; **OPEN** për target Production | Piloti qëllimisht dëgjon vetëm localhost HTTP, repo kodi publik; nuk ka Production të autorizuar | Para launch: hosting i izoluar, TLS dhe politika e sekreteve, trust-boundary audit dhe miratim eksplicit |

**Kujdes:** `NOT APPLICABLE` në SEC-015 vlen vetëm për fazën lokale; **nuk** heq release gate. Nivelet pasqyrojnë rrezikun e objektivit të ardhshëm, jo domosdoshmërisht incidencën aktuale.

## Sjellja pas çdo ndryshimi

1. Ndryshim dokumentesh/UI kozmetike: kontroll sintakse/diff + evidentim; mos nis testin e plotë DB pa nevojë.
2. Ndryshim normal funksional: testet për rrugët/modulet e prekura, përfshirë test negativ për regresion.
3. Identitet/RBAC, privacy/public API, moderim, SQL/migrim, dialog/retention, backup, startup/release ose CI: testet e lidhura + pipeline sintetik të plotë dhe dokumentim i SHA-së; security review i fokusuar.
4. Para merge në main/real data/Production: të gjitha kushtet P0 dhe auditim i pavarur, miratim i pronarit sipas [RELEASE_GATES](../RELEASE_GATES.md), pa asnjë përjashtim nga green CI.
5. Pas provës reale, përditëso vetëm rreshtat e ndryshuar këtu dhe lidh dokumentet kanonike të vazhdimësisë; **nuk** bëhen commits vetëm për t'u dukur aktiv.

## Vendimet e bllokuara dhe autorizimi

- `AGENTS.md` në degë kodi dhe shtimi i skanimeve në `.github/workflows/verify.yml`: **PROPOSED / NOT IMPLEMENTED**, kërkohet miratim specifik për diff-in dhe Draft PR e veçantë. Nuk duhen ulur apo hequr kontrollet ekzistuese.
- `main` ruleset, CODEOWNERS, branch protection, reviewer i pavarur dhe integrimi i 40 PR-ve: **OWNER/ADMIN**, jo veprim i kësaj dege dokumentacioni.
- Nuk ka autorizim për identitete reale, evidencë konfidenciale, email të qytetarëve, sekrete, shërbime me pagesë, deploy, delete ose merge.

**Referenca standarde:** [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0), [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/), [NIST SSDF](https://csrc.nist.gov/Projects/ssdf). Kjo është hartë kontrollesh e përshtatur, jo pretendim për certifikim ASVS.
