import { expect, test } from "vitest";
import { suggestWithOutcome } from "@/lib/ai";
import { serverEnv } from "@/lib/env";
import { formatReport } from "./report";
import { assertModeMatchesProvider, pauseMs, runInfoFrom, toCaseResult } from "./run-helpers";
import type { CaseResult } from "./score";
import { SM5_TESTSET } from "./testset";

// SM-5-kjøringen (Story 2.5): sender testsettet, ett kall om gangen, gjennom
// samme `lib/ai` som appen og skriver resultatet. `npm run eval:sm5` bruker
// .env. Mot en leverandør: `npm run eval:sm5 -- --mode groq` leser .env og så
// .env.groq (ignorert av git, med AI_PROVIDER=openai, AI_BASE_URL, AI_MODEL og
// AI_API_KEY). Kjøringen feiler når miljøet er ugyldig eller når `--mode`
// ikke gir en leverandør, ikke når leverandøren ikke består. Avgjørelsen står
// i utskriften.

test("SM-5: testsettet mot gjeldende KI-leverandør", async () => {
  const info = runInfoFrom(serverEnv());
  assertModeMatchesProvider(import.meta.env.MODE, info);

  const results: CaseResult[] = [];
  for (const [index, testCase] of SM5_TESTSET.entries()) {
    if (index > 0 && pauseMs(info) > 0) {
      await new Promise((resolve) => setTimeout(resolve, pauseMs(info)));
    }
    results.push(toCaseResult(testCase, await suggestWithOutcome(testCase.description)));
  }

  console.log(`\n${formatReport(info, results).join("\n")}\n`);
  expect(results).toHaveLength(SM5_TESTSET.length);
}, 300_000);
