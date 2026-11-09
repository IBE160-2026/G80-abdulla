// Tester lastetilstanden for lista (Story 1.4): fire Skeleton-kort i samme
// form som rapportkortene, og en statusmelding for skjermlesere.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import Loading from "./loading";

test("loading.tsx viser fire Skeleton-kort og en statusmelding", () => {
  const html = renderToStaticMarkup(createElement(Loading));
  expect(html.match(/<li>/g)).toHaveLength(4);
  expect(html).toContain("animate-pulse");
  expect(html).toContain('role="status"');
  expect(html).toContain("Laster rapportene");
  expect(html).toContain(">Rapporter</h1>");
});
