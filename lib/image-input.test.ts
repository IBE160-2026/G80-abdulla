// Tester reglene for et bilde (Story 2.4, AD-9): grensen på 5 MiB, typene og
// pikselgrensen, og at tallene er de samme som i bucketen i supabase/config.toml.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  checkImageFile,
  IMAGE_ACCEPT,
  IMAGE_HINT,
  IMAGE_MESSAGES,
  IMAGE_TYPES,
  withinPixelLimit,
} from "./image-input";
import { IMAGE_MAX_BYTES, MAX_IMAGE_PIXELS } from "./limits";

const config = readFileSync(
  fileURLToPath(new URL("../supabase/config.toml", import.meta.url)),
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

  test("accept har de tre typene, og teksten under knappen er den frosne", () => {
    expect(IMAGE_ACCEPT).toBe("image/jpeg,image/png,image/webp");
    expect(IMAGE_HINT).toBe(
      "Unngå ansikter og bilskilt på bildet. JPEG, PNG eller WebP, maks 5 MB.",
    );
  });
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
  });

  test("en tom fil avvises", () => {
    expect(checkImageFile({ size: 0, type: "image/png" })).toBe("empty");
  });

  test.each(["image/gif", "image/svg+xml", "image/heic", "text/plain", ""])(
    "avviser typen «%s»",
    (type) => {
      expect(checkImageFile({ size: 1000, type })).toBe("type");
    },
  );

  test("tom fil går foran feil type, og feil type går foran størrelse", () => {
    expect(checkImageFile({ size: 0, type: "text/plain" })).toBe("empty");
    expect(checkImageFile({ size: IMAGE_MAX_BYTES + 1, type: "image/gif" })).toBe("type");
  });
});

describe("withinPixelLimit", () => {
  test("nøyaktig grensen godtas, én piksel mer avvises", () => {
    expect(withinPixelLimit(MAX_IMAGE_PIXELS, 1)).toBe(true);
    expect(withinPixelLimit(MAX_IMAGE_PIXELS + 1, 1)).toBe(false);
  });

  test.each([
    [0, 100],
    [100, 0],
    [-1, 100],
    [Number.NaN, 100],
    [Number.POSITIVE_INFINITY, 100],
  ])("avviser %s × %s", (width, height) => {
    expect(withinPixelLimit(width, height)).toBe(false);
  });
});

test("meldingene er norske setninger uten utropstegn", () => {
  for (const message of Object.values(IMAGE_MESSAGES)) {
    expect(message).toMatch(/\.$/);
    expect(message).not.toContain("!");
  }
});
