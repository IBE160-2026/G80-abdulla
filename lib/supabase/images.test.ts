// Tester signReportImage (Story 1.7, AD-9) uten Supabase: riktig bucket, sti
// og 60 sekunder, og at en feil gir null og en logglinje med bare
// statuskoden, aldri stien. Til slutt en vakttest: createSignedUrl kalles
// bare i lib/supabase/images.ts, så en reserveløsning bare endrer den filen.
// Selve policyene testes mot lokal Supabase i storage.db.test.ts.
import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const calls: { method: string; args: unknown[] }[] = [];
let result: () => Promise<unknown>;

// En falsk serverklient med kjeden storage.from(bucket).createSignedUrl(...).
vi.mock("./server", () => ({
  createClient: async () => ({
    storage: {
      from: (...args: unknown[]) => {
        calls.push({ method: "from", args });
        return {
          createSignedUrl: (...args: unknown[]) => {
            calls.push({ method: "createSignedUrl", args });
            return result();
          },
        };
      },
    },
  }),
}));

const { signReportImage } = await import("./images");

const PATH =
  "10000000-0000-4000-8000-000000000003/30000000-0000-4000-8000-000000000002.jpg";
const SIGNED_URL =
  "http://127.0.0.1:54321/storage/v1/object/sign/report-images/" + PATH + "?token=t";

beforeEach(() => {
  calls.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("signReportImage", () => {
  test("lager én lenke på 60 sekunder i bucketen report-images", async () => {
    result = async () => ({ data: { signedUrl: SIGNED_URL }, error: null });
    await expect(signReportImage(PATH)).resolves.toBe(SIGNED_URL);
    expect(calls).toEqual([
      { method: "from", args: ["report-images"] },
      { method: "createSignedUrl", args: [PATH, 60] },
    ]);
  });

  test("et objekt som mangler eller er skjult, gir null og logger bare statuskoden", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    // Slik storage-js svarer når objektet ikke finnes eller policyen skjuler
    // det (se storage.db.test.ts).
    const error = Object.assign(new Error("Object not found"), {
      name: "StorageApiError",
      status: 400,
      statusCode: "404",
      code: "NoSuchKey",
      path: PATH,
    });
    result = async () => ({ data: null, error });
    await expect(signReportImage(PATH)).resolves.toBeNull();
    expect(log).toHaveBeenCalledExactlyOnceWith("Kunne ikke lage bildelenke (404).");
    expect(JSON.stringify(log.mock.calls)).not.toContain(PATH);
    expect(JSON.stringify(log.mock.calls)).not.toContain("30000000");
  });

  test("en feil uten statuskode logger «ukjent»", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    result = async () => ({ data: null, error: new Error(`fetch failed for ${PATH}`) });
    await expect(signReportImage(PATH)).resolves.toBeNull();
    expect(log).toHaveBeenCalledExactlyOnceWith("Kunne ikke lage bildelenke (ukjent).");
  });

  test("et kall som kaster, gir null og logger uten stien", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    result = () => Promise.reject(new Error(`nettverk for ${PATH}`));
    await expect(signReportImage(PATH)).resolves.toBeNull();
    expect(log).toHaveBeenCalledExactlyOnceWith("Kunne ikke lage bildelenke (ukjent).");
    expect(JSON.stringify(log.mock.calls)).not.toContain(PATH);
  });
});

// Vakttesten leser kildefilene, som lib/no-cache.test.ts. Testfilene er
// unntatt: storage.db.test.ts tester createSignedUrl mot lokal Supabase.
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const OWNER = "lib/supabase/images.ts";

const sources = globSync(
  "{app,components,lib,e2e,scripts,supabase}/**/*.{ts,tsx,js,jsx,mjs,cjs}",
  { cwd: ROOT },
)
  .concat(globSync("*.{ts,tsx,js,jsx,mjs,cjs}", { cwd: ROOT }))
  .map((file) => file.replaceAll("\\", "/"))
  .filter((file) => !/\.(test|spec)\.[cm]?[jt]sx?$/.test(file));

test("vakttesten finner kildefilene", () => {
  expect(sources).toContain(OWNER);
  expect(sources).toContain("lib/supabase/reports.ts");
  expect(sources).toContain("app/rapporter/[id]/page.tsx");
  expect(sources).toContain("components/report-detail.tsx");
});

test("createSignedUrl kalles bare i lib/supabase/images.ts", () => {
  const users = sources.filter((file) =>
    /\bcreateSignedUrls?\b/.test(readFileSync(join(ROOT, file), "utf8")),
  );
  expect(users, "filer som bruker createSignedUrl").toEqual([OWNER]);
});
