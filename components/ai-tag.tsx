import { Badge } from "@/components/ui/badge";

/**
 * Merkelappen «Foreslått av KI» (`ai-tag` i DESIGN.md, UX-DR11): en liten pille
 * ved siden av kategorivalget. Teksten står alltid i merket. Skjemaet fjerner
 * den når brukeren velger kategori selv.
 */
export function AiTag() {
  return (
    <Badge
      variant="outline"
      className="shrink-0 whitespace-nowrap rounded-full border-transparent bg-status-new px-2.5 py-0.5 text-badge text-primary"
    >
      Foreslått av KI
    </Badge>
  );
}
