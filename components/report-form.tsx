"use client";

import { CircleAlert, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { createReport, suggestReport } from "@/app/rapporter/ny/actions";
import { AiTag } from "@/components/ai-tag";
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
import { charCount, DESCRIPTION_MAX, LOCATION_MAX, SUMMARY_MAX } from "@/lib/limits";
import {
  parseReportInput,
  REPORT_CATEGORIES,
  REPORT_MESSAGES,
  type ReportField,
  type ReportFieldErrors,
} from "@/lib/report-input";
import { charsChanged, SUGGEST_MIN_CHARS } from "@/lib/suggest-trigger";
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
 * KI-forslag (Story 2.3, FR-4, UX-DR10, UX-DR11): når brukeren forlater
 * beskrivelsen (blur) og minst `SUGGEST_MIN_CHARS` tegn er endret siden
 * forrige forslag, kalles Server Action `suggestReport`. Aldri mens brukeren
 * skriver, og høyst ett kall om gangen. Imens står «Finner kategori …» med
 * spinner, og kategorivalget kan brukes. Et forslag velger kategorien med
 * pillen «Foreslått av KI» og en usynlig `aria-live`-region leser den opp.
 * Har brukeren valgt kategori selv, endres den aldri, og et manuelt valg låser
 * kategorien mot KI resten av skjemaet og fjerner pillen. Et svar for en tekst
 * som er endret siden kallet, forkastes. Oppsummeringen vises som lesetekst
 * med «Endre», som åpner et felt med teller. Uten forslag står «Vi fikk ikke et
 * forslag. Velg kategori selv.», og rapporten kan sendes uten oppsummering.
 * Alt fra KI-en vises som ren tekst.
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
  const [loading, setLoading] = useState(false);
  const [aiCategory, setAiCategory] = useState(false);
  const [noSuggestion, setNoSuggestion] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [summary, setSummary] = useState("");
  const [editingSummary, setEditingSummary] = useState(false);
  const submitting = useRef(false);
  // Siste verdier og låser som kallet etter forslaget leser, når tilstanden
  // i closuren er utdatert.
  const descriptionValue = useRef("");
  const categoryValue = useRef<ReportCategory | "">("");
  const userChoseCategory = useRef(false);
  const summaryTouched = useRef(false);
  const loadingRef = useRef(false);
  const lastSuggested = useRef("");
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLButtonElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  // Fokus står i beskrivelsen når skjemaet åpnes.
  useEffect(() => {
    descriptionRef.current?.focus();
  }, []);

  // Fokus går til oppsummeringsfeltet når «Endre» åpner det.
  useEffect(() => {
    if (editingSummary) summaryRef.current?.focus();
  }, [editingSummary]);

  const filled =
    description.trim() !== "" && location.trim() !== "" && category !== "";

  function focusFirstError(found: ReportFieldErrors) {
    const refs: Record<ReportField | "summary", { current: HTMLElement | null }> = {
      description: descriptionRef,
      category: categoryRef,
      location: locationRef,
      summary: summaryRef,
    };
    for (const field of ["description", "category", "summary", "location"] as const) {
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

  /** Oppsummeringen over grensen gir feilen under feltet med en gang. */
  function checkSummary(value: string) {
    setErrors((current) => {
      const next = { ...current };
      if (charCount(value.trim()) > SUMMARY_MAX) next.summary = REPORT_MESSAGES.summaryTooLong;
      else delete next.summary;
      return next;
    });
  }

  /** Henter et forslag for `text` og bruker det, hvis svaret ikke er utdatert. */
  async function requestSuggestion(text: string) {
    const previousSuggested = lastSuggested.current;
    lastSuggested.current = text;
    loadingRef.current = true;
    setLoading(true);
    setNoSuggestion(false);
    setAnnouncement("");

    let suggestion: { category: ReportCategory; summary: string | null } | null = null;
    try {
      const result = await suggestReport(text);
      if (result.ok) suggestion = result.data;
    } catch {
      suggestion = null;
    }

    loadingRef.current = false;
    setLoading(false);
    if (submitting.current) {
      // Svaret slippes mens innsendingen pågår. Feiler den, skal teksten kunne
      // få et forslag senere, så den teller ikke som forrige forslag.
      lastSuggested.current = previousSuggested;
      return;
    }

    if (descriptionValue.current.trim() !== text.trim()) {
      // Teksten er endret siden kallet. Svaret forkastes, og er brukeren ute av
      // feltet, hentes et nytt forslag for den nye teksten. Et forkastet svar
      // teller ikke som forrige forslag.
      lastSuggested.current = previousSuggested;
      if (document.activeElement !== descriptionRef.current) handleDescriptionBlur();
      return;
    }

    if (!suggestion) {
      if (categoryValue.current === "") setNoSuggestion(true);
      return;
    }

    if (!userChoseCategory.current) {
      categoryValue.current = suggestion.category;
      setCategory(suggestion.category);
      setAiCategory(true);
      setAnnouncement(`Kategori foreslått: ${CATEGORY_LABELS[suggestion.category]}`);
      setErrors((current) => {
        const next = { ...current };
        delete next.category;
        return next;
      });
    }
    if (!summaryTouched.current) setSummary(suggestion.summary ?? "");
  }

  /** Henter forslag når brukeren forlater beskrivelsen med nok endret tekst. */
  function handleDescriptionBlur() {
    if (submitting.current || loadingRef.current) return;
    const text = descriptionValue.current;
    if (charsChanged(lastSuggested.current, text) < SUGGEST_MIN_CHARS) return;
    void requestSuggestion(text);
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || submitting.current) return;

    const parsed = parseReportInput({
      description,
      category: category || undefined,
      location,
      summary,
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

  const categoryDescribedBy =
    [
      loading ? "category-status" : undefined,
      noSuggestion && category === "" ? "category-hint" : undefined,
      errors.category ? "category-error" : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

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
            descriptionValue.current = e.target.value;
            setDescription(e.target.value);
            checkLength("description", e.target.value);
          }}
          onBlur={(e) => {
            // «Send inn» skal ikke vente på et forslag som ikke trengs.
            const next = e.relatedTarget;
            if (next instanceof HTMLButtonElement && next.type === "submit") return;
            handleDescriptionBlur();
          }}
          aria-required="true"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={descriptionDescribedBy}
          className={`min-h-36 ${FIELD}`}
        />
        <div className="flex items-start justify-between gap-4">
          <p id="description-hint" className="text-meta text-muted-foreground">
            Ikke skriv navn eller andre personopplysninger. Teksten sendes til en
            KI-tjeneste for å foreslå kategori.
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
        <div className="flex min-h-6 flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <Label htmlFor="category">Kategori</Label>
          {loading ? (
            <span
              id="category-status"
              className="flex items-center gap-1.5 text-meta text-muted-foreground"
            >
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin motion-reduce:animate-none"
              />
              Finner kategori …
            </span>
          ) : (
            aiCategory && <AiTag />
          )}
        </div>
        <Select
          value={category}
          onValueChange={(value) => {
            // Et manuelt valg låser kategorien mot KI resten av skjemaet.
            userChoseCategory.current = true;
            categoryValue.current = value as ReportCategory;
            setCategory(value as ReportCategory);
            setAiCategory(false);
            setNoSuggestion(false);
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
            aria-describedby={categoryDescribedBy}
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
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
        {noSuggestion && category === "" && (
          <p id="category-hint" role="status" className="text-sm">
            Vi fikk ikke et forslag. Velg kategori selv.
          </p>
        )}
        {errors.category && (
          <FieldError id="category-error">{errors.category}</FieldError>
        )}
      </div>

      {(summary !== "" || editingSummary) && (
        <div className="grid gap-2">
          {editingSummary ? (
            <>
              <Label htmlFor="summary">Oppsummering</Label>
              <Textarea
                ref={summaryRef}
                id="summary"
                name="summary"
                rows={3}
                value={summary}
                onChange={(e) => {
                  summaryTouched.current = true;
                  setSummary(e.target.value);
                  checkSummary(e.target.value);
                }}
                aria-invalid={errors.summary ? true : undefined}
                aria-describedby={errors.summary ? "summary-error" : undefined}
                className={`min-h-24 ${FIELD}`}
              />
              <p className="text-right text-meta text-muted-foreground">
                {charCount(summary.trim())}/{SUMMARY_MAX}
              </p>
              {errors.summary && (
                <FieldError id="summary-error">{errors.summary}</FieldError>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-medium leading-none">
                Oppsummering
              </p>
              <p className="break-words text-base">
                {summary}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingSummary(true)}
                className="h-11 w-fit px-4 text-base"
              >
                Endre
              </Button>
            </>
          )}
        </div>
      )}

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
