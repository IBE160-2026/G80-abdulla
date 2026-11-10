// Testbilder for Vitest og Playwright (Story 2.4). Alle lages med sharp, så ingen
// binære testfiler ligger i repoet, og ingen av dem viser en ekte posisjon eller
// et ekte tidspunkt: GPS-koordinatene er oppdiktet og satt med sharp. Appen
// importerer aldri denne filen.
import { crc32, createDeflate } from "node:zlib";
import sharp from "sharp";
import { IMAGE_MAX_BYTES } from "./limits";

/** En posisjon midt i Oslofjorden. Oppdiktet, ikke et ekte sted. */
export const FAKE_GPS = {
  GPSLatitudeRef: "N",
  GPSLatitude: "59/1 30/1 0/1",
  GPSLongitudeRef: "E",
  GPSLongitude: "10/1 30/1 0/1",
} as const;

/** Ord som står i EXIF-en i `jpegWithExif`, og som ikke skal finnes i en lagret fil. */
export const EXIF_WORDS = ["Exif", "Testkamera", "Modell X", "2020:01:01"] as const;

const plain = (width: number, height: number) => ({
  create: { width, height, channels: 3 as const, background: "#cc0000" },
});

/** En gyldig JPEG uten metadata. */
export function plainJpeg(width = 40, height = 20): Promise<Buffer> {
  return sharp(plain(width, height)).jpeg().toBuffer();
}

/**
 * En JPEG med oppdiktet GPS, enhetsnavn og tidspunkt, og eventuelt en
 * EXIF-orientering (6 betyr at bildet må roteres 90 grader).
 */
export function jpegWithExif(
  { width = 40, height = 20, orientation }: { width?: number; height?: number; orientation?: number } = {},
): Promise<Buffer> {
  let pipeline = sharp(plain(width, height)).jpeg();
  if (orientation) pipeline = pipeline.withMetadata({ orientation });
  return pipeline
    .withExif({
      IFD0: { Make: "Testkamera", Model: "Modell X", DateTime: "2020:01:01 10:00:00" },
      IFD3: FAKE_GPS,
    })
    .toBuffer();
}

/** En gyldig JPEG polstret med nullbyte etter bildet, til nøyaktig `size` byte. */
export async function jpegOfSize(size: number): Promise<Buffer> {
  const jpeg = await plainJpeg();
  return Buffer.concat([jpeg, Buffer.alloc(size - jpeg.length)]);
}

/** Nøyaktig grensen, og én byte over. */
export const jpegAtLimit = () => jpegOfSize(IMAGE_MAX_BYTES);
export const jpegOverLimit = () => jpegOfSize(IMAGE_MAX_BYTES + 1);

/** En gyldig GIF. Nettleseren kan vise den, men appen godtar ikke formatet. */
export function gif(): Promise<Buffer> {
  return sharp(plain(10, 10)).gif().toBuffer();
}

/**
 * En gyldig PNG i gråtoner med gitte mål der alle piksler er svarte. Under 1 MB
 * for 20000 × 20000 piksler, og lages uten å legge bildet i minnet.
 */
export async function hugePng(width: number, height: number): Promise<Buffer> {
  const chunk = (type: string, data: Buffer) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, "ascii");
    data.copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)) >>> 0, 8 + data.length);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bitdybde
  header[9] = 0; // gråtoner
  const deflate = createDeflate();
  const parts: Buffer[] = [];
  deflate.on("data", (part: Buffer) => parts.push(part));
  const finished = new Promise((resolve) => deflate.on("end", resolve));
  const row = Buffer.alloc(width + 1);
  for (let y = 0; y < height; y++) {
    if (!deflate.write(row)) await new Promise((resolve) => deflate.once("drain", resolve));
  }
  deflate.end();
  await finished;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", Buffer.concat(parts)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
