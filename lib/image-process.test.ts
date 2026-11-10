// Tester prepareImage (Story 2.4, AD-9, P-1): typen leses fra innholdet og gir
// endelsen, EXIF (med oppdiktet GPS satt med sharp) er borte, bildet står riktig
// vei, og tom, ødelagt, feil type, for stor og svært stor fil avvises.
import sharp from "sharp";
import { describe, expect, test } from "vitest";
import { prepareImage } from "./image-process";
import { IMAGE_MAX_BYTES } from "./limits";
import {
  EXIF_WORDS,
  FAKE_GPS,
  gif,
  hugePng,
  jpegOfSize,
  jpegWithExif,
} from "./test-images";

const blob = (bytes: Buffer | Uint8Array | string, type = "image/jpeg") =>
  new Blob([bytes as BlobPart], { type });

const base = (width = 40, height = 20) => ({
  create: { width, height, channels: 3 as const, background: "#cc0000" },
});

describe("typen fra innholdet", () => {
  test.each([
    { format: "jpeg", ext: "jpg", contentType: "image/jpeg" },
    { format: "png", ext: "png", contentType: "image/png" },
    { format: "webp", ext: "webp", contentType: "image/webp" },
  ] as const)("$format gir endelsen $ext", async ({ format, ext, contentType }) => {
    const bytes = await sharp(base())[format]().toBuffer();
    const result = await prepareImage(blob(bytes, "application/octet-stream"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.image.ext).toBe(ext);
    expect(result.image.contentType).toBe(contentType);
    expect((await sharp(result.image.bytes).metadata()).format).toBe(format);
  });

  test("endelsen kommer fra innholdet, ikke fra typen klienten oppga", async () => {
    // JPEG-innhold med typen image/png (og et filnavn som .png) gir .jpg.
    const bytes = await sharp(base()).jpeg().toBuffer();
    const result = await prepareImage(Object.assign(blob(bytes, "image/png"), { name: "bilde.png" }));
    expect(result.ok && result.image.ext).toBe("jpg");
    expect(result.ok && result.image.contentType).toBe("image/jpeg");
  });
});

describe("EXIF og orientering", () => {
  test("testbildet har EXIF med GPS, enhet og tidspunkt før behandling", async () => {
    const input = await jpegWithExif();
    expect((await sharp(input).metadata()).exif).toBeDefined();
    for (const word of ["Exif", "Testkamera", "2020:01:01"]) {
      expect(input.includes(Buffer.from(word))).toBe(true);
    }
  });

  test("den lagrede fila har ingen EXIF, ingen GPS, ingen enhet og intet tidspunkt", async () => {
    const result = await prepareImage(blob(await jpegWithExif()));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const out = result.image.bytes;
    expect((await sharp(out).metadata()).exif).toBeUndefined();
    for (const word of EXIF_WORDS) {
      expect(out.includes(Buffer.from(word))).toBe(false);
    }
  });

  test.each(["png", "webp"] as const)("EXIF i %s fjernes også", async (format) => {
    const input = await sharp(base())[format]().withExif({ IFD0: { Make: "Testkamera" }, IFD3: FAKE_GPS }).toBuffer();
    expect(input.includes(Buffer.from("Testkamera"))).toBe(true);
    const result = await prepareImage(blob(input));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.image.bytes.includes(Buffer.from("Testkamera"))).toBe(false);
    expect((await sharp(result.image.bytes).metadata()).exif).toBeUndefined();
  });

  test("orientering 6 gir et bilde som står riktig vei, uten orienteringsmerke", async () => {
    const input = await jpegWithExif({ orientation: 6 });
    const before = await sharp(input).metadata();
    expect([before.orientation, before.width, before.height]).toEqual([6, 40, 20]);

    const result = await prepareImage(blob(input));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const after = await sharp(result.image.bytes).metadata();
    expect([after.width, after.height]).toEqual([20, 40]);
    expect(after.orientation).toBeUndefined();
  });
});

describe("avvisninger", () => {
  test("en tom fil", async () => {
    expect(await prepareImage(blob(Buffer.alloc(0)))).toEqual({ ok: false, reason: "empty" });
  });

  test.each([
    { name: "GIF", bytes: () => gif() },
    { name: "TIFF", bytes: () => sharp(base()).tiff().toBuffer() },
    { name: "AVIF", bytes: () => sharp(base()).avif().toBuffer() },
    {
      name: "SVG",
      bytes: async () => Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'),
    },
  ])("$name avvises som feil type, også med typen image/jpeg", async ({ bytes }) => {
    // Signaturen i de første byte avvises før sharp leser noe.
    expect(await prepareImage(blob(await bytes(), "image/jpeg"))).toEqual({
      ok: false,
      reason: "type",
    });
  });

  test("tekst omdøpt til JPEG har ingen bildesignatur", async () => {
    expect(await prepareImage(blob("dette er ikke et bilde"))).toEqual({
      ok: false,
      reason: "type",
    });
  });

  test("tilfeldige byte har ingen bildesignatur", async () => {
    const noise = Buffer.alloc(2000);
    for (let i = 0; i < noise.length; i++) noise[i] = (i * 131 + 7) % 256;
    expect(await prepareImage(blob(noise))).toEqual({ ok: false, reason: "type" });
  });

  test("en RIFF-fil som ikke er WebP (WAV) avvises som feil type", async () => {
    const wav = Buffer.concat([
      Buffer.from("RIFF", "latin1"),
      Buffer.from([0x24, 0, 0, 0]),
      Buffer.from("WAVEfmt ", "latin1"),
      Buffer.alloc(32),
    ]);
    expect(await prepareImage(blob(wav))).toEqual({ ok: false, reason: "type" });
  });

  test.each([
    { name: "JPEG", head: Buffer.from([0xff, 0xd8, 0xff, 0xe0]) },
    { name: "PNG", head: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
    {
      name: "WebP",
      head: Buffer.concat([Buffer.from("RIFF"), Buffer.from([0x20, 0, 0, 0]), Buffer.from("WEBP")]),
    },
  ])("riktig $name-signatur med søppel etter er ikke et gyldig bilde", async ({ head }) => {
    const junk = Buffer.concat([head, Buffer.alloc(200, 0x41)]);
    expect(await prepareImage(blob(junk))).toEqual({ ok: false, reason: "unreadable" });
  });

  test("en avkortet JPEG er ikke et gyldig bilde", async () => {
    const full = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 3,
        background: "#808080",
        noise: { type: "gaussian", mean: 128, sigma: 60 },
      },
    })
      .jpeg()
      .toBuffer();
    const result = await prepareImage(blob(full.subarray(0, Math.floor(full.length / 2))));
    expect(result).toEqual({ ok: false, reason: "unreadable" });
  });
});

describe("størrelse", () => {
  test("nøyaktig 5 MiB godtas", async () => {
    const input = await jpegOfSize(IMAGE_MAX_BYTES);
    expect(input.length).toBe(5_242_880);
    const result = await prepareImage(blob(input));
    expect(result.ok).toBe(true);
  });

  test("5 MiB + 1 byte avvises uten å leses", async () => {
    const input = await jpegOfSize(IMAGE_MAX_BYTES + 1);
    let read = false;
    const file = Object.assign(blob(input), {
      arrayBuffer: async () => {
        read = true;
        return new ArrayBuffer(0);
      },
    });
    expect(await prepareImage(file)).toEqual({ ok: false, reason: "too_large" });
    expect(read).toBe(false);
  });

  test("lengden som leses teller, ikke størrelsen klienten oppga", async () => {
    const input = await jpegOfSize(IMAGE_MAX_BYTES + 1);
    const file = { size: 100, arrayBuffer: async () => input.buffer.slice(0) } as unknown as Blob;
    expect(await prepareImage(file)).toEqual({ ok: false, reason: "too_large" });
  });
});

describe("store dimensjoner", () => {
  test("en liten PNG på 20000 × 20000 piksler avvises uten å dekodes", async () => {
    const png = await hugePng(20000, 20000);
    expect(png.length).toBeLessThan(IMAGE_MAX_BYTES);
    // Dekoding ville tatt 400 MB. Pikselgrensen stopper bildet før det.
    expect(await prepareImage(blob(png, "image/png"))).toEqual({ ok: false, reason: "dimensions" });
  }, 30_000);

  test("40 megapiksler godtas, 40 megapiksler + 1 rad avvises", async () => {
    const inside = await hugePng(8000, 5000);
    const outside = await hugePng(8000, 5001);
    expect((await prepareImage(blob(inside, "image/png"))).ok).toBe(true);
    expect(await prepareImage(blob(outside, "image/png"))).toEqual({
      ok: false,
      reason: "dimensions",
    });
  }, 60_000);
});
