// Når skjemaet henter et KI-forslag (Story 2.3): bare når brukeren forlater
// beskrivelsen, og bare når nok tekst er endret siden forrige forslag.

/** Så mange tegn må være endret siden forrige forslag for at et nytt hentes. */
export const SUGGEST_MIN_CHARS = 10;

/**
 * Hvor mye teksten er endret: lengden (i tegn, talt som kodepunkter) av den
 * delen som er forskjellig etter at felles begynnelse og slutt er fjernet, på
 * trimmet tekst. Er delene ulike lange (en erstatning), gjelder den lengste.
 * Første forslag regnes mot tom tekst: `charsChanged("", next)`.
 */
export function charsChanged(previous: string, next: string): number {
  const a = [...previous.trim()];
  const b = [...next.trim()];

  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;

  let end = 0;
  while (
    end < a.length - start &&
    end < b.length - start &&
    a[a.length - 1 - end] === b[b.length - 1 - end]
  ) {
    end++;
  }

  return Math.max(a.length - start - end, b.length - start - end);
}
