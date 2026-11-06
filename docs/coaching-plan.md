# Coachingplan

Plan for hvordan jeg bruker Claude Code som coach resten av prosjektet, fra epics og stories til ferdig app. Planleggingen (brief, PRD, UX, arkitektur) er ferdig. Det som gjenstår er kode, tester og README, og det er der kriterium 2–6 i sensorveiledningen avgjøres.

Sist oppdatert: 2026-11-06

## Hvorfor coaching

Emnet handler om å **styre** KI-assistert utvikling. Kriterium 1 (Prosess og KI-styring, 30 %) ser etter eksempler på at jeg har vurdert, rettet og avvist KI-forslag, og at beslutningene kan kobles til konkrete endringer. Hvis Claude skriver alt i hurtigspor, blir det få slike spor.

I PRD-fasen byttet jeg fra coaching til hurtigspor fordi jeg spurte «hva anbefaler du» hele tiden. Arkitekturen gikk bedre: coaching med én anbefaling per valg, og jeg valgte. Det er den modellen jeg fortsetter med.

## Rollene

| Jeg bestemmer | Claude gjør |
|---|---|
| Hvilken story som er neste, og når den er ferdig | Foreslår rekkefølge og deler opp arbeidet |
| Alle valg som endrer krav, datamodell eller utseende | Gir 2–3 alternativer og **én** anbefaling, knyttet til et sensorkriterium |
| Om et KI-forslag godtas, rettes eller avvises | Skriver kode og tester etter planen, og sier fra når koden avviker fra PRD, UX eller arkitektur |
| Om en PR flettes | Lager branch, commits og PR med testsammendrag |
| Hva som skrives i beslutningsloggen | Fører sesjonslogg og `issues.md` |

Regel: Claude tar ikke et valg som står i PRD, UX eller arkitektur på egen hånd. Avvik fra planen skal stå forklart i PR-en og i beslutningsloggen.

## Faser

### Fase 1: Epics og stories

- Kjør `bmad-create-epics-and-stories` i coaching-modus.
- Jeg godkjenner oppdelingen før noe skrives ut: hver story skal kunne spores til FR-1 til FR-9 og ha akseptansekriterier som kan testes.
- Ta med det som står åpent fra arkitekturen:
  - Første story er oppsett av prosjektet (startpakke, lokal Supabase, mock-modus for KI, Vitest, Playwright, axe og en tom kjerneflyttest).
  - Første story som berører bilder er en spike med pgTAP-testene for AD-6 og AD-9.
  - Kjerneflyttesten i `e2e/` vokser story for story, uten `skip`.
- Kjør `bmad-sprint-planning` for å sjekke at planen er klar, og lag sprintstatus.
- Før oppstart: installer Docker Desktop, og gjør sjekkene fra [arkitektur-final](../.logs/ali-yousef-abdulla/989-2026-11-06-14-33-33-arkitektur-final.md) (`proxy.ts`, shadcn mot Tailwind 3.4, `supabase db reset` med bilder, `auth.uid()` i visningen).

### Fase 2: Implementering, én story om gangen

Hver story går gjennom samme løkke:

1. **Les storyen sammen.** Claude oppsummerer hva den krever og hvilke AD-er den berører. Jeg bekrefter eller presiserer.
2. **Plan.** Claude foreslår filer og tester. Jeg godkjenner før koden skrives.
3. **Bygg.** `bmad-build` på en egen branch (`feat/<story>`). Små commits med beskrivende meldinger.
4. **Test.** Vitest for logikk, Playwright for flyten, axe for tilgjengelighet. Storyen er ikke ferdig før testene består (AD-15).
5. **Gjennomgang.** `bmad-code-review` eller `/code-review` på diffen. Jeg leser funnene og bestemmer hva som rettes. Det som ble funnet og rettet, skrives i PR-beskrivelsen.
6. **Prøv selv.** Jeg kjører appen og går gjennom flyten med mus og bare tastatur, på mobil- og skjermbredde.
7. **PR og fletting.** PR med lenke til storyen, testsammendrag og funn fra gjennomgangen. Jeg fletter.
8. **Logg.** Sesjonslogg, `issues.md` og eventuelle beslutninger.

Spre arbeidet over flere uker. Helst noen stories hver uke, ikke alt rett før fristen (varseltegn i sensorveiledningen kapittel 5).

### Fase 3: Ferdigstilling

- README: forutsetninger med versjoner, kommandoer som kan kopieres, `.env.example`, testbrukere, hvordan testene kjøres, og skjermbilde.
- Test README på en ren klone, kun etter oppskriften. Sensor bruker 15–20 minutter.
- Avgjør KI-leverandør med SM-5-testsettet (PRD §11). Mock-modus må fortsatt virke uten nøkkel.
- `bmad-retrospective` på hver epic, og en siste sensorsjekk mot alle sju kriteriene.

## Hva hver økt skal etterlate

| Spor | Hvor | Kriterium |
|---|---|---|
| Sesjonslogg (oppgave, plan, resultat, åpne punkter) | `.logs/ali-yousef-abdulla/` | 1 |
| Beslutninger med begrunnelse, og avviste KI-forslag | `docs/beslutninger/` | 1 |
| Kort oppføring per økt, med commits | `docs/ki-logg.md` | 1 |
| Story og akseptansekriterier | `docs/planning-artifacts/` | 1, 2 |
| Branch og PR med testsammendrag og funn fra gjennomgang | GitHub | 1, 3 |
| Tester som kjører grønt | `e2e/`, `*.test.ts` | 3 |
| Ingen nøkler, `.env` eller `node_modules` i repoet | `.gitignore` | 7 |

## Spørsmål jeg stiller Claude

- Hvilket krav eller hvilken AD kommer dette fra?
- Hva er alternativet, og hvorfor anbefaler du dette?
- Hva tester denne testen egentlig? Hva skjer med feil input?
- Avviker dette fra PRD, UX eller arkitektur? Hvis ja, hvor skal det forklares?
- Er det død kode, duplisering eller rester fra et tidligere forsøk her?

## Ting som ikke er bestemt ennå

- Endelig KI-leverandør (PRD §11).
- Hvem som er moderator i praksis, og hvem som eier belysning og stier rundt campus.
- Innleveringsfristen og hvor mange uker som er igjen til implementering. Fyll inn når den er kjent, og fordel stories etter det.
