// Genererer lib/supabase/database.types.ts fra den lokale databasen (AR-10).
//
//   node scripts/db-types.mjs           skriver fila (npm run db:types)
//   node scripts/db-types.mjs --check   feiler hvis fila ikke er lik det
//                                       databasen gir (kjøres av test:db)
//
// Utskriften fra `supabase gen types` skrives først til en midlertidig fil og
// erstatter den gamle bare når kommandoen lyktes, så en feil aldri etterlater
// en tom eller halv fil. Virker på Windows, macOS og Linux.
import { spawnSync } from "node:child_process";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TARGET = fileURLToPath(
  new URL("../lib/supabase/database.types.ts", import.meta.url),
);
const check = process.argv.includes("--check");

// npx er en .cmd-fil på Windows og må startes via skallet der.
const result = spawnSync(
  "npx",
  ["supabase", "gen", "types", "typescript", "--local", "--schema", "public"],
  {
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 16 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"],
  },
);

if (result.error || result.status !== 0 || !result.stdout.trim()) {
  console.error(
    "supabase gen types feilet. Kjører lokal Supabase (npx supabase start)?",
  );
  if (result.error) console.error(result.error.message);
  process.exit(1);
}

const generated = result.stdout;

if (check) {
  // Git kan ha sjekket ut fila med CRLF på Windows, så linjeskift teller ikke.
  const normalize = (text) => text.replace(/\r\n/g, "\n");
  let current = "";
  try {
    current = readFileSync(TARGET, "utf8");
  } catch {
    // Mangler fila, er den ikke lik.
  }
  if (normalize(current) !== normalize(generated)) {
    console.error(
      "lib/supabase/database.types.ts er ikke lik skjemaet i databasen. Kjør `npm run db:types` og commit fila.",
    );
    process.exit(1);
  }
  console.log("lib/supabase/database.types.ts er lik skjemaet i databasen.");
} else {
  const temporary = `${TARGET}.tmp`;
  writeFileSync(temporary, generated);
  renameSync(temporary, TARGET);
  console.log("Skrev lib/supabase/database.types.ts.");
}
