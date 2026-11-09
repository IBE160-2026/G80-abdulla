# Beslutningslogger

Hver planleggingsfase i BMAD fører en logg over beslutninger, endringer og antagelser, med begrunnelse. Loggene skrives fortløpende under arbeidet. Her ligger kopier, slik at det er mulig å følge hvordan planen har utviklet seg.

| Logg | Dokument | Merk |
|---|---|---|
| [brief-beslutningslogg.md](brief-beslutningslogg.md) | [product-brief.md](../product-brief.md) | Første versjon 2026-09-18, oppdatert 2026-10-11 etter faglærers tilbakemelding |
| [prd-beslutningslogg.md](prd-beslutningslogg.md) | [prd.md](../prd.md) | `override`-linjene viser hvilke tidligere beslutninger som ble endret, og hvorfor |
| [ux-beslutningslogg.md](ux-beslutningslogg.md) | [ux/](../ux/) | Valgene av stil, farger og oppførsel. Oppdatert 2026-11-06 etter PRD-vurderingen og 2026-11-09 med valgene fra Story 1.5 (detaljsiden) |
| [arkitektur-beslutningslogg.md](arkitektur-beslutningslogg.md) | [Arkitektur](../planning-artifacts/architecture/architecture-LocalFix-2026-10-28/ARCHITECTURE-SPINE.md) | Valgene bak AD-1 til AD-15, med hva som ble godkjent av meg og hva som ble utledet av KI og rettet etter vurderingene |
| [epics-beslutningslogg.md](epics-beslutningslogg.md) | [epics.md](../planning-artifacts/epics.md) | Oppdelingen i 4 epics og 18 stories, P-1 og P-2 fra personvernresearchen, og endringene fra Advanced Elicitation. Føres bare her, siden BMAD ikke lager en egen logg for epics |

Typene i loggene:
- `decision`: en beslutning. «(by user)» betyr at jeg tok valget selv blant flere alternativer. «(KI-forslag, godkjent av prosjekteier)» betyr at KI-en foreslo valget, og at jeg godkjente det etter å ha sett det.
- `assumption`: en antagelse KI-en gjorde, som skal bekreftes senere.
- `override`: en tidligere beslutning som ble endret.
- `change`: en endring i et dokument.
- `event`: en hendelse i prosessen.
- `note`: en merknad, for eksempel om hvilke kilder en fase bygde på.

Originalene ligger i BMAD-mappen `docs/planning-artifacts/`. Kopiene her oppdateres når en fase oppdateres.
