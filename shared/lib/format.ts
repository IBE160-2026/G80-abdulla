// Formatering av tid og antall for visning (AD-10). Eneste sted relativ tid,
// dato med klokkeslett og flertall lages. Alle funksjonene er rene.
// formatRelativeTime får `now` som parameter, så den kan testes med faste
// tidspunkter.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Relativ tid for rapportkortet, for eksempel «2 dager siden». Skalaen er
 * beslutningen i Story 1.4 (også i EXPERIENCE.md): under ett minutt, eller
 * fram i tid, er «nå». En måned er 30 døgn og et år 365 døgn. Alle tall
 * rundes ned.
 */
export function formatRelativeTime(iso: string, now: Date): string {
  const elapsed = now.getTime() - new Date(iso).getTime();
  // Også NaN (ugyldig tidspunkt) blir «nå», så kortet aldri viser «NaN».
  if (!(elapsed >= MINUTE)) return "nå";

  if (elapsed < HOUR) {
    return `${plural(Math.floor(elapsed / MINUTE), "minutt", "minutter")} siden`;
  }
  if (elapsed < DAY) {
    return `${plural(Math.floor(elapsed / HOUR), "time", "timer")} siden`;
  }
  const days = Math.floor(elapsed / DAY);
  if (days < 7) return `${plural(days, "dag", "dager")} siden`;
  if (days < 30) return `${plural(Math.floor(days / 7), "uke", "uker")} siden`;
  if (days < 365) {
    return `${plural(Math.floor(days / 30), "måned", "måneder")} siden`;
  }
  return `${plural(Math.floor(days / 365), "år", "år")} siden`;
}

// Satt sammen fra formatToParts nedenfor, så en annen ICU-versjon ikke endrer
// skilletegnene. hourCycle h23 gir «00» ved midnatt, aldri «24».
const DATE_TIME = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Oslo",
});

/**
 * Dato og klokkeslett i norsk tid, uten årstall, for eksempel
 * «4. november kl. 14:20». Brukes til «Sist oppdatert» og «Registrert» på
 * detaljsiden (FR-8).
 */
export function formatDateTime(iso: string): string {
  const parts = DATE_TIME.formatToParts(new Date(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("day")}. ${part("month")} kl. ${part("hour")}:${part("minute")}`;
}

/** Antallet over lista: «1 rapport» eller «N rapporter». */
export function formatReportCount(count: number): string {
  return plural(count, "rapport", "rapporter");
}
