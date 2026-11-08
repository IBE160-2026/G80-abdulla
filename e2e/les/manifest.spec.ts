// PWA-manifestet har ikonene som trengs for installasjon (NFR-5, V5 i
// deferred-work.md).
import { expect, test } from "@playwright/test";

type Icon = { src: string; sizes: string; type?: string };

test("manifestet har ikoner på 192 og 512 px, og hvert ikon svarer med PNG", async ({
  request,
}) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.status()).toBe(200);
  const manifest = (await response.json()) as { icons?: Icon[] };
  const icons = manifest.icons ?? [];

  const sizes = icons.map((icon) => icon.sizes);
  expect(sizes).toContain("192x192");
  expect(sizes).toContain("512x512");

  for (const icon of icons) {
    const image = await request.get(icon.src);
    expect(image.status(), icon.src).toBe(200);
    expect(image.headers()["content-type"], icon.src).toBe("image/png");
  }
});
