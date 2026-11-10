"use client";

import { Camera, CircleAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  checkImageFile,
  IMAGE_ACCEPT,
  IMAGE_HINT,
  IMAGE_MESSAGES,
  withinPixelLimit,
} from "@/lib/image-input";

/**
 * Valget av bilde i skjemaet for en ny rapport (FR-3, UX-DR10, Story 2.4).
 * «Legg til bilde» åpner kamera eller bildebibliotek på mobil (`accept` uten
 * `capture`), og teksten under er `IMAGE_HINT`. En fil som er tom, har feil
 * type eller er over 5 MiB (`checkImageFile`), eller som nettleseren ikke kan
 * lese eller har for store dimensjoner, avvises med en gang med en melding
 * under feltet. Et avvist valg erstatter ikke et bilde som allerede er valgt.
 * Et gyldig bilde vises som forhåndsvisning med «Fjern bilde», som får fokus.
 * Fjernes bildet, går fokus tilbake til «Legg til bilde». Serveren sjekker alt
 * på nytt (`prepareImage`).
 *
 * Forhåndsvisningen bruker en object-URL som lages og frigjøres i en effekt,
 * så den også virker når React kjører effekter to ganger i utvikling.
 */
export function ImageField({
  image,
  error,
  onImage,
  onError,
}: {
  image: File | null;
  error: string | undefined;
  onImage: (file: File | null) => void;
  onError: (message: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLImageElement>(null);
  const removeRef = useRef<HTMLButtonElement>(null);
  const focusAddAfterRemove = useRef(false);
  const focusRemoveAfterPick = useRef(false);
  const addRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = previewRef.current;
    if (!image || !element) return;
    const url = URL.createObjectURL(image);
    element.src = url;
    return () => URL.revokeObjectURL(url);
  }, [image]);

  // Knappen som hadde fokus, er byttet ut når bildet er valgt eller fjernet.
  // Fokus går til «Fjern bilde» etter et valg og til «Legg til bilde» etter å ha
  // fjernet, så tastaturbrukeren ikke mister plassen sin.
  useEffect(() => {
    if (image && focusRemoveAfterPick.current) {
      focusRemoveAfterPick.current = false;
      removeRef.current?.focus();
    }
    if (!image && focusAddAfterRemove.current) {
      focusAddAfterRemove.current = false;
      addRef.current?.focus();
    }
  }, [image]);

  // En feilmelding gir fokus til «Legg til bilde», så skjermleseren leser feilen
  // sammen med knappen (aria-describedby). Etter en avvisning fra serveren er
  // bildet fjernet og knappen tilbake.
  useEffect(() => {
    if (error && !image) addRef.current?.focus();
  }, [error, image]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Tømmer feltet, så samme fil kan velges igjen etter at den er fjernet.
    event.target.value = "";
    if (!file) return;

    const problem = checkImageFile(file);
    if (problem) {
      onError(IMAGE_MESSAGES[problem]);
      return;
    }

    // Nettleseren må kunne lese bildet, og målene må være innenfor grensen.
    const probe = new Image();
    const url = URL.createObjectURL(file);
    probe.onload = () => {
      URL.revokeObjectURL(url);
      if (!withinPixelLimit(probe.naturalWidth, probe.naturalHeight)) {
        onError(IMAGE_MESSAGES.dimensions);
        return;
      }
      onError(undefined);
      focusRemoveAfterPick.current = true;
      onImage(file);
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      onError(IMAGE_MESSAGES.unreadable);
    };
    probe.src = url;
  }

  const describedBy = ["image-hint", error ? "image-error" : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <div role="group" aria-labelledby="image-label" className="grid gap-2">
      <p id="image-label" className="text-sm font-medium leading-none">
        Bilde <span className="font-normal text-muted-foreground">(valgfritt)</span>
      </p>
      <input
        ref={inputRef}
        type="file"
        name="image"
        accept={IMAGE_ACCEPT}
        hidden
        tabIndex={-1}
        onChange={handleChange}
      />

      {image ? (
        <div className="grid gap-2">
          {/* Vanlig <img> fra en object-URL, ikke bildeoptimereren. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={previewRef}
            alt="Forhåndsvisning av valgt bilde"
            className="block h-auto max-h-60 w-full rounded-lg bg-muted object-contain"
          />
          <Button
            ref={removeRef}
            type="button"
            variant="outline"
            onClick={() => {
              focusAddAfterRemove.current = true;
              onError(undefined);
              onImage(null);
            }}
            className="h-11 w-fit px-4 text-base"
          >
            Fjern bilde
          </Button>
        </div>
      ) : (
        <Button
          ref={addRef}
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-11 w-fit px-4 text-base aria-[invalid=true]:border-destructive"
        >
          <Camera aria-hidden="true" />
          Legg til bilde
        </Button>
      )}

      <p id="image-hint" className="text-meta text-muted-foreground">
        {IMAGE_HINT}
      </p>
      {error && (
        <p id="image-error" className="flex items-start gap-1.5 text-sm">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
          {error}
        </p>
      )}
    </div>
  );
}
