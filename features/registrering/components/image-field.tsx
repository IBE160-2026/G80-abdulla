"use client";

import { Camera, CircleAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/shared/ui/button";
import {
  checkImageFile,
  checkImageType,
  IMAGE_ACCEPT,
  IMAGE_HINT,
  IMAGE_MESSAGES,
} from "@/features/registrering/image-input";
import { shrinkImage } from "@/features/registrering/image-resize";

/**
 * Valget av bilde i skjemaet for en ny rapport (FR-3, UX-DR10, Story 2.4).
 * «Legg til bilde» åpner kamera eller bildebibliotek på mobil (`accept` uten
 * `capture`), og teksten under er `IMAGE_HINT`. En fil som er tom eller har
 * feil type (`checkImageType`), avvises med en gang med en melding under
 * feltet. Ellers leses bildet, og er det over 4 MiB eller lengste side over
 * 2048 px, gjøres det mindre i nettleseren (`shrinkImage`, beslutningen
 * 2026-11-26). Kan nettleseren ikke lese bildet, eller er resultatet over 5 MiB
 * (`checkImageFile`), avvises det også. Forhåndsvisningen og innsendingen
 * bruker bildet slik det er etter skaleringen. Et avvist valg erstatter ikke et
 * bilde som allerede er valgt, og velges et nytt bilde mens det forrige
 * skaleres, gjelder bare det siste. Et gyldig bilde vises som forhåndsvisning
 * med «Fjern bilde», som får fokus. Fjernes bildet, går fokus tilbake til
 * «Legg til bilde». Serveren sjekker alt på nytt (`prepareImage`).
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
  const latestPick = useRef(0);

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

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Tømmer feltet, så samme fil kan velges igjen etter at den er fjernet.
    event.target.value = "";
    if (!file) return;

    // Typen sjekkes før bildet leses og skaleres. Et avvist valg tar ikke over
    // fra et gyldig bilde som fortsatt leses.
    const problem = checkImageType(file);
    if (problem) {
      onError(IMAGE_MESSAGES[problem]);
      return;
    }

    const pick = ++latestPick.current;
    const prepared = await shrinkImage(file);
    // Et nyere valg har tatt over mens dette bildet ble lest.
    if (pick !== latestPick.current) return;
    if (!prepared) {
      onError(IMAGE_MESSAGES.unreadable);
      return;
    }
    // Fila som sendes, må også være innenfor 5 MiB-grensen.
    const rejected = checkImageFile(prepared);
    if (rejected) {
      onError(IMAGE_MESSAGES[rejected]);
      return;
    }
    onError(undefined);
    focusRemoveAfterPick.current = true;
    onImage(prepared);
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
