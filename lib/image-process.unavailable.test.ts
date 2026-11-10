// Tester prepareImage når `sharp` ikke lar seg laste (Story 2.4), for eksempel
// fordi en annen maskin blokkerer den native filen. Pakken lastes først når et
// bilde skal behandles, så modulen kan importeres, en fil med feil signatur
// avvises uten at sharp trengs, og en fil som ser riktig ut, gir `unavailable`
// (en feil på serveren, ikke i fila). sharp er stubbet og kaster ved lasting.
import { describe, expect, test, vi } from "vitest";

vi.mock("sharp", () => {
  throw new Error("Could not load the sharp module using the win32-x64 runtime");
});

const { prepareImage } = await import("./image-process");

const blob = (bytes: Buffer | string) => new Blob([bytes as BlobPart], { type: "image/jpeg" });

// De første byte i en JPEG, PNG og WebP, uten noe bilde etter.
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(100)]);
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(100),
]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.from([0x60, 0, 0, 0]),
  Buffer.from("WEBP"),
  Buffer.alloc(100),
]);

describe("sharp kan ikke lastes", () => {
  test("modulen lastes, så resten av actions.ts virker", () => {
    expect(typeof prepareImage).toBe("function");
  });

  test.each([
    { name: "JPEG", bytes: JPEG },
    { name: "PNG", bytes: PNG },
    { name: "WebP", bytes: WEBP },
  ])("et bilde som ser ut som $name gir unavailable", async ({ bytes }) => {
    expect(await prepareImage(blob(bytes))).toEqual({ ok: false, reason: "unavailable" });
  });

  test("tom fil, for stor fil og feil signatur avvises uten at sharp trengs", async () => {
    expect(await prepareImage(blob(Buffer.alloc(0)))).toEqual({ ok: false, reason: "empty" });
    expect(await prepareImage(blob(Buffer.alloc(5 * 1024 * 1024 + 1)))).toEqual({
      ok: false,
      reason: "too_large",
    });
    // Bevis for at SVG, GIF og tekst aldri når sharp (eller dens parsere).
    expect(
      await prepareImage(blob('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>')),
    ).toEqual({ ok: false, reason: "type" });
    expect(await prepareImage(blob(Buffer.from("GIF89a" + "x".repeat(50), "latin1")))).toEqual({
      ok: false,
      reason: "type",
    });
  });
});
