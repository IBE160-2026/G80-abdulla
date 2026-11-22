# Sjekkliste: README på en ren maskin

Dette er en sjekkliste for deg som skal prøve å starte LocalFix etter [README](../README.md), uten å kjenne prosjektet. Formålet er å finne ut om README holder for en sensor som starter appen og kjører testene uten hjelp fra gruppen (SM-7). Du tester README, ikke deg selv. Alt som er uklart, mangler eller står feil, er et funn.

## Regler for testen

- **Følg bare README.** Ikke les andre filer i repoet, og ikke spør den som lagde appen om hjelp underveis. Setter du deg fast, skriv det ned i stedet (del 2) og prøv å komme videre med det README sier.
- **Skriv ned hvert sted du nøler**, også når du løser det selv. «Jeg gjettet at …» er et like godt funn som en feilmelding.
- **Skriv ned tid per steg.** Bruk en stoppeklokke eller klokka. Tidene under er målt på Windows, første gang, uten Docker-bilder eller Chromium fra før (2026-11-22).
- **Regn med 45 minutter**, mest nedlasting og ventetid. Det siste steget (`npm test`) tar rundt 15 minutter og kan hoppes over hvis du ikke har tid. Skriv det i så fall.
- Trenger du **Docker Desktop**, må du installere det først. README sier hvordan.

## Del 0: Om deg og maskinen

| | Svar |
|---|---|
| Dato | |
| Operativsystem og versjon (for eksempel Windows 11, macOS 15, Ubuntu 24.04) | |
| Docker Desktop fra før? Versjon | |
| Node.js fra før? Versjon (`node --version`) | |
| Omtrentlig internettfart (Mbit/s), eller «ukjent» | |
| Kjente du prosjektet fra før? (Skal være nei) | |
| Hadde du Docker-bilder eller Playwright-nettleseren fra et annet prosjekt? | |

## Del 1: Stegene

Kryss av og skriv tid. Bruk ✔ (gikk), ✘ (gikk ikke) eller ? (usikker, skriv hvorfor i del 2).

| # | Steg (README-seksjon) | Forventet | Din tid | ✔ ✘ ? |
|---|---|---|---|---|
| 1 | Docker Desktop kjører, og `docker run hello-world` virker («1. Installer Docker Desktop først») | – | | |
| 2 | `node --version` viser v24, og `npm --version` og `git --version` virker («2. Forutsetninger»). Har du en annen Node-versjon, følg det README sier | – | | |
| 3 | `git clone` av repoet (på Windows: til en kort sti som `C:\dev`) («3. Start appen») | 6 s | | |
| 4 | `npm ci` | 40 s | | |
| 5 | `npx supabase start`. Første gang laster den ned sju Docker-bilder. Meldingen `toomanyrequests: Rate exceeded` kan komme, og README sier hva du gjør | 3–8 min (7 min 25 s målt) | | |
| 6 | `cp .env.example .env` | umiddelbart | | |
| 7 | `npm run dev`, og åpne [http://localhost:3000](http://localhost:3000). Lista skal vise **åtte** rapporter, nyeste først | rundt 20 s til første side | | |
| 8 | Logg inn som en av testbrukerne i tabellen «Testbrukere» («Logg inn»), for eksempel `bruker1@localfix.test` | – | | |
| 9 | Prøv appen som i «Bruke appen»: filtrer og sorter lista, åpne en rapport, trykk «Jeg har også sett dette» på en annens rapport, og registrer en ny rapport (beskrivelse, sted, kategori, eventuelt bilde). KI-en er i mock-modus, så forslaget er et fast svar | – | | |
| 10 | Logg ut og inn som `moderator@localfix.test` («Som moderator»): flytt en rapport ett steg i status, skjul den, og vis den igjen | – | | |
| 11 | Stopp appen (Ctrl+C) og les «Stopp og start igjen» | – | | |
| 12 | `npx playwright install chromium` («Kjør testene») | 2 min 30 s | | |
| 13 | `npm test`. Skriv antall bestått og eventuelt feilet. **Kan hoppes over** | rundt 15 min første gang (alle bestått) | | |

Skriv totaltiden fra du begynte på steg 3 til du var ferdig: ______

## Del 2: Der du stoppet, nølte eller gjettet

Fyll ut én linje per hendelse. Skriv i steg-kolonnen nummeret fra del 1.

| Steg | Hva README sa, eller ikke sa | Hva som skjedde | Hva du gjorde |
|---|---|---|---|
| | | | |
| | | | |
| | | | |

## Del 3: Spørsmål

1. Fant du alt du trengte i README, uten å lete andre steder?
2. Hva var mest forvirrende, eller tok lengst tid å finne ut?
3. Var det noe i README som sto feil, eller som var ute av dato?
4. Hva manglet?
5. Kunne du ha vurdert appen som en sensor etter dette, og hva ville du ha lurt på?
6. Hva ville du ha endret først i README?

## Del 4: Send tilbake

Send den utfylte sjekklisten til prosjekteieren (kopier den inn i en melding, eller send fila). Prosjekteieren fører resultatet inn i raden for SM-7 i [docs/testdekning.md](testdekning.md) og retter README der den var uklar.
