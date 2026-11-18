// Enkel språkhjelp for SM-5 (Story 2.5): finner ord som er vanlige i nynorsk
// eller dansk, men ikke i norsk bokmål. Treffet er bare en merknad til den som
// leser oppsummeringene. Det er aldri en dom, og et tomt resultat betyr ikke at
// teksten er bokmål. Ord som er riktige i begge språk («ikke», «være», «også»)
// står ikke med.

const NYNORSK = [
  "ikkje",
  "eg",
  "noko",
  "nokon",
  "kva",
  "korleis",
  "mykje",
  "vere",
  "dei",
  "ein",
  "frå",
  "berre",
  "kvar",
  "øydelagt",
  "òg",
  "difor",
  "ho",
  "me",
  "sjå",
  "vore",
  "nokre",
  "heile",
  "gjer",
];

const DANSK = [
  "jeg",
  "mig",
  "dig",
  "af",
  "hvad",
  "efter",
  "nogen",
  "noget",
  "meget",
  "blevet",
  "fortovet",
  "skraldespand",
  "affald",
  "vejen",
  "gaden",
  "hul",
  "bliver",
  "nogle",
];

function matches(raw: string, words: readonly string[]): string[] {
  const text = raw.normalize("NFC");
  const found = new Set<string>();
  for (const word of words) {
    if (new RegExp(`(?<![\\p{L}\\p{N}])${word}(?![\\p{L}\\p{N}])`, "iu").test(text)) {
      found.add(word);
    }
  }
  return [...found];
}

export type LanguageHint = { nynorsk: string[]; dansk: string[] };

/** Ordene i teksten som peker mot nynorsk eller dansk. */
export function languageHint(text: string): LanguageHint {
  return { nynorsk: matches(text, NYNORSK), dansk: matches(text, DANSK) };
}

/** Sant når teksten har minst ett ord som peker mot nynorsk eller dansk. */
export function isSuspect(text: string): boolean {
  const hint = languageHint(text);
  return hint.nynorsk.length > 0 || hint.dansk.length > 0;
}
