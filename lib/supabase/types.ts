import type { MergeDeep } from "type-fest";
import type { Database as GeneratedDatabase } from "./database.types";

// Radtypene appen bruker (AD-5). database.types.ts genereres med
// `npm run db:types` og endres aldri for hånd.
//
// En visning kan ikke ha NOT NULL, så de genererte typene gjør de fire
// tilleggskolonnene i reports_with_counts nullbare. Uttrykkene i visningen
// (count og coalesce) garanterer at de aldri er NULL, så nullbarheten
// overstyres her. Komponentene bruker bare radtypene fra denne fila.
export type Database = MergeDeep<
  GeneratedDatabase,
  {
    public: {
      Views: {
        reports_with_counts: {
          Row: {
            confirmation_count: number;
            seen_count: number;
            confirmed_by_me: boolean;
            authored_by_me: boolean;
          };
        };
      };
    };
  }
>;

export type ReportCategory = Database["public"]["Enums"]["report_category"];
export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type UserRole = Database["public"]["Enums"]["user_role"];

/** En rad fra visningen reports_with_counts, med alle kolonnene. */
export type ReportRow = Database["public"]["Views"]["reports_with_counts"]["Row"];

/**
 * Kolonnene lista og detaljsiden leser fra reports_with_counts. Listen er
 * eksplisitt og har verken author_id eller image_path, så de aldri sendes til
 * nettleseren (AD-5). Strengen er en literal, så supabase-js kan utlede
 * radtypen fra `.select(REPORT_COLUMNS)`.
 */
export const REPORT_COLUMNS =
  "id, description, location, category, summary, status, hidden, created_at, status_changed_at, confirmation_count, seen_count, confirmed_by_me, authored_by_me" as const;
