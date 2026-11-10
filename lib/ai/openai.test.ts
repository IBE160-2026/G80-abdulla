// Tester OpenAI-adapteren (Story 2.3) med stubbet fetch: forespørselen
// (URL, Authorization, temperature, response_format og 2000 tegn), JSON i
// kodeblokk, ugyldig svar, ikke-200, kastet feil og avbrudd. Ingen test kaller
// en ekte leverandør.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AiError, openaiSuggest } from "./openai";

const config = { baseUrl: "https://ki.example.test/v1", model: "test-modell", apiKey: "hemmelig-nøkkel" };

const fetchStub = vi.fn();

beforeEach(() => {
  fetchStub.mockReset();
  vi.stubGlobal("fetch", fetchStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function completion(content: unknown, init: ResponseInit = { status: 200 }) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), init);
}

async function failure(): Promise<string> {
  try {
    await openaiSuggest("Hull i veien", config);
  } catch (error) {
    expect(error).toBeInstanceOf(AiError);
    return (error as AiError).code;
  }
  throw new Error("Forventet en AiError");
}

describe("openaiSuggest", () => {
  test("sender POST til {AI_BASE_URL}/chat/completions med nøkkel, temperature 0 og JSON-format", async () => {
    fetchStub.mockResolvedValue(completion('{"category":"lighting","summary":"Gatelyset er ødelagt"}'));
    const result = await openaiSuggest("Gatelyset er ødelagt", config);

    expect(result).toEqual({ category: "lighting", summary: "Gatelyset er ødelagt" });
    expect(fetchStub).toHaveBeenCalledTimes(1);
    const [url, init] = fetchStub.mock.calls[0];
    expect(url).toBe("https://ki.example.test/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer hemmelig-nøkkel");
    expect(init.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(init.body);
    expect(body.model).toBe("test-modell");
    expect(body.temperature).toBe(0);
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toMatch(/category/);
    expect(body.messages[0].content).toMatch(/summary/);
    expect(body.messages[0].content).toMatch(/300/);
    expect(body.messages[0].content).toMatch(/norsk/);
    expect(body.messages[1]).toEqual({ role: "user", content: "Gatelyset er ødelagt" });
  });

  test("en skråstrek til slutt i AI_BASE_URL gir ikke dobbel skråstrek", async () => {
    fetchStub.mockResolvedValue(completion('{"category":"other","summary":"x"}'));
    await openaiSuggest("Hull", { ...config, baseUrl: "https://ki.example.test/v1/" });
    expect(fetchStub.mock.calls[0][0]).toBe("https://ki.example.test/v1/chat/completions");
  });

  test("høyst 2000 tegn av beskrivelsen sendes", async () => {
    fetchStub.mockResolvedValue(completion('{"category":"other","summary":"x"}'));
    await openaiSuggest("a".repeat(3000), config);
    const body = JSON.parse(fetchStub.mock.calls[0][1].body);
    expect(body.messages[1].content).toHaveLength(2000);
  });

  test("JSON pakket i en kodeblokk tåles", async () => {
    fetchStub.mockResolvedValue(completion('```json\n{"category":"waste","summary":"Full søppelkasse"}\n```'));
    expect(await openaiSuggest("Full søppelkasse", config)).toEqual({
      category: "waste",
      summary: "Full søppelkasse",
    });
  });

  test("gyldig kategori uten oppsummering gir kategorien og summary null", async () => {
    fetchStub.mockResolvedValue(completion('{"category":"vandalism"}'));
    expect(await openaiSuggest("Tagging", config)).toEqual({ category: "vandalism", summary: null });
  });

  test("oppsummeringen renses: HTML fjernes og den kortes til 300 tegn", async () => {
    fetchStub.mockResolvedValue(
      completion(JSON.stringify({ category: "other", summary: `<b>${"a".repeat(400)}</b>` })),
    );
    const result = await openaiSuggest("Noe", config);
    expect(result?.summary).toBe("a".repeat(300));
  });

  test.each([
    ["norsk kategorinavn", '{"category":"Belysning","summary":"x"}'],
    ["feil store bokstaver", '{"category":"LIGHTING","summary":"x"}'],
    ["mellomrom i kategorien", '{"category":"lighting ","summary":"x"}'],
    ["ugyldig JSON", "{category: lighting"],
    ["vanlig tekst", "Jeg foreslår belysning"],
    ["tomt innhold", ""],
    ["manglende innhold", undefined],
  ])("%s gir feilen ugyldig_svar", async (_name, content) => {
    fetchStub.mockResolvedValue(completion(content));
    expect(await failure()).toBe("ugyldig_svar");
  });

  test("svar uten choices eller med ugyldig JSON-kropp gir ugyldig_svar", async () => {
    fetchStub.mockResolvedValue(new Response(JSON.stringify({ choices: [] }), { status: 200 }));
    expect(await failure()).toBe("ugyldig_svar");
    fetchStub.mockResolvedValue(new Response("ikke json", { status: 200 }));
    expect(await failure()).toBe("ugyldig_svar");
  });

  test.each([400, 401, 429, 500, 503])("ikke-200 (%i) gir feilen http_<kode>", async (status) => {
    fetchStub.mockResolvedValue(new Response(JSON.stringify({ error: "Hull i veien" }), { status }));
    expect(await failure()).toBe(`http_${status}`);
  });

  test("en kastet nettverksfeil gir feilen nettverk, uten tekst fra feilen", async () => {
    fetchStub.mockRejectedValue(new Error("tilkobling nektet: hemmelig-nøkkel"));
    try {
      await openaiSuggest("Hull i veien", config);
      throw new Error("Forventet en feil");
    } catch (error) {
      expect((error as AiError).code).toBe("nettverk");
      expect((error as Error).message).not.toContain("hemmelig");
    }
  });

  test("signalet sendes til fetch, og et avbrudd gir feilen avbrutt", async () => {
    const controller = new AbortController();
    fetchStub.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            const error = new Error("avbrutt");
            error.name = "AbortError";
            reject(error);
          });
        }),
    );

    const pending = openaiSuggest("Hull i veien", config, controller.signal);
    expect(fetchStub.mock.calls[0][1].signal).toBe(controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: "avbrutt" });
  });
});
