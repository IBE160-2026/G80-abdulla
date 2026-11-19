import { z } from "zod";

// Eneste fil som leser process.env (AD-11, AR-4). Feilmeldingene navngir
// variablene, men viser aldri verdiene.

const HELP = "Kopier .env.example til .env og følg README.";

function formatIssues(title: string, issues: z.core.$ZodIssue[]): string {
  const lines = issues.map(
    (issue) => `- ${issue.path.join(".") || "(ukjent)"}: ${issue.message}`,
  );
  return `${title}\n${lines.join("\n")}\n${HELP}`;
}

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    protocol: /^https?$/,
    error: "mangler eller er ikke en gyldig http- eller https-URL",
  }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string({ error: "mangler" })
    .min(1, { error: "mangler" }),
});

export type PublicEnv = z.infer<typeof publicSchema>;

// Next.js bytter bare ut NEXT_PUBLIC_* i nettleserkoden når de leses med
// fullt navn, så hver variabel står skrevet ut her.
const publicResult = publicSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || undefined,
});

if (!publicResult.success) {
  throw new Error(
    formatIssues(
      "Ugyldige miljøvariabler for Supabase:",
      publicResult.error.issues,
    ),
  );
}

export const publicEnv: PublicEnv = publicResult.data;

const serverSchema = z.discriminatedUnion(
  "AI_PROVIDER",
  [
    z.object({ AI_PROVIDER: z.literal("mock") }),
    z.object({
      AI_PROVIDER: z.literal("openai"),
      AI_BASE_URL: z.url({
        protocol: /^https?$/,
        error:
          "påkrevd når AI_PROVIDER=openai, og må være en gyldig http- eller https-URL",
      }),
      AI_MODEL: z
        .string({ error: "påkrevd når AI_PROVIDER=openai" })
        .min(1, { error: "påkrevd når AI_PROVIDER=openai" }),
      AI_API_KEY: z
        .string({ error: "påkrevd når AI_PROVIDER=openai" })
        .min(1, { error: "påkrevd når AI_PROVIDER=openai" }),
    }),
  ],
  { error: "må være mock eller openai" },
);

export type ServerEnv = z.infer<typeof serverSchema>;

/**
 * Miljøvariablene som bare finnes på serveren. Kaster i nettleseren, slik at
 * hemmeligheter ikke kan havne i klientkoden. Tom eller manglende
 * AI_PROVIDER gir mock.
 */
export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() kan bare kalles på serveren.");
  }

  const result = serverSchema.safeParse({
    AI_PROVIDER: process.env.AI_PROVIDER || "mock",
    AI_BASE_URL: process.env.AI_BASE_URL || undefined,
    AI_MODEL: process.env.AI_MODEL || undefined,
    AI_API_KEY: process.env.AI_API_KEY || undefined,
  });

  if (!result.success) {
    throw new Error(
      formatIssues("Ugyldige miljøvariabler for KI:", result.error.issues),
    );
  }

  return result.data;
}
