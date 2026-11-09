# Kilder for testbildene

Testbildene i bucketen `report-images` (Story 1.6, AD-6, AD-9). Alle tre er
lastet ned fra Wikimedia Commons og har lisensen CC0 1.0 (Creative Commons
Zero, Public Domain Dedication), sjekket på originalsiden 9. november 2026.
Ingen av dem viser ansikter eller lesbare bilskilt (P-2).

Bildene er skalert ned til 1600 px på lengste side og lagret som JPEG uten
metadata (ingen EXIF eller GPS). Mappenavnet er uuid-en til forfatteren av
rapporten, og stien under `seed-images/` er lik `reports.image_path` i
`supabase/seed.sql`.

Fila ligger ved siden av `seed-images/` og ikke i den, fordi Supabase CLI
laster opp alle filer i `objects_path` til bucketen. Bucketen godtar bare
bilder, så en tekstfil der får `supabase start` og `db reset` til å feile.

| Fil | Rapport | Tittel | Opphav | Originalside | Lisens |
| --- | --- | --- | --- | --- | --- |
| `10000000-0000-4000-8000-000000000003/30000000-0000-4000-8000-000000000002.jpg` | 2, «Slukkede gatelys på gangveien» | Street lamps at the National Assembly of Quebec | Wilfredor, 3. november 2024 | <https://commons.wikimedia.org/wiki/File:Street_lamps_at_the_National_Assembly_of_Quebec.jpg> | CC0 1.0 |
| `10000000-0000-4000-8000-000000000002/30000000-0000-4000-8000-000000000003.jpg` | 3, «Hull i asfalten ved P2» | A pothole in Dilova Street in Kyiv | Роман Рябенко, 9. juli 2022 | <https://commons.wikimedia.org/wiki/File:A_pothole_in_Dilova_Street_in_Kyiv.jpg> | CC0 1.0 |
| `10000000-0000-4000-8000-000000000002/30000000-0000-4000-8000-000000000007.jpg` | 7, «Blinkende lys i trappa» (skjult) | Wall light in stairwell - NÄL hospital 1 | W.carter, 3. april 2018 | <https://commons.wikimedia.org/wiki/File:Wall_light_in_stairwell_-_N%C3%84L_hospital_1.jpg> | CC0 1.0 |

Lisensteksten: <https://creativecommons.org/publicdomain/zero/1.0/>
