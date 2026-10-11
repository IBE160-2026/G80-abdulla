# KI-logg

Logg over hvordan KI (Claude Code med BMAD-skills) er brukt i prosjektet. Hver økt har en egen oppføring: hva jeg ba om, hva KI foreslo, hva jeg bestemte, og hvilke commits det førte til. Detaljerte beslutninger med begrunnelse ligger i [beslutninger/](beslutninger/).

**Verktøy:** Claude Code (CLI) med BMAD-skillene `bmad-product-brief`, `bmad-prd` og `bmad-ux`.

---

## 2026-09-18: Product brief og første PRD

**Ba om:** Product brief og PRD for LocalFix ut fra min egen beskrivelse av ideen.

**KI gjorde:**
- skrev briefen fra teksten min og flyttet konkurrentresearch til `addendum.md`
- lagde PRD med brukerreiser, krav (FR) og antagelser

**Jeg bestemte:**
- Norsk som dokumentspråk.
- Hurtigsporet i PRD-en, med antagelser jeg gikk gjennom etterpå.
- Hold v1 enkel: KI-en foreslo utvidet statusrett, generalisering av adresser og en «rapporter»-knapp. Jeg avviste alle tre (se `prd-beslutningslogg.md`).

**Commits:** `08676b0`, `f38a9fa` (lastet opp 2026-09-21)

---

## 2026-10-11: Oppfølging av faglærers tilbakemelding, PRD og UX

### Product brief
**Utgangspunkt:** Faglærers tilbakemelding (`tilbakemeldinger/tilbakemelding-product-brief.md`) ba om tre ting: avklarte roller, et KI-kriterium som kan testes, og at sensor kan kjøre appen uten nøklene mine.

**KI foreslo:** alternativer for roller, lokalmiljø, utvidelse og lokal kjøring.

**Jeg bestemte:**
- innlogging med moderatorrolle
- campus Molde som lokalmiljø
- filtrering og sortering som utvidelse, ikke duplikatsjekk (den er parkert)
- lokal Supabase og KI-mock

**Rettet underveis:** Briefen sa «registrere en rapport med bilde», og den første PRD-en antok at bilde var obligatorisk. I PRD-arbeidet bestemte jeg at bilde skal være valgfritt, og briefen ble rettet slik at de to dokumentene sier det samme.

**Commit:** `23431d8`

### PRD
**KI foreslo:** at PRD-en skulle følge den nye briefen. Fem tidligere beslutninger ble overstyrt, blant annet at status nå endres av en moderator, ikke av rapportøren.

**Jeg bestemte:**
- statusflyten går ett steg fram eller tilbake
- skjulte rapporter er bare synlige for moderator
- bilde er valgfritt
- PRD-en legges i `docs/`

**Avviste KI-forslag:** KI-en anbefalte Claude via Anthropic API som språkmodell, med begrunnelsen at det var billig og at mock-modus gjorde gratisnivå unødvendig. Jeg sjekket faglærers tilbakemelding, som krever **gratisnivå**, og valgte i stedet en leverandør med gratisnivå (alternativ A). Valget av leverandør tas i arkitekturfasen.

**Commits:** `ceeedc3`, `f1510ae`

### UX
**KI foreslo:** spørsmål om stil, farger og oppførsel, og lagde fire fargetemaer jeg kunne se i nettleseren (`ux/mockups/fargetemaer.html`).

**Jeg bestemte:**
- rolig og saklig stil
- fargetemaet Fjordblå
- shadcn/ui
- bare lys modus
- skjema på én side med beskrivelsen først
- flytende «+»-knapp
- KI-kategori forhåndsvalgt, men mulig å endre

**Gjenstår å kontrollere:** antagelsene i UX-dokumentene (tegngrense, forsinkelse på KI-forslaget, kontrast).

**Commit:** `bdb0b9a`

### Sensorveiledning
**Gjort:** Sjekket repoet mot sensorveiledningen for del 1. Fant at README hadde feil prosjektnavn, at en fil lå løst i rotmappa, at beslutningsloggene ikke var i repoet, og at det manglet KI-logg og bruk av branches og pull requests.

**Tiltak:** Denne loggen, `beslutninger/`, opprydding i repoet og en ny README. Fra nå blir arbeidet gjort i branches med pull requests.

**Branch:** `docs/prosessdokumentasjon`
