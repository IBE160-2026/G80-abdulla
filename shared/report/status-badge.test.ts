// Tester statusmerket (UX-DR5; gap fra code review v1 gruppe A,
// deferred-work.md): hver status har sin norske etikett og sine egne farger,
// og teksten står alltid i merket, så fargen aldri er eneste bærer av status.
// `STATUS_CLASSES` er ikke eksportert, så klassene leses fra HTML-en.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import type { ReportStatus } from "@/shared/supabase/types";
import { StatusBadge } from "./status-badge";

const EXPECTED: Record<ReportStatus, { label: string; classes: string[] }> = {
  new: { label: "Ny", classes: ["bg-status-new", "text-status-new-foreground"] },
  in_progress: {
    label: "Under behandling",
    classes: ["bg-status-progress", "text-status-progress-foreground"],
  },
  resolved: { label: "Løst", classes: ["bg-status-done", "text-status-done-foreground"] },
};

function render(status: ReportStatus): string {
  return renderToStaticMarkup(createElement(StatusBadge, { status }));
}

function classList(html: string): string[] {
  const match = /class="([^"]*)"/.exec(html);
  return match ? match[1].split(/\s+/) : [];
}

test.each(Object.entries(EXPECTED) as [ReportStatus, (typeof EXPECTED)[ReportStatus]][])(
  "%s har etiketten og fargene sine, og ingen av de andre statusenes farger",
  (status, { label, classes }) => {
    const html = render(status);
    expect(html).toContain(`>${label}</`);
    const actual = classList(html);
    for (const expected of classes) expect(actual).toContain(expected);
    const others = Object.entries(EXPECTED)
      .filter(([key]) => key !== status)
      .flatMap(([, other]) => other.classes);
    for (const other of others) expect(actual).not.toContain(other);
  },
);

test("merket beholder formen: rund, uten kantlinje og uten å brytes", () => {
  const actual = classList(render("new"));
  for (const expected of ["rounded-full", "border-transparent", "whitespace-nowrap", "shrink-0"]) {
    expect(actual).toContain(expected);
  }
});
