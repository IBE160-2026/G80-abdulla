import { z } from "zod";
import { Constants } from "@/lib/supabase/database.types";
import type { ReportCategory, ReportStatus } from "@/lib/supabase/types";

// Filter og sortering i lista (Story 3.1 og 3.2, FR-6, AR-12). Tilstanden bor
// i URL-en med kodeverdiene
// (`?category=lighting&status=new&mine=true&sort=confirmations`).
// `parseListParams` er eneste tolkning av URL-en, og `buildListHref` eneste
// bygger av lenker: spørringen, brikkene, `aria-pressed`, tomtilstandene og
// lenkene lages bare fra resultatet av parseren.

export const LIST_SORTS = ["newest", "confirmations"] as const;
export type ListSort = (typeof LIST_SORTS)[number];

/** Nyeste er standard og står aldri i URL-en. */
export const DEFAULT_SORT: ListSort = "newest";

export type ListParams = {
  category?: ReportCategory;
  status?: ReportStatus;
  /** Bare rapportene brukeren selv har registrert (Story 3.2). Alltid `false` for en besøkende. */
  mine: boolean;
  sort: ListSort;
};

/** Søkeparametrene slik Next gir dem til en side. */
export type SearchParams = Record<string, string | string[] | undefined>;

// Bare én verdi per nøkkel er gyldig: en gjentatt nøkkel (en liste) er ukjent.
// Verdiene må være nøyaktig kodene, så «Lighting», «» og «oldest» faller bort.
const one = (value: unknown) => (typeof value === "string" ? value : undefined);

const schema = z.object({
  category: z.enum(Constants.public.Enums.report_category).optional().catch(undefined),
  status: z.enum(Constants.public.Enums.report_status).optional().catch(undefined),
  sort: z.enum(LIST_SORTS).catch(DEFAULT_SORT),
});

/**
 * Tolker søkeparametrene. Ukjente verdier ignoreres: lista vises som uten dem.
 * Nøklene `category` og `status` er med bare når verdien er gyldig. `mine` er
 * `true` bare for `mine=true` (nøyaktig én verdi) og en innlogget bruker, så
 * en besøkende med `mine=true` i URL-en får lista som uten filteret.
 */
export function parseListParams(searchParams: SearchParams, isSignedIn: boolean): ListParams {
  const parsed = schema.parse({
    category: one(searchParams.category),
    status: one(searchParams.status),
    sort: one(searchParams.sort),
  });
  const params: ListParams = {
    mine: isSignedIn && one(searchParams.mine) === "true",
    sort: parsed.sort,
  };
  if (parsed.category) params.category = parsed.category;
  if (parsed.status) params.status = parsed.status;
  return params;
}

/**
 * Lenken til en visning: `/` uten parametre, ellers `category`, `status`,
 * `mine` og `sort` i den rekkefølgen, uten `mine` når den er `false` og uten
 * `sort` når den er standard.
 */
export function buildListHref(params: Partial<ListParams>): string {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.status) query.set("status", params.status);
  if (params.mine) query.set("mine", "true");
  if (params.sort && params.sort !== DEFAULT_SORT) query.set("sort", params.sort);
  const text = query.toString();
  return text ? `/?${text}` : "/";
}

/** Er en kategori eller en status valgt? «Mine rapporter» teller ikke med. */
export function hasActiveFilter(params: ListParams): boolean {
  return params.category !== undefined || params.status !== undefined;
}

/**
 * Trykk på en brikke: en ny verdi setter den (og bytter ut den forrige i
 * samme gruppe), og den som allerede er aktiv, slås av. Sorteringen beholdes.
 */
export function toggleFilter(params: ListParams, key: "category", value: ReportCategory): ListParams;
export function toggleFilter(params: ListParams, key: "status", value: ReportStatus): ListParams;
export function toggleFilter(
  params: ListParams,
  key: "category" | "status",
  value: ReportCategory | ReportStatus,
): ListParams {
  const next: ListParams = { ...params };
  if (params[key] === value) delete next[key];
  else Object.assign(next, { [key]: value });
  return next;
}

/** «Alle»: kategori og status fjernes, «Mine rapporter» og sorteringen beholdes. */
export function clearFilters(params: ListParams): ListParams {
  return { mine: params.mine, sort: params.sort };
}

/** «Nullstill filter»: kategori, status og «Mine rapporter» fjernes, sorteringen beholdes. */
export function resetFilters(params: ListParams): ListParams {
  return { mine: false, sort: params.sort };
}

/** Trykk på «Mine rapporter»: slår av eller på. Kategori, status og sortering beholdes. */
export function toggleMine(params: ListParams): ListParams {
  return { ...params, mine: !params.mine };
}

/** Ny sortering. Filtrene beholdes. */
export function withSort(params: ListParams, sort: ListSort): ListParams {
  return { ...params, sort };
}
