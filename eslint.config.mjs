import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 leverer flat config selv, så startpakkens FlatCompat
// (for eslint-config-next 15) er byttet ut.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // playwright-report/ og test-results/ lages av Playwright og har trace-
  // visningen som bundlet JavaScript når en test feiler.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
