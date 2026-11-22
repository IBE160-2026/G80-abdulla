import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Hjelpere for testene i prosjektet reset (AD-15). De kjører Supabase CLI som
// postgres mot den lokale databasen, uten tjenestenøkkelen i appen (AD-11).
// execSync går gjennom skallet, så npx virker også på Windows.

const FIXTURES = join(__dirname, "fixtures");

// Under RESET_TIMEOUT, så en kommando som henger,
// gir en feilmelding herfra og ikke bare en testtimeout.
const COMMAND_TIMEOUT = 170_000;

/** Testtiden for en test i prosjektet reset. `db reset` tar rundt et halvt minutt. */
export const RESET_TIMEOUT = 180_000;

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Sletter én rapport rett i den lokale databasen, som postgres (ingen klient
 * kan slette, og postgres omgår RLS). Bruk den bare på en rapport testen selv
 * har laget. `id` må være en uuid, siden den settes rett inn i SQL-en. Setningen
 * går via en midlertidig fil, så anførselstegn ikke avhenger av skallet.
 */
export function deleteReportRow(id: string) {
  if (!UUID.test(id)) throw new Error(`deleteReportRow: ${id} er ikke en uuid.`);
  const dir = mkdtempSync(join(tmpdir(), "localfix-sql-"));
  try {
    const file = join(dir, "delete-report.sql");
    writeFileSync(file, `delete from public.reports where id = '${id}';`);
    run(`npx supabase db query --local --file "${file}"`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Kjører en SQL-fil fra e2e/fixtures/ mot den lokale databasen. */
export function runSqlFile(file: string) {
  run(`npx supabase db query --local --file "${join(FIXTURES, file)}"`);
}
