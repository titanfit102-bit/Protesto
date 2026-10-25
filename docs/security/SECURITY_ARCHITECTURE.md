# Protesto — SECURITY_ARCHITECTURE

**Scope & provenance:** Verifikim i strukturës për kodin e Draft PR #69, SHA `8f46a94ecc8fb8e3b5e860c6656f07dea15ef661`, kundrejt CI [#40089967166](https://github.com/titanfit102-bit/Protesto/actions/runs/40089967166). Kjo është pamja e **pilotit sintetik lokal**; arkitektura Production është ende *not designed/not approved*. Regjistri kanonik: [SECURITY_REGISTER](./SECURITY_REGISTER.md). Jo udhëzim për të aktivizuar mjedisin me të dhëna reale.

## Kufiri i sistemit

1. **DEMO e shfletuesit:** `index.html`, `src/app.mjs`, `src/domain.mjs`, CSS; të dhëna fiktive në `localStorage`, pa backend. Përbën vetëm prototip lokal.
2. **Private Pilot:** `pilot.html` + `src/pilot*.mjs` (HTTP browser) → `src/server/app.mjs` (server API, Node.js) → PostgreSQL 16 dhe migrimet e versionuara `db/`. Regjistrimi kryhet me CLI nga operatori, pa signup publik.
3. **Rruga e autorizuar e startit:** `tools/pilot-server.mjs` vërteton **përpara** DB/bind `assertPrivatePilotStartupPolicy` nga `src/ops/private-startup.mjs`: vetëm loopback `127.0.0.1` ose `::1`; origjinë HTTP që korrespondon saktë, mjedis i lejuar zhvillimi. Kjo nuk mbulon wrapper-a të panjohur.
4. **Zona editorial/privatë:** origjinalet (raporte, burime dhe shënime), reviewer/appeal dhe gjurmët e auditit qëndrojnë server-side; jashtë duhet të dalin vetëm allowlist-e fushash `public_*` të pranuara nga recensues i pavarur.
5. **Dialogu:** topic/statement në moderim, vota me identifikues HMAC pseudonim (jo anonim), rezultate vetëm të finalizuara me ≥10 pjesëmarrës/statement; fshirja nga DB aktive nuk fshin backup-et historike.
6. **Recovery:** `tools/backup.mjs`, `tools/restore.mjs` dhe `test/backup.integration.mjs` provojnë arkiv AES-256-GCM dhe restore në PostgreSQL të hedhshëm, pa përdorim Production. Nuk ekziston provë për një shërbim offsite operacional.

## Kufijtë e besimit dhe kontrollet

| Kalimi | Kontroll i verifikuar në kod / test | Kufizimi real |
|---|---|---|
| Browser → API | Same-origin CSRF për POST, header i personalizuar, `SameSite=Strict` dhe `HttpOnly` cookie, CSP, kufi trupi 16 KiB, UTF-8 strikt | TLS/proxy/OAuth për shërbim publik nuk janë operacionalë; rezistenca ndaj çdo klienti armiqësor nuk është certifikuar |
| Sesion → role | Hashed token në PostgreSQL, email i normalizuar, scrypt async, kufi i punëve KDF, recheck nën row lock, revokim sessions | MFA TOTP opsional, rikuperim dhe 2FA enrollment pa lifecycle të plotë |
| Reporter → përmbajtje | Validim inputesh, norma PostgreSQL me HMAC, pending status | Nuk siguron vërtetësinë faktike, anti-bot të plotë apo mbrojtje nga sulme të organizuara |
| Reviewer → publikim | Vendim i pavarur; kontroll i burimit të pranuar, kopje e re publike dhe shënim audit | Checkbox nuk provon redaktim të vërtetë, proveniencë ose mungesë PII |
| API publik → konsumator | SQL projekton fusha të shqyrtuara; raste të tërhequra/legacy të paplota të fshehura | Skenarë race, media, metadata të ardhshme dhe informacione indirekte kërkojnë audit të pavarur |
| Aplikacion → PostgreSQL | Query të parametrizuara, transaksione me `FOR UPDATE`, afate pool/statement/lock, migrime me checksum | Pa audit dinamik të të gjitha query-ve / konfigurim prod të privilegjeve dhe segmentimit |
| Backup/restore → databazë | Enkriptim i autentikuar, kontroll empty-target, paritet synthetic 20 tabela dhe i skemës | ACL/role, legal hold, key custody, RPO/RTO, offsite dhe rotacioni mbeten P0 |
| PR → `main` | `npm ci`, npm audit, JavaScript syntax, Node/Postgres/Chromium/restore, fail-closed release audit | `main` është i pambrojtur, pa ruleset/review enforcement; SAST/secret scanning i dedikuar nuk është provuar |

## Modelet e autorizimit

- Rolet: `reporter`, `reviewer`, `admin`. Autori nuk mund të miratojë përmbajtjen e vet; apelimet kërkojnë recensues tjetër. Kushtet për çdo rrugë mbeten një detyrim testimi, jo garanci e përgjithshme.
- Ndani gjithmonë `original private` nga `reviewed public copy`; mos shtoni fusha në API publik pa allowlist, test izolimi dhe shqyrtim editorial.
- Të gjitha inputet e përdoruesit konsiderohen jo të besueshme; mos inferoni status të miratuar nga emra tabelash, UI, ose klienti.
- API e përmbledhjes së dialogut është *deskriptive*, jo përfaqësuese. Nuk ka gjurmim të pjesëmarrësve në tubime, profilizim politik apo personalizim propagandistik.
- Lidhjet e burimeve janë për paraqitje, jo për fetching server-side; nëse ky kufi ndryshon, nevojitet threat model i ri për SSRF, redirect/DNS dhe përmbajtje të jashtme.
- Integrimet AI janë **jo të autorizuara për publikim automatik**; nëse shtohen duhet retrieval me proveniencë, citime, kufi konfidentialiteti, kontroll prompt injection dhe miratim njerëzor.

## Siguria e ndërtimit dhe operacioneve

- CI aktual: [`.github/workflows/verify.yml`](https://github.com/titanfit102-bit/Protesto/blob/8f46a94ecc8fb8e3b5e860c6656f07dea15ef661/.github/workflows/verify.yml). F12 ka pin për Node, PostgreSQL digest, Chrome build, GitHub Actions SHA; `ubuntu-24.04` image mbetet evolutiv.
- Sekretet: vetëm jashtë version-control; `PROTESTO_RATE_LIMIT_SECRET`, `PROTESTO_DIALOGUE_SECRET`, `PROTESTO_MFA_KEY` janë të ndryshme; të mos përdoren të dhëna reale në CI. Nuk duhet logim i credentials, raw SQL errors apo export me identitete.
- Në prod të ardhshëm: HTTPS/TLS, private ingress, role minimale DB, backup offsite me çelësa të ndarë, audit log të kontrolluar dhe alarmim pa PII, operator incidentesh, rotacion i sigurt, provë e rikthimit, miratim ligjor/editorial.
- Skanimet e reja të sigurisë duhet të respektojnë `permissions: contents: read` dhe degë të izoluara, të mos kërkojnë token admin ose të publikojnë SARIF/artifakte me material sensitiv pa shqyrtim.

**Referencat funksionale ekzistuese:** [SECURITY_AND_REVIEW](../SECURITY_AND_REVIEW.md), [PUBLICATION_PRIVACY](../PUBLICATION_PRIVACY.md), [REVIEWER_MFA](../REVIEWER_MFA.md), [OPERATIONS](../OPERATIONS.md), [POLIS_DESIGN_ADAPTATION](../POLIS_DESIGN_ADAPTATION.md), [RELEASE_GATES](../RELEASE_GATES.md). Konfliktet historike zgjidhen duke lexuar kodin dhe CI SHA, jo duke mbishkruar këto dokumente.
