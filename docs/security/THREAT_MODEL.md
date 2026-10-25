# Protesto — THREAT_MODEL (rrezik i bazuar në rrjedha)

**Baza:** Draft PR #69, code SHA `8f46a94ecc8fb8e3b5e860c6656f07dea15ef661`; pilot **vetëm sintetik/lokal**, pa autorizim për persona realë. Metoda: identifikim asetesh, aktorësh, kufijsh besimi, skenarësh, kontrolle dhe provë. Kjo nuk është penetration test dhe nuk justifikon publikimin e detajeve të shfrytëzimit në repository publik.

**Pronësia:** [SECURITY_REGISTER](./SECURITY_REGISTER.md) ka ID-të, rëndësinë dhe statuset; [SECURITY_ARCHITECTURE](./SECURITY_ARCHITECTURE.md) ka mekanizmat; [SECURITY_TEST_MATRIX](./SECURITY_TEST_MATRIX.md) përmban testet; [RELEASE_GATES](../RELEASE_GATES.md) vendos miratimin final. Raportet e paadresuara me hollësi operative të rrezikshme duhen trajtuar në kanal privat të autorizuar, jo në issue publik.

## Asetet, aktorët dhe objektivat e sigurisë

| Aseti | Sekreti / integriteti / disponueshmëria | Kufiri i mbrojtjes |
|---|---|---|
| Origjinalet e raportimeve, burime, metadata, shënime redaktoriale | Konfidencialitet shumë i lartë; integritet i pretendimeve | Reporter/recensues të autorizuar; publik vetëm kopja e veçuar |
| Llogaritë, password hashes, sesione, çelësat TOTP/HMAC | Konfidencialitet dhe kontroll identiteti | Operator, runtime dhe DB; jo UI publik, jo log |
| Historia e vendimeve, korrigjimeve, tërheqjeve | Integritet, llogaridhënie, shqyrtim i pavarur | Gjurmë auditimi jo të rishkrueshme sipas rrjedhës; politika juridike mbetet për t'u miratuar |
| Dialogu dhe votat për tema qytetare | Konfidencialitet, mosprofilizim, integritet agregatesh | Pseudonime server-side dhe prag agregimi; rezervime backup |
| Databaza, migrimet, arkivi i enkriptuar | Integritet dhe rikuperim; ndalim fshirjes aksidentale | Postgres/test disposable, çelësa të veçuar, restore i kontrolluar |
| GitHub PR/CI/commit, pipeline artefacts | Integritet i kodit dhe build; supply chain | PR me review, kontrolle të detyrueshme, privilegje minimale |
| Identiteti/pozicioni i pjesëmarrësve në tubime | Minimizim i rreptë | Mos krijo lista pranie, geolocation apo profilim politik |

**Aktorë potencialë (jo akuza):** raportues i paautorizuar, lexues anonim, llogari e komprometuar, recensues me konflikt interesi, sulmues i automatizuar, kontribues me PR të dëmshëm, varësi apo shërbim i jashtëm i komprometuar, keqkonfigurim operatori. **Fushat e paligjshme për prototipin:** material real konfidencial, dosje sensitive dhe të dhëna preferencash politike nuk duhen përpunuar.

## Kufijtë e besimit

```text
[Browser / kërkesa publike jo të besuara]
  | Origin + CSRF + Auth + Rate limits + validation
  v
[Node.js API private pilot] --(role/row locks/allowlists)--> [PostgreSQL private data]
  |                                                     |
  | publikim vetëm pas review                           | isolated encrypted drill
  v                                                     v
[Approved public projections]                      [Disposable restore DB]
  
[Contributor PR / dependencies] -- CI & review --> [Candidate branch]
                                                    |
                                               [protected main?]
                                               OPEN P0; not enforced

[External sources, AI, hosted ingress, monitoring, real users] = NOT APPROVED/OPEN
```

## Rreziqet dhe kushte për frenim

| Rreziku / rrjedha | Pasoja për qytetarët | Kontroll aktual / kufi i provës | Verifikimi i nevojshëm |
|---|---|---|---|
| T-01 Account takeover, replay, credential stuffing | Zbulim identiteti / pretendime në emër të tjetrit | scrypt async, quotas, hashed cookies, TOTP opsional + anti-replay | MFA e detyrueshme për role sensitive; provë recovery dhe negativë të login; SEC-002/009 |
| T-02 IDOR / multi-tenant data leak / logout A→B | Zbulim i raportimit të pabotuar | role matrix, eksport owner-only, browser clear/reset | Matricë për çdo endpoint dhe ndërthurje gjendjesh, concurrency/stale-response; SEC-008 |
| T-03 Publikim accidental i origjinalit/PII dhe source metadata | Doxxing, dëmtim reputacioni, humbje konfidencialiteti | copy `public_*`, recheck reviewer/accepted source, legacy hidden | Test public allowlist e rasteve sensitive, redaction audit njerëzor; SEC-003/013 |
| T-04 Reviewer collusion, recension i vetes, korrigjim i historisë | Vendim i manipuluar dhe humbje besueshmërie | role-independent review dhe audit trail në transaksion | Review i pavarur, test gjendjesh të paligjshme/conflicts; SEC-003/007 |
| T-05 Spam, Sybil, manipulim agregatesh të dialogut | Pamje e rreme e konsensusit; ekspozim opinionesh | HMAC pseudonym, quota, agregim në mbyllje ≥10 | Antisybil pa profilizim, ruajtje backup, DPIA, qartësim se nuk është sondazh; SEC-004 |
| T-06 Race condition në miratim/tërheqje/votim | Publikim pas arkivimit ose gjendje jokonsistente | PostgreSQL locks, single-snapshot public read, archived-case cancellation | Adversarial concurrency tests; SEC-003/004 |
| T-07 SQL injection, XSS, CSRF, unsafe URL | Integritet i të dhënave, sesione dhe klientë | parameterized queries, CSP, CSRF, URL filter dhe UTF-8 strict | Security regression + test client-projection, audit për rrugë të reja; SEC-009/013 |
| T-08 Fshirje gabimisht në DB, backup i manipuluar | Humbje e provave dhe e historisë | migration checksums, F06 limited ephemeral purge, F09 encrypted all-table recovery | Ndalim real-data, offsite restore drill, politika retention/legal hold; SEC-005/012 |
| T-09 Poisoned PR, dependency takeover, compromised runner | Kod i paautorizuar, manipulim i moderimit | pinned actions + deps, npm audit, synthetic CI; main unprotected | Protected main, independent review, SAST/secret scan e patch policy; SEC-001/006/007/010 |
| T-10 Hosted accidental startup/CI using shared real DB | Shpërndarje e paautorizuar ose fshirje e të dhënave | canonical launcher local-only; disposable CI attestations | Audit i wrappers/hapave operacionale dhe stateful CI negatives; SEC-011/012 |
| T-11 Social engineering, disclosure përmes logs, incident pa owner | Ekspozim pa zbulim/reagim | logim i kufizuar, liveness/readiness, admin aggregate | Pronar incidentesh, monitorim pa PII, privacy incident exercise; SEC-014 |
| T-12 Automatizim AI në citime/prova | Pretendime të fabrikuara, prompt-injection, dëmtim reputacioni | AI nuk është në rrugën e miratuar të publikimit | Human-in-the-loop, provë burimi dhe citim të detyrueshëm para çdo feature të ardhshëm; SEC-003/013 |

## Invariantet që nuk lejohen të ndryshojnë

1. Asnjë regjistrim sensitive real, publikim automatik i pretendimeve apo histori politike individuale në pilot.
2. Rekord origjinal privat ≠ kopje publike. Çdo fushë e re publike kërkon kontratë eksplicite dhe test.
3. Asnjë user nuk miraton punën e vet; çdo ndryshim editorial ka gjurmë auditimi pa publikim të informacionit konfidencial.
4. Dialogu nuk emërtohet anonim apo përfaqësues. Minimumi i agregimit nuk zëvendëson DPIA.
5. Asnjë test fshirjeje/migrimi/restore nuk përdor ambient `DATABASE_URL` ose data reale pa atestimin e kufirit të disponueshëm.
6. Asnjë `main` merge, deploy, API publike, data reale apo secrets të prodhimit pa aprovim specifik të pronarit dhe release gates.
7. Asnjë scanner i ri nuk ka leje write, debug logging me tokena, ose workflows nga PR të pabesueshme me secrets privilegjuese.

## Rikonsiderimi i modelit

Rihape modelin nëse shtohen: mobile APK, uploader files, storage cloud, source-fetcher server-side, email/password reset, user signup, payment, institutional account, AI, hosting, proxy, platforma të shumta, analytics, import/eksport, migrime sensitive, regjistrim i votës. Për çdo modul të ri të rëndësishëm, shto skenarë të rinj dhe teste në matricë pa kopjuar historikun e regjistrit.

**Referenca teknike:** [OWASP ASVS v5.0.0](https://asvs.owasp.org/), [Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html), [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/). Kërkesat merren sipas rrezikut; nuk pretendohet përputhshmëri e plotë.
