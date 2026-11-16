// Tester vaktene i vitest.config.ts (Story 2.5): at sm5-prosjektet bare er med
// når `sm5` står i kommandoen og bare får AI_*- og NEXT_PUBLIC_*-verdier, og at
// kjøringen stopper når `.env.<modus>` mangler. Uten dem kan et vanlig `vitest`
// sende 20 kall med en ekte nøkkel, og en `--mode` med skrivefeil kan måle mock
// uten at noen ser det. Kjøres med Vitest (unit).
import { afterEach, expect, test, vi } from "vitest";

const ORIGINAL_ARGV = process.argv;

type Sm5Project = { test: { name: string; include: string[]; env: Record<string, string> } };

afterEach(() => {
  process.argv = ORIGINAL_ARGV;
  vi.unstubAllEnvs();
  vi.resetModules();
});

// `wantsSm5` leses når fila lastes, så fila må lastes på nytt for hver kommandolinje.
async function sm5Project(argv: string[], mode: string): Promise<Sm5Project> {
  process.argv = ["node", "vitest", ...argv];
  vi.resetModules();
  const { default: config } = await import("./vitest.config");
  if (typeof config !== "function") throw new Error("vitest.config.ts skal eksportere en funksjon");
  const resolved = await config({ mode, command: "serve" });
  const projects = (resolved.test?.projects ?? []) as unknown as Sm5Project[];
  const project = projects.find((p) => p.test.name === "sm5");
  if (!project) throw new Error("fant ikke sm5-prosjektet");
  return project;
}

test("uten sm5 i kommandoen er sm5-prosjektet tomt og får ingen miljøverdier", async () => {
  vi.stubEnv("AI_API_KEY", "hemmelig-nøkkel");
  const project = await sm5Project(["run", "--project", "unit"], "test");
  expect(project.test.include).toEqual([]);
  expect(project.test.env).toEqual({});
});

test("uten sm5 stopper ikke en modus uten .env-fil (vanlig kjøring)", async () => {
  await expect(sm5Project(["run", "--project", "unit"], "finnes-ikke-xyz")).resolves.toBeDefined();
});

test("med sm5 tar prosjektet bare evals/**/*.eval.ts", async () => {
  const project = await sm5Project(["run", "--project", "sm5"], "test");
  expect(project.test.include).toEqual(["evals/**/*.eval.ts"]);
});

test("med sm5 får prosjektet bare AI_*- og NEXT_PUBLIC_*-verdier, også fra skallet", async () => {
  vi.stubEnv("AI_LOCALFIX_CANARY", "ja");
  vi.stubEnv("NEXT_PUBLIC_LOCALFIX_CANARY", "ja");
  vi.stubEnv("LOCALFIX_CANARY", "nei");
  const { env } = (await sm5Project(["run", "--project", "sm5"], "test")).test;
  expect(env.AI_LOCALFIX_CANARY).toBe("ja");
  expect(env.NEXT_PUBLIC_LOCALFIX_CANARY).toBe("ja");
  expect(env.LOCALFIX_CANARY).toBeUndefined();
  const stray = Object.keys(env).filter((key) => !/^(AI_|NEXT_PUBLIC_)/.test(key));
  expect(stray, "variabler utenfor AI_ og NEXT_PUBLIC_").toEqual([]);
});

test("med sm5 og en modus uten .env.<modus> stopper kjøringen med en tydelig melding", async () => {
  await expect(sm5Project(["run", "--project", "sm5", "--mode", "finnes-ikke-xyz"], "finnes-ikke-xyz")).rejects.toThrow(
    /Mangler \.env\.finnes-ikke-xyz/,
  );
});

test("med sm5 stopper ikke en modus der .env.<modus> finnes, og standardmodus test trenger ingen fil", async () => {
  // `.env.example` ligger i rota og er en ekte fil, så modusen «example» finnes.
  await expect(sm5Project(["run", "--project", "sm5", "--mode", "example"], "example")).resolves.toBeDefined();
  await expect(sm5Project(["run", "--project", "sm5"], "test")).resolves.toBeDefined();
});
