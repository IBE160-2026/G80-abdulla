import { configDefaults, defineConfig } from "vitest/config";

// To Vitest-prosjekter:
// - unit: ren logikk i lib/ og sjekken av Playwright-oppsettet i
//   playwright.config.test.ts (AD-15). Trenger ikke Supabase.
//   `npm run test:unit`.
// - db: tester mot lokal Supabase (lib/**/*.db.test.ts), kjørt av
//   `npm run test:db` etter `db reset` og pgTAP.
// Playwright-testene ligger i e2e/ og kjøres med `npm run test:e2e`.
// `@/` løses fra `paths` i tsconfig.json.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["lib/**/*.test.ts", "playwright.config.test.ts"],
          exclude: [...configDefaults.exclude, "lib/**/*.db.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          include: ["lib/**/*.db.test.ts"],
        },
      },
    ],
  },
});
