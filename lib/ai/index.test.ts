// Tester suggest() (Story 2.3, AR-9): valg av adapter etter AI_PROVIDER, ingen
// nettverkskall i mock-modus, 2000 tegn, tidsavbrudd på 5 s med falske timere,
// null ved feil og ugyldig svar, og at ingen rapporttekst, forslag eller nøkkel
// logges. fetch er stubbet, så ingen test når en ekte leverandør.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
// lib/env validerer Supabase-variablene når den importeres, så de settes først.
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
const { AI_TIMEOUT_MS, suggest } = await import("./index");

const fetchStub = vi.fn();
let errorLog: ReturnType<typeof vi.spyOn>;
let warnLog: ReturnType<typeof vi.spyOn>;
let infoLog: ReturnType<typeof vi.spyOn>;
let plainLog: ReturnType<typeof vi.spyOn>;

const KEY = "sk-hemmelig-nøkkel-123";

function useOpenAi() {
  vi.stubEnv("AI_PROVIDER", "openai");
  vi.stubEnv("AI_BASE_URL", "https://ki.example.test/v1");
  vi.stubEnv("AI_MODEL", "test-modell");
  vi.stubEnv("AI_API_KEY", KEY);
}

function completion(content: unknown, status = 200) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status });
}

function loggedText(): string {
  return [errorLog, warnLog, infoLog, plainLog]
    .flatMap((spy) => spy.mock.calls)
    .map((args) => args.map(String).join(" "))
    .join("\n");
}

beforeEach(() => {
  fetchStub.mockReset();
  vi.stubGlobal("fetch", fetchStub);
  vi.stubEnv("AI_PROVIDER", "mock");
  errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
  warnLog = vi.spyOn(console, "warn").mockImplementation(() => {});
  infoLog = vi.spyOn(console, "info").mockImplementation(() => {});
  plainLog = vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("suggest med mock", () => {
  test("gir et forutsigbart forslag uten nettverkskall", async () => {
    expect(await suggest("Gatelyset ved gangveien er ødelagt")).toEqual({
      category: "lighting",
      summary: "Gatelyset ved gangveien er ødelagt",
    });
    expect(fetchStub).not.toHaveBeenCalled();
  });

  test("uten AI_PROVIDER er mock standard", async () => {
    vi.stubEnv("AI_PROVIDER", "");
    expect((await suggest("Søppel på bakken"))?.category).toBe("waste");
    expect(fetchStub).not.toHaveBeenCalled();
  });

  test("testordet gir null, uten logging", async () => {
    expect(await suggest("ingenforslag")).toBeNull();
    expect(loggedText()).toBe("");
  });

  test("bare 2000 tegn brukes, og lang tekst gir likevel forslag", async () => {
    const text = `Gatelyset er ødelagt. ${"a".repeat(3000)}`;
    expect((await suggest(text))?.category).toBe("lighting");
    // Testordet etter tegn 2000 er ikke med.
    expect((await suggest("a".repeat(2000) + "ingenforslag"))?.category).toBe("other");
  });

  test("ugyldig AI_PROVIDER gir null, uten at miljøtekst logges", async () => {
    vi.stubEnv("AI_PROVIDER", "annet");
    expect(await suggest("Hull i veien")).toBeNull();
    expect(errorLog).toHaveBeenCalledWith("suggest", "feil");
    expect(loggedText()).not.toContain("annet");
  });
});

describe("suggest med openai", () => {
  beforeEach(useOpenAi);

  test("kaller leverandøren og gir det validerte forslaget", async () => {
    fetchStub.mockResolvedValue(completion('{"category":"roads_sidewalks","summary":"Hull i veien"}'));
    expect(await suggest("Stort hull i veien")).toEqual({
      category: "roads_sidewalks",
      summary: "Hull i veien",
    });
    const [url, init] = fetchStub.mock.calls[0];
    expect(url).toBe("https://ki.example.test/v1/chat/completions");
    expect(init.headers.Authorization).toBe(`Bearer ${KEY}`);
    expect(JSON.parse(init.body).model).toBe("test-modell");
  });

  test("høyst 2000 tegn sendes", async () => {
    fetchStub.mockResolvedValue(completion('{"category":"other","summary":"x"}'));
    await suggest("a".repeat(2500));
    const body = JSON.parse(fetchStub.mock.calls[0][1].body);
    expect(body.messages[1].content).toHaveLength(2000);

    fetchStub.mockClear();
    await suggest("😀".repeat(2500));
    const emoji = JSON.parse(fetchStub.mock.calls[0][1].body);
    expect([...emoji.messages[1].content]).toHaveLength(2000);
  });

  test.each([
    ["ikke-200", () => completion('{"category":"other"}', 500), "http_500"],
    ["ugyldig kategori", () => completion('{"category":"Belysning","summary":"x"}'), "ugyldig_svar"],
    ["ugyldig JSON", () => completion("ikke json"), "ugyldig_svar"],
  ])("%s gir null og logger bare feilkoden", async (_name, response, code) => {
    fetchStub.mockImplementation(async () => response());
    expect(await suggest("Hemmelig beskrivelse 12345")).toBeNull();
    expect(errorLog).toHaveBeenCalledWith("suggest", code);
  });

  test("en kastet feil gir null", async () => {
    fetchStub.mockRejectedValue(new Error(`feil med ${KEY} og Hemmelig beskrivelse 12345`));
    expect(await suggest("Hemmelig beskrivelse 12345")).toBeNull();
    expect(errorLog).toHaveBeenCalledWith("suggest", "nettverk");
  });

  test("manglende nøkkel gir null", async () => {
    vi.stubEnv("AI_API_KEY", "");
    expect(await suggest("Hull i veien")).toBeNull();
    expect(fetchStub).not.toHaveBeenCalled();
  });

  test("ingen rapporttekst, forslag eller nøkkel logges, hverken ved suksess eller feil", async () => {
    fetchStub.mockResolvedValueOnce(completion('{"category":"other","summary":"Hemmelig oppsummering 67890"}'));
    await suggest("Hemmelig beskrivelse 12345");
    fetchStub.mockRejectedValueOnce(new Error(`${KEY} Hemmelig beskrivelse 12345`));
    await suggest("Hemmelig beskrivelse 12345");
    fetchStub.mockResolvedValueOnce(completion("Hemmelig beskrivelse 12345"));
    await suggest("Hemmelig beskrivelse 12345");
    vi.stubEnv("AI_API_KEY", "");
    await suggest("Hemmelig beskrivelse 12345");

    expect(loggedText()).not.toMatch(/Hemmelig|12345|67890|sk-|nøkkel/);
  });

  describe("tidsavbrudd", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    test("er 5000 ms", () => {
      expect(AI_TIMEOUT_MS).toBe(5000);
    });

    test("et svar som ikke kommer, gir null etter 5 s og avbryter kallet", async () => {
      let signal: AbortSignal | undefined | null;
      fetchStub.mockImplementation((_url: string, init: RequestInit) => {
        signal = init.signal;
        return new Promise(() => {});
      });

      const pending = suggest("Hull i veien");
      let settled = false;
      void pending.then(() => {
        settled = true;
      });

      await vi.advanceTimersByTimeAsync(AI_TIMEOUT_MS - 1);
      expect(settled).toBe(false);
      expect(signal?.aborted).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      expect(await pending).toBeNull();
      expect(signal?.aborted).toBe(true);
      expect(errorLog).toHaveBeenCalledWith("suggest", "timeout");
    });

    test("et svar som kommer før 5 s, gir forslaget, og tidtakeren ryddes", async () => {
      fetchStub.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(completion('{"category":"waste","summary":"Boss"}')), 4000);
          }),
      );
      const pending = suggest("Boss");
      await vi.advanceTimersByTimeAsync(4000);
      expect(await pending).toEqual({ category: "waste", summary: "Boss" });
      expect(vi.getTimerCount()).toBe(0);
    });

    test("et svar etter tidsavbruddet endrer ikke resultatet og gir ingen uhåndtert feil", async () => {
      let resolveLate: (response: Response) => void = () => {};
      fetchStub.mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolveLate = resolve;
          }),
      );
      const pending = suggest("Hull i veien");
      await vi.advanceTimersByTimeAsync(AI_TIMEOUT_MS);
      expect(await pending).toBeNull();
      resolveLate(completion('{"category":"other","summary":"x"}'));
      await vi.advanceTimersByTimeAsync(0);
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
