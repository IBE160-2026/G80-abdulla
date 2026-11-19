"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CATEGORY_LABELS, SORT_LABELS, STATUS_LABELS } from "@/shared/report/labels";
import {
  buildListHref,
  clearFilters,
  LIST_SORTS,
  toggleFilter,
  toggleMine,
  withSort,
  type ListParams,
  type ListSort,
} from "@/features/rapporter/list-params";
import { Constants } from "@/shared/supabase/database.types";
import { cn } from "@/shared/lib/utils";

const CATEGORIES = Constants.public.Enums.report_category;
const STATUSES = Constants.public.Enums.report_status;

/**
 * Filterbrikkene og sorteringen over lista (UX-DR7, UX-DR8). «Mine rapporter»
 * står først og vises bare for innloggede (Story 3.2). Alt kommer fra
 * resultatet av `parseListParams`, og hvert trykk går til lenken
 * `buildListHref` lager, så tilstanden bor i URL-en. `router.push` med
 * `scroll: false` beholder fokus på brikken som ble trykket.
 */
export function ListFilters({
  params,
  isSignedIn,
}: {
  params: ListParams;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  // Propen kommer først når serveren har svart. Et nytt trykk før det må
  // bygge på det forrige trykket og ikke på den gamle propen, ellers faller
  // det første filteret bort på et tregt nett.
  const latest = useRef(params);
  useEffect(() => {
    latest.current = params;
  }, [params]);
  const go = (change: (current: ListParams) => ListParams) => {
    const next = change(latest.current);
    latest.current = next;
    router.push(buildListHref(next), { scroll: false });
  };
  const noFilter = params.category === undefined && params.status === undefined;

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex justify-end">
        <Select
          value={params.sort}
          onValueChange={(value) => go((current) => withSort(current, value as ListSort))}
        >
          <SelectTrigger aria-label="Sortering" className="h-11 w-auto min-w-[11rem] gap-2 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIST_SORTS.map((sort) => (
              <SelectItem key={sort} value={sort} className="min-h-11 text-sm">
                {SORT_LABELS[sort]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div
        role="group"
        aria-label="Filtrer rapportene"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1"
      >
        {isSignedIn && (
          <Chip pressed={params.mine} onClick={() => go(toggleMine)}>
            Mine rapporter
          </Chip>
        )}
        <Chip pressed={noFilter} onClick={() => go(clearFilters)}>
          Alle
        </Chip>
        <div role="group" aria-label="Kategori" className="flex shrink-0 gap-2">
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              pressed={params.category === category}
              onClick={() => go((current) => toggleFilter(current, "category", category))}
            >
              {CATEGORY_LABELS[category]}
            </Chip>
          ))}
        </div>
        <div role="group" aria-label="Status" className="flex shrink-0 gap-2">
          {STATUSES.map((status) => (
            <Chip
              key={status}
              pressed={params.status === status}
              onClick={() => go((current) => toggleFilter(current, "status", status))}
            >
              {STATUS_LABELS[status]}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        pressed
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-white text-foreground",
      )}
    >
      {children}
    </button>
  );
}
