import { defineConfig } from "vitest/config";

// Vitest kjører ren logikk i lib/ og sjekken av Playwright-oppsettet i
// playwright.config.test.ts (AD-15). Playwright-testene ligger i e2e/ og
// kjøres med `npm run test:e2e`. `@/` løses fra `paths` i tsconfig.json.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "playwright.config.test.ts"],
  },
});
