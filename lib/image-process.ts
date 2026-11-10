import type { Sharp } from "sharp";
import type { ImageType } from "./image-input";
import { IMAGE_MAX_BYTES, MAX_IMAGE_PIXELS } from "./limits";

// Behandlingen av et bilde på serveren (Story 2.4, AD-9, P-1). Bare for
// Server Actions: `sharp` er en native pakke, og komponenter importerer ikke
// denne filen (vakt i components/report-form.test.ts). `sharp` lastes først
// når et bilde skal behandles, så en maskin der pakken ikke lar seg laste (for
// eksempel blokkert av programkontroll), bare mister bildene og ikke hele
// `actions.ts`: rapporter uten bilde virker som før.

export type PreparedImage = {
  bytes: Buffer;
  /** Endelsen i stien, fra bildetypen funnet i fila, aldri fra filnavnet. */
  ext: "jpg" | "png" | "webp";
  contentType: ImageType;
};

export type PrepareImageResult =
  | { ok: true; image: PreparedImage }
  | {
      ok: false;
      /** `unavailable` er en feil på serveren (sharp kan ikke lastes), ikke i fila. */
      reason: "empty" | "type" | "too_large" | "unreadable" | "dimensions" | "unavailable";
    };

const FORMATS = {
  jpeg: { ext: "jpg", contentType: "image/jpeg" },
  png: { ext: "png", contentType: "image/png" },
  webp: { ext: "webp", contentType: "image/webp" },
} as const satisfies Record<string, { ext: PreparedImage["ext"]; contentType: ImageType }>;

type Format = keyof typeof FORMATS;

/**
 * Sjekker de første byte mot signaturen til JPEG (`FF D8 FF`), PNG
 * (`89 50 4E 47 0D 0A 1A 0A`) og WebP (`RIFF`, fire byte lengde, `WEBP`). `sharp`
 * leser ellers også SVG, TIFF, HEIF og AVIF, og de parserne skal aldri få
 * upålitelige byte fra en bruker som ikke har sendt et av de tre formatene.
 */
function hasAllowedSignature(bytes: Buffer): boolean {
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png =
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp =
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("latin1") === "RIFF" &&
    bytes.subarray(8, 12).toString("latin1") === "WEBP";
  return jpeg || png || webp;
}

/** Laster `sharp`, eller `null` når pakken ikke lar seg laste. */
async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    return null;
  }
}

/**
 * Validerer og renser et opplastet bilde. Rekkefølgen: størrelsen sjekkes før
 * noe leses, så sjekkes signaturen i de første byte (bare JPEG, PNG og WebP
 * slippes til `sharp`), og så leser `sharp` typen fra innholdet. Alt utenom de
 * tre formatene avvises. `limitInputPixels` stopper bilder med svært store
 * dimensjoner før de dekodes. Bildet rettes etter EXIF-orienteringen og skrives
 * ut i samme format uten metadata (EXIF, GPS, enhet, tidspunkt), så det står
 * riktig vei uten at noe avslører hvor eller når det ble tatt. Bare første
 * bilde i en animert fil beholdes.
 *
 * Gjenkodingen kan i sjeldne tilfeller gi en større fil. Over grensen gir det
 * `too_large`.
 */
export async function prepareImage(file: Blob): Promise<PrepareImageResult> {
  if (file.size === 0) return { ok: false, reason: "empty" };
  if (file.size > IMAGE_MAX_BYTES) return { ok: false, reason: "too_large" };

  let input: Buffer;
  try {
    input = Buffer.from(await file.arrayBuffer());
  } catch {
    return { ok: false, reason: "unreadable" };
  }
  // Størrelsen over er oppgitt av klienten. Den leste lengden er den som teller.
  if (input.length === 0) return { ok: false, reason: "empty" };
  if (input.length > IMAGE_MAX_BYTES) return { ok: false, reason: "too_large" };
  if (!hasAllowedSignature(input)) return { ok: false, reason: "type" };

  const sharp = await loadSharp();
  if (!sharp) return { ok: false, reason: "unavailable" };

  try {
    const options = { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "error" } as const;
    const metadata = await sharp(input, options).metadata();
    const format = metadata.format;
    if (!format || !(format in FORMATS)) return { ok: false, reason: "type" };

    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    if (width <= 0 || height <= 0) return { ok: false, reason: "unreadable" };
    if (width * height > MAX_IMAGE_PIXELS) return { ok: false, reason: "dimensions" };

    // Uten withMetadata() skriver sharp ingen metadata. rotate() uten argument
    // retter etter EXIF-orienteringen og fjerner den.
    const pipeline = sharp(input, options).rotate();
    const bytes = await encode(pipeline, format as Format);
    if (bytes.length === 0) return { ok: false, reason: "unreadable" };
    if (bytes.length > IMAGE_MAX_BYTES) return { ok: false, reason: "too_large" };

    const { ext, contentType } = FORMATS[format as Format];
    return { ok: true, image: { bytes, ext, contentType } };
  } catch (error) {
    // Pikselgrensen gir en egen feil. Alt annet er en fil som ikke kan leses.
    // Meldingen kan nevne filen, så den leses bare for å skille de to tilfellene.
    const message = error instanceof Error ? error.message : "";
    if (/pixel limit/i.test(message)) return { ok: false, reason: "dimensions" };
    return { ok: false, reason: "unreadable" };
  }
}

function encode(pipeline: Sharp, format: Format): Promise<Buffer> {
  switch (format) {
    case "jpeg":
      return pipeline.jpeg({ quality: 90 }).toBuffer();
    case "png":
      return pipeline.png().toBuffer();
    case "webp":
      return pipeline.webp({ quality: 90 }).toBuffer();
  }
}
