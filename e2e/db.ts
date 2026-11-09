import { execSync } from "node:child_process";
import { join } from "node:path";

// Hjelpere for testene i prosjektet reset (AD-15). De kjører Supabase CLI som
// postgres mot den lokale databasen, uten tjenestenøkkelen i appen (AD-11).
// execSync går gjennom skallet, så npx virker også på Windows.

const FIXTURES = join(__dirname, "fixtures");

// Under RESET_TIMEOUT i e2e/reset/liste.spec.ts, så en kommando som henger,
// gir en feilmelding herfra og ikke bare en testtimeout.
const COMMAND_TIMEOUT = 170_000;

function run(command: string) {
  try {
    execSync(command, { stdio: "pipe", timeout: COMMAND_TIMEOUT });
  } catch (error) {
    // CLI-en skriver selve feilen (for eksempel SQL-feilen) på stdout.
    // message har resten, for eksempel timeout eller at npx ikke startet.
    const { stdout, stderr } = error as { stdout?: Buffer; stderr?: Buffer };
    throw new Error(
      `${command} feilet: ${(error as Error).message}\n${stdout?.toString() ?? ""}${stderr?.toString() ?? ""}`,
    );
  }
}

/** Tilbakestiller den lokale databasen til migreringene og seed-dataene. */
export function resetDb() {
  run("npx supabase db reset");
}

/** Kjører en SQL-fil fra e2e/fixtures/ mot den lokale databasen. */
export function runSqlFile(file: string) {
  run(`npx supabase db query --local --file "${join(FIXTURES, file)}"`);
}
