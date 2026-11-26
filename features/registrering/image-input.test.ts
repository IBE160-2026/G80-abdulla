// Tester reglene for et bilde (Story 2.4, AD-9, beslutningen 2026-11-26): grensen
// på 5 MiB, typene, når skjemaet gjør et bilde mindre og hvilke mål det får, og
// at tallene er de samme som i bucketen i supabase/config.toml.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  checkImageFile,
  checkImageType,
  IMAGE_ACCEPT,
  IMAGE_HINT,
  IMAGE_MESSAGES,
  IMAGE_TYPES,
  needsResize,
  resizedDimensions,
} from "./image-input";
import {
  IMAGE_MAX_BYTES,
  IMAGE_RESIZE_MAX_SIDE,
  IMAGE_RESIZE_THRESHOLD_BYTES,
} from "@/shared/lib/limits";

const config = readFileSync(
  fileURLToPath(new URL("../../supabase/config.toml", import.meta.url)),
  "utf8",
);
const bucket = config.slice(config.indexOf("[storage.buckets.report-images]"));

describe("grensene", () => {
  test("IMAGE_MAX_BYTES er 5 × 1024 × 1024 byte", () => {
    expect(IMAGE_MAX_BYTES).toBe(5_242_880);
  });

  test("er lik bucketen: file_size_limit 5MiB og de samme typene", () => {
    expect(bucket).toMatch(/^file_size_limit\s*=\s*"5MiB"\s*$/m);
    const types = bucket.match(/^allowed_mime_types\s*=\s*\[(.*)\]\s*$/m)?.[1] ?? "";
    expect([...types.matchAll(/"([^"]+)"/g)].map((m) => m[1])).toEqual([...IMAGE_TYPES]);
  });

  test("skaleringen: lengste side 2048 px og terskel på 4 MiB, under 5 MiB og 4,5 MB", () => {
    expect(IMAGE_RESIZE_MAX_SIDE).toBe(2048);
    expect(IMAGE_RESIZE_THRESHOLD_BYTES).toBe(4_194_304);
    expect(IMAGE_RESIZE_THRESHOLD_BYTES).toBeLessThan(IMAGE_MAX_BYTES);
    expect(IMAGE_RESIZE_THRESHOLD_BYTES).toBeLessThan(4_500_000);
  });

  test("accept har de tre typene, og teksten under knappen er den vedtatte", () => {
    expect(IMAGE_ACCEPT).toBe("image/jpeg,image/png,image/webp");
    expect(IMAGE_HINT).toBe(
      "Unngå ansikter og bilskilt på bildet. JPEG, PNG eller WebP. Store bilder gjøres mindre før de sendes.",
    );
  });
});

describe("checkImageType", () => {
  test.each(["image/jpeg", "image/png", "image/webp"])("godtar %s", (type) => {
    expect(checkImageType({ size: 1000, type })).toBeNull();
  });

  test("en stor fil godtas, siden den gjøres mindre etterpå", () => {
    expect(checkImageType({ size: 8 * 1024 * 1024, type: "image/jpeg" })).toBeNull();
  });

  test("en tom fil avvises, og tom fil går foran feil type", () => {
    expect(checkImageType({ size: 0, type: "image/png" })).toBe("empty");
    expect(checkImageType({ size: 0, type: "text/plain" })).toBe("empty");
  });

  test.each(["image/gif", "image/svg+xml", "image/heic", "image/heif", "text/plain", ""])(
    "avviser typen «%s»",
    (type) => {
      expect(checkImageType({ size: 1000, type })).toBe("type");
    },
  );
});

describe("checkImageFile", () => {
  test.each([
    { name: "JPEG", type: "image/jpeg" },
    { name: "PNG", type: "image/png" },
    { name: "WebP", type: "image/webp" },
  ])("godtar $name under grensen", ({ type }) => {
    expect(checkImageFile({ size: 1000, type })).toBeNull();
  });

  test("nøyaktig 5 MiB godtas, én byte mer avvises", () => {
    expect(checkImageFile({ size: IMAGE_MAX_BYTES, type: "image/jpeg" })).toBeNull();
    expect(checkImageFile({ size: IMAGE_MAX_BYTES + 1, type: "image/jpeg" })).toBe("tooLarge");
    expect(IMAGE_MESSAGES.tooLarge).toBe("Bildet er for stort.");
  });

  test("tom fil går foran feil type, og feil type går foran størrelse", () => {
    expect(checkImageFile({ size: 0, type: "text/plain" })).toBe("empty");
    expect(checkImageFile({ size: IMAGE_MAX_BYTES + 1, type: "image/gif" })).toBe("type");
  });
});

describe("needsResize", () => {
  const MiB4 = IMAGE_RESIZE_THRESHOLD_BYTES;

  test("et lite bilde sendes uendret", () => {
    expect(needsResize({ size: 30_000, width: 300, height: 200 })).toBe(false);
  });

  test("nøyaktig 4 MiB gir nei, én byte mer gir ja", () => {
    expect(needsResize({ size: MiB4, width: 40, height: 20 })).toBe(false);
    expect(needsResize({ size: MiB4 + 1, width: 40, height: 20 })).toBe(true);
  });

  test("lengste side på nøyaktig 2048 px gir nei, 2049 gir ja, på begge ledd", () => {
    expect(needsResize({ size: 1000, width: 2048, height: 2048 })).toBe(false);
    expect(needsResize({ size: 1000, width: 2049, height: 100 })).toBe(true);
    expect(needsResize({ size: 1000, width: 100, height: 2049 })).toBe(true);
  });

  test("et bilde over 40 megapiksler skaleres og avvises ikke", () => {
    expect(needsResize({ size: 500_000, width: 9000, height: 9000 })).toBe(true);
  });
});

describe("resizedDimensions", () => {
  test.each([
    { input: [4000, 3000], expected: { width: 2048, height: 1536 } },
    { input: [3000, 4000], expected: { width: 1536, height: 2048 } },
    // Orientering 6: 3000 × 2000 står som 2000 × 3000 etter rotasjonen.
    { input: [2000, 3000], expected: { width: 1365, height: 2048 } },
    { input: [9000, 9000], expected: { width: 2048, height: 2048 } },
    { input: [8000, 6000], expected: { width: 2048, height: 1536 } },
    { input: [2049, 1], expected: { width: 2048, height: 1 } },
    { input: [100_000, 10], expected: { width: 2048, height: 1 } },
    { input: [2100, 100], expected: { width: 2048, height: 98 } },
  ])("$input.0 × $input.1 blir $expected.width × $expected.height", ({ input, expected }) => {
    expect(resizedDimensions(input[0], input[1])).toEqual(expected);
  });

  test("et bilde innenfor beholder målene", () => {
    expect(resizedDimensions(2048, 1000)).toEqual({ width: 2048, height: 1000 });
    expect(resizedDimensions(40, 20)).toEqual({ width: 40, height: 20 });
  });
});

test("meldingene er norske setninger uten utropstegn", () => {
  for (const message of Object.values(IMAGE_MESSAGES)) {
    expect(message).toMatch(/\.$/);
    expect(message).not.toContain("!");
  }
});
