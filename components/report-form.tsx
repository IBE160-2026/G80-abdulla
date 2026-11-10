"use client";

import { CircleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { createReport } from "@/app/rapporter/ny/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABELS } from "@/lib/labels";
import { charCount, DESCRIPTION_MAX, LOCATION_MAX } from "@/lib/limits";
import {
  parseReportInput,
  REPORT_CATEGORIES,
  REPORT_MESSAGES,
  type ReportField,
  type ReportFieldErrors,
} from "@/lib/report-input";
import type { ReportCategory } from "@/lib/supabase/types";

const FIELD =
  "text-base md:text-base aria-[invalid=true]:border-destructive";

/**
 * Skjemaet for en ny rapport (FR-3, UX-DR9, UX-DR10, Story 2.2): beskrivelse,
 * kategori og lokasjon. Valideringen er `parseReportInput`, den samme som
 * Server Action `createReport` bruker, så meldingene er like. Skjemaet har
 * `noValidate` og ingen `maxLength`, så tekst over grensen kan skrives og gir
 * en feil under feltet, med `aria-invalid` og `aria-describedby`. «For lang»-
 * feilen vises med en gang brukeren skriver over grensen og fjernes når
 * teksten er rettet. Tomme felt og manglende kategori gir feil først ved et
 * innsendingsforsøk, og fokus går da til første feil. Alt brukeren har
 * skrevet, beholdes. De tre feltene har `aria-required`.
 *
 * «Send inn» er deaktivert til de tre feltene er fylt (bare mellomrom er
 * tomt) og mens innsendingen pågår. Telleren «N/1000» er ren tekst og står
 * utenfor `aria-describedby`, så den ikke leses opp for hvert tegn.
 *
 * Etter innsending går brukeren til detaljsiden med `router.replace`, så
 * lista ligger rett før den i historikken og «←» havner der. Feiler
 * innsendingen, vises en toast og feltene står som de var.
 */
export function ReportForm() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState<ReportFieldErrors>({});
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLButtonElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  // Fokus står i beskrivelsen når skjemaet åpnes.
  useEffect(() => {
    descriptionRef.current?.focus();
  }, []);

  const filled =
    description.trim() !== "" && location.trim() !== "" && category !== "";

  function focusFirstError(found: ReportFieldErrors) {
    const refs: Record<ReportField, { current: HTMLElement | null }> = {
      description: descriptionRef,
      category: categoryRef,
      location: locationRef,
    };
    for (const field of ["description", "category", "location"] as const) {
      if (found[field]) {
        refs[field].current?.focus();
        return;
      }
    }
  }

  /**
   * Sjekker ett felt mens brukeren skriver: er den trimmede teksten over
   * grensen, står «for lang»-meldingen under feltet med en gang, ellers
   * fjernes feilen i feltet. Tomme felt får ikke feil før et innsendingsforsøk.
   */
  function checkLength(field: "description" | "location", value: string) {
    const max = field === "description" ? DESCRIPTION_MAX : LOCATION_MAX;
    const tooLong =
      field === "description"
        ? REPORT_MESSAGES.descriptionTooLong
        : REPORT_MESSAGES.locationTooLong;
    setErrors((current) => {
      const next = { ...current };
      if (charCount(value.trim()) > max) next[field] = tooLong;
      else delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || submitting.current) return;

    const parsed = parseReportInput({
      description,
      category: category || undefined,
      location,
    });
    if (!parsed.ok) {
      // Feilene tegnes før fokus flyttes, så skjermleseren leser feltet
      // sammen med feilmeldingen.
      flushSync(() => setErrors(parsed.errors));
      focusFirstError(parsed.errors);
      return;
    }

    submitting.current = true;
    setErrors({});
    setPending(true);
    let id: string | null = null;
    try {
      const result = await createReport(parsed.data);
      if (result.ok) id = result.data.id;
    } catch {
      id = null;
    }

    if (id === null) {
      submitting.current = false;
      setPending(false);
      toast.error("Kunne ikke sende inn. Prøv igjen.");
      return;
    }

    // Skjemaet blir stående som «Sender …» til detaljsiden har overtatt.
    toast.success("Rapporten er sendt inn");
    router.replace(`/rapporter/${id}`);
  }

  const descriptionDescribedBy = [
    "description-hint",
    errors.description ? "description-error" : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border bg-card p-4"
    >
      <div className="grid gap-2">
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea
          ref={descriptionRef}
          id="description"
          name="description"
          rows={5}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            checkLength("description", e.target.value);
          }}
          aria-required="true"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={descriptionDescribedBy}
          className={`min-h-36 ${FIELD}`}
        />
        <div className="flex items-start justify-between gap-4">
          <p id="description-hint" className="text-meta text-muted-foreground">
            Ikke skriv navn eller andre personopplysninger.
          </p>
          <p className="shrink-0 text-meta text-muted-foreground">
            {charCount(description.trim())}/{DESCRIPTION_MAX}
          </p>
        </div>
        {errors.description && (
          <FieldError id="description-error">{errors.description}</FieldError>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="category">Kategori</Label>
        <Select
          value={category}
          onValueChange={(value) => {
            setCategory(value as ReportCategory);
            setErrors((current) => {
              const next = { ...current };
              delete next.category;
              return next;
            });
          }}
        >
          <SelectTrigger
            ref={categoryRef}
            id="category"
            aria-required="true"
            aria-invalid={errors.category ? true : undefined}
            aria-describedby={errors.category ? "category-error" : undefined}
            className="h-11 text-base aria-[invalid=true]:border-destructive"
          >
            <SelectValue placeholder="Velg kategori" />
          </SelectTrigger>
          <SelectContent>
            {REPORT_CATEGORIES.map((code) => (
              <SelectItem key={code} value={code} className="min-h-11 text-base">
                {CATEGORY_LABELS[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <FieldError id="category-error">{errors.category}</FieldError>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="location">Lokasjon</Label>
        <Input
          ref={locationRef}
          id="location"
          name="location"
          type="text"
          autoComplete="off"
          placeholder="F.eks. gangveien ved bygg A"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            checkLength("location", e.target.value);
          }}
          aria-required="true"
          aria-invalid={errors.location ? true : undefined}
          aria-describedby={errors.location ? "location-error" : undefined}
          className={`h-11 ${FIELD}`}
        />
        {errors.location && (
          <FieldError id="location-error">{errors.location}</FieldError>
        )}
      </div>

      <Button
        type="submit"
        disabled={pending || !filled}
        className="h-11 w-full text-base"
      >
        {pending ? "Sender …" : "Send inn"}
      </Button>
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
      {children}
    </p>
  );
}
