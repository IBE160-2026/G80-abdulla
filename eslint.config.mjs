import { readdirSync } from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 leverer flat config selv, så startpakkens FlatCompat
// (for eslint-config-next 15) er byttet ut.
// Vertical slices (AD-16): en slice i features/<slice>/ importerer bare fra
// shared/ og fra seg selv. Bare app/ setter slicene sammen, og shared/ kjenner
// ingen slice. Sliceområdene leses fra mappene, så en ny slice (moderering i
// Epic 4) får reglene uten at denne fila endres. no-restricted-imports
// slår ikke sammen regelsett for filer som matcher flere blokker, så hver blokk
// gjentar mønstrene den bygger på.
const slices = readdirSync("features", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const imports = (dir) => [`@/${dir}`, `@/${dir}/**`];
const restrict = (message, ...dirs) => ({ group: dirs.flatMap(imports), message });

const APP = restrict("app/ setter sammen slicene og importeres aldri av features/ eller shared/.", "app");
const FEATURES = restrict("shared/ kjenner ingen slice. Flytt det felles ut i shared/ eller bruk en slot.", "features");
// AD-3: presentasjonen rører ikke datatilgangen. Typene fra shared/supabase/types
// er tillatt, og nettleserklienten har sin egen regel under.
const DATA = restrict(
  "Komponenter henter ikke data selv (AD-3). Gå via en Server Action eller en query i siden.",
  "shared/supabase/server",
  "shared/supabase/images",
  "shared/supabase/auth",
  "shared/supabase/proxy",
  "shared/supabase/test-admin",
);
const BROWSER_CLIENT = restrict(
  "Nettleserklienten brukes bare i features/auth/components (AD-3).",
  "shared/supabase/client",
);
const rule = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

const sliceRules = slices.flatMap((slice) => {
  const others = slices.filter((other) => other !== slice);
  const crossSlice = restrict(
    `En slice importerer ikke en annen slice (${slice} → andre). Del det i shared/, eller sett sammen i app/.`,
    ...others.map((other) => `features/${other}`),
  );
  const own = [crossSlice, APP];
  const components = [
    ...own,
    DATA,
    restrict("Komponenter importerer ikke queries.ts (AD-3).", `features/${slice}/queries`),
    restrict("KI-modulen kalles bare fra Server Actions (AD-3).", `features/${slice}/ai`),
    ...(slice === "auth" ? [] : [BROWSER_CLIENT]),
  ];
  return [
    { files: [`features/${slice}/**/*.{ts,tsx}`], rules: rule(...own) },
    { files: [`features/${slice}/components/**/*.{ts,tsx}`], ignores: ["**/*.test.ts"], rules: rule(...components) },
  ];
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // playwright-report/ og test-results/ lages av Playwright og har trace-
  // visningen som bundlet JavaScript når en test feiler. .claude/ har
  // Impeccable-filene (skills og skript), som ikke er en del av appen.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    ".claude/**",
  ]),
  ...sliceRules,
  {
    files: ["shared/**/*.{ts,tsx}"],
    rules: rule(FEATURES, APP),
  },
  {
    files: ["shared/ui/**/*.{ts,tsx}", "shared/layout/**/*.{ts,tsx}", "shared/report/**/*.{ts,tsx}"],
    ignores: ["**/*.test.ts"],
    rules: rule(FEATURES, APP, DATA, BROWSER_CLIENT),
  },
]);

export default eslintConfig;
