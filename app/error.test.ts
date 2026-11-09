// Tester den norske feilsiden (Story 1.5): teksten, knappen «Prøv igjen» og
// lenken tilbake til lista, og at knappen kaller retry.
import {
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import ErrorPage from "./error";

type Props = { children?: ReactNode; onClick?: () => void };

/** Finner første element av typen i treet, uten å gjengi det. */
function findElement(node: ReactNode, type: string): ReactElement<Props> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, type);
      if (found) return found;
    }
    return null;
  }
  if (!isValidElement<Props>(node)) return null;
  if (node.type === type) return node;
  return findElement(node.props.children, type);
}

test("error.tsx viser den norske feilteksten, «Prøv igjen» og en lenke til lista", () => {
  const html = renderToStaticMarkup(createElement(ErrorPage, { retry: () => {} }));
  expect(html).toContain(">Noe gikk galt. Prøv igjen.</h1>");
  expect(html).toMatch(/<button type="button"[^>]*>Prøv igjen<\/button>/);
  expect(html).toMatch(/<a [^>]*href="\/"[^>]*>Tilbake til lista<\/a>/);
  // Ingen engelsk tekst fra Nexts standardside.
  expect(html).not.toMatch(/error|went wrong/i);
});

test("«Prøv igjen» kaller retry én gang", () => {
  const retry = vi.fn();
  const button = findElement(ErrorPage({ retry }), "button");
  expect(button?.props.children).toBe("Prøv igjen");
  button!.props.onClick!();
  expect(retry).toHaveBeenCalledTimes(1);
});
