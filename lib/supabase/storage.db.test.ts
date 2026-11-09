// Signerte lenker til bildene i bucketen report-images (Story 1.6, AD-6,
// AD-9). createSignedUrl går gjennom Storage-tjenesten, som leser objektet i
// storage.objects med rollen og JWT-en til den som spør. Lenken lages bare
// når SELECT-policyen gir den som spør tilgang til objektet, så et bilde fra
// en skjult rapport får bare moderatoren lenke til. pgTAP-testene i
// supabase/tests/bilder.sql tester selve policyene. Til slutt lastes det opp
// gjennom Storage med brukerens sesjon, slik appen skal gjøre (AD-9).
//
// Krever lokal Supabase med seed-dataene og seed-bildene: kjøres av
// `npm run test:db` etter `npx supabase db reset`.
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, test } from "vitest";
import type { Database } from "./types";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

// Vitest leser ikke .env selv. lib/env.ts validerer variablene når den
// importeres, så den lastes etter at .env er lest.
loadEnvConfig(ROOT, false, { info: () => {}, error: console.error });
const { publicEnv } = await import("@/lib/env");

const BUCKET = "report-images";
// Lenkene i appen varer 60 sekunder (AD-9).
const EXPIRES_IN = 60;
const PASSWORD = "localfix-test";

// Objektnavnene er lik reports.image_path i supabase/seed.sql.
const VISIBLE_IMAGE =
  "10000000-0000-4000-8000-000000000003/30000000-0000-4000-8000-000000000002.jpg"; // rapport 2
const HIDDEN_IMAGE =
  "10000000-0000-4000-8000-000000000002/30000000-0000-4000-8000-000000000007.jpg"; // rapport 7, skjult

type Viewer = {
  name: string;
  // Uten e-post er klienten en besøkende (anon).
  email?: string;
  seesHidden: boolean;
};

const viewers: Viewer[] = [
  { name: "besøkende", seesHidden: false },
  // bruker1 er forfatter av den skjulte rapporten og ser likevel ikke bildet.
  { name: "bruker1 (forfatter av den skjulte rapporten)", email: "bruker1@localfix.test", seesHidden: false },
  { name: "bruker2", email: "bruker2@localfix.test", seesHidden: false },
  { name: "moderator", email: "moderator@localfix.test", seesHidden: true },
];

async function clientFor(viewer: Viewer): Promise<SupabaseClient<Database>> {
  const supabase = createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  if (viewer.email) {
    const { error } = await supabase.auth.signInWithPassword({
      email: viewer.email,
      password: PASSWORD,
    });
    expect(error, `innlogging feilet for ${viewer.email}`).toBeNull();
  }
  return supabase;
}

// Henter lenken uten innlogging, slik nettleseren gjør, og sjekker at den
// gir selve bildet.
async function expectImage(signedUrl: string) {
  const response = await fetch(signedUrl);
  expect(response.status).toBe(200);
  // Alle seed-bildene er JPEG.
  expect(response.headers.get("content-type")).toBe("image/jpeg");
  const body = await response.arrayBuffer();
  expect(body.byteLength).toBeGreaterThan(0);
}

describe.each(viewers)("createSignedUrl som $name", (viewer) => {
  test("lager en lenke til bildet til en synlig rapport, og lenken gir bildet", async () => {
    const supabase = await clientFor(viewer);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(VISIBLE_IMAGE, EXPIRES_IN);
    expect(error).toBeNull();
    expect(data?.signedUrl).toBeTruthy();
    await expectImage(data!.signedUrl);
    if (viewer.email) await supabase.auth.signOut();
  });

  if (viewer.seesHidden) {
    test("lager en lenke til bildet til den skjulte rapporten", async () => {
      const supabase = await clientFor(viewer);
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(HIDDEN_IMAGE, EXPIRES_IN);
      expect(error).toBeNull();
      expect(data?.signedUrl).toBeTruthy();
      await expectImage(data!.signedUrl);
      await supabase.auth.signOut();
    });
  } else {
    test("får ingen lenke til bildet til den skjulte rapporten", async () => {
      const supabase = await clientFor(viewer);
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(HIDDEN_IMAGE, EXPIRES_IN);
      expect(data).toBeNull();
      // Storage svarer som om objektet ikke finnes, så svaret sier ikke om
      // bildet er skjult eller mangler.
      expect(error).toMatchObject({ message: "Object not found" });
      if (viewer.email) await supabase.auth.signOut();
    });
  }
});

// Feilen som en plain verdi: navn, melding og egne felt som status og
// statusCode. Error.message er ikke et eget opplistbart felt og tas med for seg.
function errorShape(error: Error | null) {
  return error ? { ...error, name: error.name, message: error.message } : null;
}

const MISSING_IMAGE =
  "10000000-0000-4000-8000-000000000002/30000000-0000-4000-8000-0000000000ff.jpg";

describe.each([viewers[0], viewers[2]])(
  "createSignedUrl som $name: skjult og manglende bilde",
  (viewer) => {
    test("gir nøyaktig samme feil, så svaret sier ikke om bildet er skjult", async () => {
      const supabase = await clientFor(viewer);
      const hidden = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(HIDDEN_IMAGE, EXPIRES_IN);
      const missing = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(MISSING_IMAGE, EXPIRES_IN);
      expect(hidden.data).toBeNull();
      expect(missing.data).toBeNull();
      expect(hidden.error).not.toBeNull();
      expect(errorShape(hidden.error)).toEqual(errorShape(missing.error));
      if (viewer.email) await supabase.auth.signOut();
    });
  },
);

// Opplasting gjennom Storage-API-et med brukerens sesjon, slik appen gjør
// (AD-9). Ingen rapport peker på filen ennå. Objektene blir liggende til neste
// `db reset`, som `npm run test:db` kjører først.
describe("upload som bruker1", () => {
  const BRUKER1 = "10000000-0000-4000-8000-000000000002";
  const BRUKER2 = "10000000-0000-4000-8000-000000000003";
  const jpeg = readFileSync(`${ROOT}supabase/seed-images/${HIDDEN_IMAGE}`);
  const bruker1 = viewers[1];

  test("laster opp en JPEG i egen mappe", async () => {
    const supabase = await clientFor(bruker1);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(`${BRUKER1}/${randomUUID()}.jpg`, jpeg, { contentType: "image/jpeg" });
    expect(error).toBeNull();
    expect(data?.path).toMatch(new RegExp(`^${BRUKER1}/`));
    await supabase.auth.signOut();
  });

  test("kan ikke laste opp i en annens mappe", async () => {
    const supabase = await clientFor(bruker1);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(`${BRUKER2}/${randomUUID()}.jpg`, jpeg, { contentType: "image/jpeg" });
    expect(data).toBeNull();
    // INSERT-policyen avviser raden (42501 i databasen, 403 fra Storage).
    expect(error).toMatchObject({
      message: "new row violates row-level security policy",
      statusCode: "403",
    });
    await supabase.auth.signOut();
  });

  test("bucketen avviser en tekstfil, også i egen mappe", async () => {
    const supabase = await clientFor(bruker1);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(`${BRUKER1}/${randomUUID()}.txt`, "ikke et bilde", { contentType: "text/plain" });
    expect(data).toBeNull();
    // Bucketen godtar bare JPEG, PNG og WebP (allowed_mime_types i config.toml).
    expect(error).toMatchObject({ statusCode: "415", code: "InvalidMimeType" });
    await supabase.auth.signOut();
  });
});
