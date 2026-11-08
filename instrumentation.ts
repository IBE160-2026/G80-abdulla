// Next.js kjører register() én gang når serveren starter. Importen validerer
// Supabase-variablene, og serverEnv() validerer KI-variablene, så en feil i
// .env stopper oppstarten i stedet for å dukke opp ved første forespørsel.
export async function register() {
  const { serverEnv } = await import("@/lib/env");
  serverEnv();
}
