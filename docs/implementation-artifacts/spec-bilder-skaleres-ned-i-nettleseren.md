---
title: 'Bilder skaleres ned i nettleseren før opplasting'
type: 'feature'
created: '2026-11-26'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'f7275412ae8adb048c2f37d2abaf0af9a4141923'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Telefonbilder er ofte 3–8 MB og avvises i skjemaet med «Bildet er for stort. Maks 5 MB.». Brukeren får ingen hjelp. På Vercel-demoen stopper i tillegg plattformen trolig alt over 4,5 MB, så å heve grensen hjelper ikke.

**Approach:** Skjemaet skalerer bildet ned i nettleseren (canvas, JPEG) før det blir valgt og sendt, så det kommer under grensene. Serveren er uendret: 5 MiB (`IMAGE_MAX_BYTES`, bucketen, `bodySizeLimit`) er fortsatt sikkerhetsgrensen, og `sharp` fjerner EXIF og retter orienteringen (AD-9). Beslutning: `docs/beslutninger/arkitektur-beslutningslogg.md` 2026-11-26.

**Beslutninger (prosjekteieren, 2026-11-26):**
- Bildet skaleres bare når det trengs: fila er over 4 MiB, eller lengste side er over 2048 px. Ellers velges det uendret.
- Bilder over 40 megapiksler skaleres ned som andre store bilder og avvises ikke lenger i skjemaet.
- Teksten under «Legg til bilde» blir «Unngå ansikter og bilskilt på bildet. JPEG, PNG eller WebP. Store bilder gjøres mindre før de sendes.»
- Spec-en holdes samlet (ca. 1700 tokens).

## Boundaries & Constraints

**Always:** Typesjekken (JPEG, PNG, WebP) skjer før skaleringen. Bildet roteres etter EXIF-orienteringen før det tegnes, så det skalerte bildet står riktig vei. Forhåndsvisningen og innsendingen bruker det skalerte bildet. Feilene vises som i dag (melding under feltet, `aria-invalid`, fokus til «Legg til bilde»).

**Never:** Endre serveren, `prepareImage`, bucketen eller `bodySizeLimit`. Godta HEIC eller andre typer. Bruke `capture` på filfeltet. Ny npm-pakke.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lite bilde | JPEG 300 × 200, 30 kB | Velges uendret | N/A |
| Stor fil | JPEG over 4 MiB | Skaleres til JPEG, lengste side høyst 2048 px, under 4 MiB, og velges | N/A |
| Store mål | 4000 × 3000 | Skaleres til 2048 × 1536 | N/A |
| Orientering 6 | Stor JPEG 3000 × 2000 med EXIF-orientering 6 | Lagres stående (1365 × 2048) uten EXIF | N/A |
| Uleselig | Tekst omdøpt til .jpg | Avvises | «Fila er ikke et gyldig bilde.» |
| Fortsatt for stort | Resultatet over 5 MiB | Avvises | «Bildet er for stort.» |

</frozen-after-approval>

## Code Map

- `features/registrering/components/image-field.tsx` -- `handleChange`: i dag `checkImageFile` (tom, type, størrelse), så `new Image()` for `withinPixelLimit`, så `onImage(file)`. Skaleringen går inn mellom typesjekken og `onImage`.
- `features/registrering/image-input.ts` -- rene regler delt med serveren (`IMAGE_TYPES`, `IMAGE_MESSAGES`, `IMAGE_HINT`, `checkImageFile`, `withinPixelLimit`). Her hører de rene beregningene hjemme (om bildet må skaleres, og målene).
- `shared/lib/limits.ts` -- `IMAGE_MAX_BYTES` og `MAX_IMAGE_PIXELS`. Nye konstanter for 2048 px og 4 MiB.
- `features/registrering/components/report-form.test.ts:63` -- vakttest: `image-field.tsx` importerer `image-input`, aldri `image-process` eller `sharp`. Ny nettleserkode må holde seg innenfor dette.
- `features/registrering/image-input.test.ts` -- enhetstester for grensene, `checkImageFile` og den «frosne» teksten.
- `e2e/endrer/bilde.spec.ts` -- `HINT` (linje 26), tilfellene «5 MiB + 1 byte» og «svært store dimensjoner» (avvises i dag), og testen for EXIF og orientering (40 × 20, sendes uendret).
- `e2e/test-images.ts` -- `jpegOfSize` (polstret liten JPEG), `hugePng`, `jpegWithExif`. Lages med `sharp` i Node.
- Dokumenter: FR-3 i `docs/prd.md` og PRD-kopien, raden «Bildeopplasting» i `EXPERIENCE.md` (begge kopier), UX-DR10 og sammendraget i `epics.md`, AD-9 i `ARCHITECTURE-SPINE.md`.
- Ikke endre: `image-process.ts`, `actions.ts`, `next.config.ts`, bucketen, gamle `spec-*.md`.

## Tasks & Acceptance

**Execution:**
- [x] `shared/lib/limits.ts` -- konstantene for største side (2048) og terskelen (4 MiB) -- én kilde for tallene.
- [x] `features/registrering/image-input.ts` -- rene funksjoner for om bildet skal skaleres og for målene, ny `IMAGE_HINT` og `tooLarge`-melding -- testbare uten nettleser.
- [x] `features/registrering/image-resize.ts` -- nettleserdelen: `createImageBitmap(file, { imageOrientation: "from-image" })`, canvas, `toBlob("image/jpeg", 0.85)`, hvit bakgrunn, ny `File` med `.jpg` -- holder canvas-koden ute av komponenten.
- [x] `features/registrering/components/image-field.tsx` -- typesjekk, skaler ved behov, sjekk resultatet, vis og velg -- selve flyten.
- [x] `features/registrering/image-input.test.ts` -- de rene funksjonene (grenseverdier) og ny tekst.
- [x] `e2e/endrer/bilde.spec.ts` og `e2e/test-images.ts` -- stor fil og store mål blir skalert og lagret, orientering 6 på et skalert bilde, ny `HINT`.
- [x] Dokumentene i Code Map -- ny tekst for FR-3, UX-DR10, «Bildeopplasting» og AD-9.

**Acceptance Criteria:**
- Given et bilde over grensene, when brukeren velger det, then vises forhåndsvisningen uten feil, og etter innsending er det lagrede bildet en JPEG med lengste side høyst 2048 px.
- Given `npm test` i CI, when PR-en kjøres, then er alle Vitest-, pgTAP- og Playwright-tester grønne.

## Implementation Notes

- `checkImageFile` er delt i `checkImageType` (tom fil og type, før skaleringen) og `checkImageFile` (tom fil, type og 5 MiB, på fila som sendes). Bare skjemaet bruker `image-input.ts`, så serveren er uendret. `withinPixelLimit` og meldingen `dimensions` er fjernet, siden skjemaet ikke lenger avviser bilder over 40 megapiksler. `MAX_IMAGE_PIXELS` brukes fortsatt av `prepareImage`.
- `shrinkImage` (`image-resize.ts`) leser bildet med `createImageBitmap` også når det ikke skal skaleres, så en uleselig fil avvises som før, og målene etter orienteringen avgjør om bildet skal skaleres. Velges et nytt bilde mens det forrige leses, gjelder bare det siste.
- Avvik fra e2e-dekningen: skjemaet sender aldri en fil over 4 MiB uskalert, så testen «et bilde på nøyaktig 5 MiB går gjennom innsendingen» (`bodySizeLimit`) kan ikke lenger kjøres gjennom skjemaet. Den er byttet ut med en test der en fil på nøyaktig 4 MiB sendes uendret (forespørselen er over 4 MiB). `jpegAtLimit` er erstattet med `jpegAtResizeThreshold`.

## Verification

**Commands:**
- `npx tsc --noEmit` og `npm run lint` -- ingen feil.
- `npm run test:unit` -- grønt.
- Full `npm test` i en ny klone i Temp (Supabase-CLI er blokkert i prosjektmappen) eller i CI -- grønt.

### Review av bildeskaleringen (Blind Hunter, Edge Case Hunter og Verification Gap)

Verdiene under er mine, ikke reviewernes. Funn som gikk igjen hos flere lag står én gang.

**Patchet**
- medium: resultatet av skaleringen kunne ende mellom 4 og 5 MiB (bilde med mye støy) og stoppes da av Vercels grense på 4,5 MB. `shrinkImage` prøver nå kvaliteten 0,85, 0,7 og 0,55 og tar første som er under 4 MiB (`image-resize.ts`).
- medium: `latestPick` ble økt før typesjekken, så et avvist valg kansellerte et gyldig bilde som fortsatt ble skalert. Økes nå etter typesjekken (`image-field.tsx`).
- medium: eldre nettlesere kan kaste `TypeError` for `imageOrientation: "from-image"` (WebKit omdøpte verdien i 2023), og da ble hvert bilde «ikke et gyldig bilde». `TypeError` gir nå fila uendret, som før denne endringen; andre feil gir «ikke et gyldig bilde».
- low: ingen test viste at en gjennomsiktig PNG får hvit bakgrunn (fjernes `fillRect`, består alt). Ny e2e-test med `transparentPng` og rad for 2100 × 100 i `image-input.test.ts`.
- low: AD-9 sa som en kjensgjerning at bildet kommer under Vercels grense. Nå «etter Vercels dokumentasjon (ikke prøvd på demoen)».
- low: det gamle Story 2.4-notatet i begge `EXPERIENCE.md` sa «maks 5 MB» uten peker til det nye. Pekeren er lagt til.

**Utsatt** (se `deferred-work.md`): ingen tilbakemelding under skalering (kopitekst må velges), minnebruk for 48–50 MP, test bare i Chromium, og tre verifikasjonshull (for stort etter skalering, `latestPick`, serverens 5 MiB gjennom `bodySizeLimit`).

**Avvist**
- false: «`createImageBitmap` gir 0 × 0 eller NaN» (`resizedDimensions`). `createImageBitmap` avviser et bilde uten størrelse, så målene er alltid positive.
- false: «bildet kommer tilbake etter ‹Fjern bilde› midt i skaleringen». Det som vises, er bildet brukeren valgte sist, ikke det fjernede.
- false: «et lite bilde sendes med EXIF og GPS». Serveren fjerner all EXIF uansett (AD-9, `prepareImage`).
- low: `onImage` kalles etter at komponenten er fjernet. Ufarlig i React 18 og senere.
- low: `toBlob` kan gi en annen type enn JPEG, eller tom data ved fingerprinting-vern. JPEG støttes overalt, og et tomt resultat gir allerede `null`.
- low: «Bildet er for stort.» sier ikke hva brukeren kan gjøre. Nås nesten aldri etter kvalitetstrappen.
- low: PRD og epics blander 5 MB og 5 MiB, og 4 MiB og 2048 px står ikke som `[ANTAGELSE]`. 5 MB mot 5 MiB er eksisterende, og tallene står som «avgjort 2026-11-26».
