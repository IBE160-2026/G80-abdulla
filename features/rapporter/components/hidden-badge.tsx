import { Badge } from "@/shared/ui/badge";

/**
 * Merkelappen «Skjult» (FR-9, Story 4.2). Bare moderatoren får se en skjult
 * rapport (RLS avgjør det, appen filtrerer aldri på `hidden`), så merket vises
 * bare for moderatoren. Det står som tekst ved siden av statusmerket, så fargen
 * aldri er eneste bærer (UX-DR5). Grå `hidden-bg`/`hidden-fg` fra DESIGN.md,
 * med en tynn kant i den mørkere tekstgråen (`hidden-fg`), så merket synes
 * også på den grå bakgrunnen til kortet og detaljsiden.
 */
export function HiddenBadge() {
  return (
    <Badge
      variant="outline"
      className="shrink-0 whitespace-nowrap rounded-full border-status-hidden-foreground bg-status-hidden px-2.5 py-0.5 text-badge text-status-hidden-foreground"
    >
      Skjult
    </Badge>
  );
}
