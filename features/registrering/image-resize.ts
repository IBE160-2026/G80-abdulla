import { IMAGE_RESIZE_THRESHOLD_BYTES } from "@/shared/lib/limits";
import { needsResize, resizedDimensions } from "./image-input";

// Skaleringen av et bilde i nettleseren (AD-9, beslutningen 2026-11-26). Bare
// for klientkoden: bruker `createImageBitmap` og canvas, som ikke finnes på
// serveren. Reglene for når og hvor mye ligger i `image-input.ts`, så de kan
// testes uten nettleser. Serveren sjekker og renser bildet på nytt uansett.

/**
 * Kvalitetene på JPEG-en fra canvas, i rekkefølge. Første som gir en fil på
 * høyst `IMAGE_RESIZE_THRESHOLD_BYTES` brukes, så et bilde med mye støy ikke
 * ender over Vercels grense for forespørsler. Et vanlig bilde på 2048 px blir
 * under 4 MiB på første forsøk.
 */
const JPEG_QUALITIES = [0.85, 0.7, 0.55];

/**
 * Leser bildet og gjør det mindre ved behov (`needsResize`). Et bilde innenfor
 * grensene gis tilbake uendret. Ellers tegnes det, rettet etter
 * EXIF-orienteringen, på en hvit bakgrunn (en gjennomsiktig PNG blir ikke svart)
 * med lengste side høyst 2048 px, og skrives ut som en ny JPEG uten metadata.
 * Gir `null` når nettleseren ikke kan lese eller tegne bildet. Kan ikke
 * nettleseren rette bildet etter orienteringen (en eldre nettleser kaster
 * `TypeError` for `imageOrientation: "from-image"`), gis fila tilbake uendret,
 * så serveren retter den, og skjemaet avviser den bare hvis den er over 5 MiB.
 * Typen må være sjekket før (`checkImageType`), og resultatet sjekkes etterpå
 * (`checkImageFile`).
 */
export async function shrinkImage(file: File): Promise<File | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (error) {
    return error instanceof TypeError ? file : null;
  }

  try {
    if (!needsResize({ size: file.size, width: bitmap.width, height: bitmap.height })) {
      return file;
    }
    const { width, height } = resizedDimensions(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);

    let blob: Blob | null = null;
    for (const quality of JPEG_QUALITIES) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (!blob || blob.size === 0) return null;
      if (blob.size <= IMAGE_RESIZE_THRESHOLD_BYTES) break;
    }
    if (!blob) return null;
    return new File([blob], jpegName(file.name), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return null;
  } finally {
    bitmap.close();
  }
}

/** Samme navn med endelsen `.jpg`. Serveren lager uansett sitt eget filnavn. */
function jpegName(name: string): string {
  const base = name.replace(/\.[^./\\]*$/, "");
  return `${base || "bilde"}.jpg`;
}
