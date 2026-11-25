/**
 * Gjør `next` fra en lenke om til en trygg sti i appen (AD-3, AR-13).
 *
 * Adressen tolkes slik nettleseren gjør det, og godtas bare når den peker til
 * samme opprinnelse som `origin`. Ellers gir funksjonen `/`. Det er ikke nok
 * å sjekke at den starter med `/`: nettleseren fjerner tab og linjeskift og
 * leser `\` som `/`, så `/\tevil.example` og `/\evil.example` blir `//evil.example`,
 * som er et annet nettsted.
 *
 * Svaret er stien slik URL-parseren normaliserer den, så tegnene som ble
 * fjernet, aldri sendes videre til `redirect()`. Normaliseringen fjerner også
 * punktsegmenter, så `/..//evil.example` har samme opprinnelse, men gir stien
 * `//evil.example`, som nettleseren leser som et annet nettsted. En normalisert
 * sti som starter med `//`, gir derfor `/`.
 */
export function safeNextPath(next: string | null, origin: string): string {
  if (!next) return "/";
  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) return "/";
    const path = `${url.pathname}${url.search}${url.hash}`;
    return path.startsWith("//") ? "/" : path;
  } catch {
    return "/";
  }
}
