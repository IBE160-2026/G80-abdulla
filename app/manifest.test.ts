// Tester PWA-manifestet (NFR-5, AR-17; gap fra code review v1 gruppe A,
// deferred-work.md): feltene som gjør appen installerbar, og at ikonene finnes
// i public/ med de målene manifestet oppgir. e2e/les/manifest.spec.ts sjekker i
// tillegg at de serveres som PNG.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import manifest from "./manifest";

const PUBLIC_DIR = new URL("../public", import.meta.url);
const result = manifest();
const icons = result.icons ?? [];

/** Bredde og høyde fra IHDR-delen i en PNG (byte 16–23). */
function pngSize(path: string): string {
  const bytes = readFileSync(path);
  expect(bytes.subarray(1, 4).toString("ascii"), `${path} er ikke en PNG`).toBe("PNG");
  return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
}

test("manifestet har navn, språk, start og visning som en installert app", () => {
  expect(result.name).toBe("LocalFix · Campus Molde");
  expect(result.short_name).toBe("LocalFix");
  expect(result.lang).toBe("nb");
  expect(result.start_url).toBe("/");
  expect(result.display).toBe("standalone");
  expect(result.description).toBeTruthy();
});

test("manifestet har bakgrunns- og temafarge som hex", () => {
  expect(result.background_color).toMatch(/^#[0-9A-F]{6}$/i);
  expect(result.theme_color).toMatch(/^#[0-9A-F]{6}$/i);
});

test("manifestet har ikoner på 192 og 512 px, og hver fil finnes med de målene som oppgis", () => {
  expect(icons.length).toBeGreaterThan(0);
  const sizes = icons.flatMap((icon) => (icon.sizes ?? "").trim().split(/\s+/));
  expect(sizes).toContain("192x192");
  expect(sizes).toContain("512x512");
  for (const icon of icons) {
    expect(icon.sizes, `${icon.src} mangler sizes`).toBeTruthy();
    expect(icon.type, icon.src).toBe("image/png");
    expect(icon.src.startsWith("/"), icon.src).toBe(true);
    const file = fileURLToPath(new URL(`.${icon.src}`, `${PUBLIC_DIR.href}/`));
    expect(pngSize(file), icon.src).toBe(icon.sizes);
  }
});

test("manifestet har et maskable-ikon på 512 px", () => {
  const maskable = icons.filter((icon) => icon.purpose === "maskable");
  expect(maskable).toHaveLength(1);
  expect(maskable[0].sizes).toBe("512x512");
});
