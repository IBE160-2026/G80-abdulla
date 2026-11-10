import { existsSync } from "node:fs";
import { loadEnv } from "vite";
import { configDefaults, defineConfig } from "vitest/config";

// Tre Vitest-prosjekter:
// - unit: ren logikk i lib/, testene av sider i app/ og komponenter i
//   components/ som ikke trenger data (app/**/*.test.ts og
//   components/**/*.test.ts), og sjekken av Playwright-oppsettet i
//   playwright.config.test.ts (AD-15). Trenger ikke Supabase.
//   `npm run test:unit`.
// - db: tester mot lokal Supabase (lib/**/*.db.test.ts), kjørt av
//   `npm run test:db` etter `db reset` og pgTAP.
// - sm5: SM-5-kjøringen (evals/sm5/*.eval.ts, Story 2.5). Sender testsettet
//   gjennom lib/ai til leverandøren i .env (mock som standard), og er ikke en del
//   av `npm test`. `npm run eval:sm5`; `-- --mode groq` leser i tillegg
//   .env.groq (finnes ikke fila, stopper kjøringen). Bare dette prosjektet får
//   AI_*- og NEXT_PUBLIC_*-verdiene, og variabler i skallet vinner over filene.
//   Prosjektet er bare med når `sm5` står i kommandoen, så et vanlig `vitest`
//   aldri sender noe til en leverandør.
// Playwright-testene ligger i e2e/ og kjøres med `npm run test:e2e`.
// `@/` løses fra `paths` i tsconfig.json.
const wantsSm5 = process.argv.includes("sm5");

export default defineConfig(({ mode }) => {
  if (wantsSm5 && mode !== "test" && !existsSync(`.env.${mode}`)) {
    throw new Error(`Mangler .env.${mode}. Lag fila med AI_PROVIDER=openai, AI_BASE_URL, AI_MODEL og AI_API_KEY.`);
  }
  return {
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: [
            "lib/**/*.test.ts",
            "app/**/*.test.ts",
            "components/**/*.test.ts",
            "evals/**/*.test.ts",
            "playwright.config.test.ts",
          ],
          exclude: [...configDefaults.exclude, "lib/**/*.db.test.ts"],
          // expectTypeOf gjør ingenting ved kjøring, og next build sjekker
          // ikke testfilene. Typesjekken gjør at typetestene faktisk feiler.
          typecheck: {
            enabled: true,
            include: [
              "lib/**/*.test.ts",
              "app/**/*.test.ts",
              "components/**/*.test.ts",
              "evals/**/*.test.ts",
            ],
            exclude: [...configDefaults.exclude, "lib/**/*.db.test.ts"],
          },
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          include: ["lib/**/*.db.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "sm5",
          include: wantsSm5 ? ["evals/**/*.eval.ts"] : [],
          env: wantsSm5 ? loadEnv(mode, process.cwd(), ["AI_", "NEXT_PUBLIC_"]) : {},
        },
      },
    ],
  },
  };
});
