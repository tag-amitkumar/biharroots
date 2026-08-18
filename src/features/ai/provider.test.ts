import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAIProvider, isAIConfigured } from "@/features/ai/provider";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.GEMINI_API_KEY;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
});

describe("getAIProvider", () => {
  it("returns null when no provider API key is set", () => {
    expect(getAIProvider()).toBeNull();
    expect(isAIConfigured()).toBe(false);
  });

  it("returns the OpenAI provider when OPENAI_API_KEY is set", () => {
    process.env.OPENAI_API_KEY = "test-key";

    const provider = getAIProvider();

    expect(provider?.name).toBe("openai");
    expect(isAIConfigured()).toBe(true);
  });

  it("returns the Anthropic provider when only ANTHROPIC_API_KEY is set", () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    expect(getAIProvider()?.name).toBe("anthropic");
  });

  it("returns the Gemini provider when only GEMINI_API_KEY is set", () => {
    process.env.GEMINI_API_KEY = "test-key";

    expect(getAIProvider()?.name).toBe("gemini");
  });

  it("prefers OpenAI over Anthropic and Gemini when multiple keys are set", () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.GEMINI_API_KEY = "test-key";

    expect(getAIProvider()?.name).toBe("openai");
  });
});

describe("OpenAI provider chat()", () => {
  it("calls the OpenAI chat completions endpoint and extracts the reply", async () => {
    process.env.OPENAI_API_KEY = "test-key";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "Hello there!" } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = getAIProvider()!;
    const reply = await provider.chat([{ role: "user", content: "Hi" }]);

    expect(reply).toBe("Hello there!");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      })
    );
  });

  it("throws with the response body when the request fails", async () => {
    process.env.OPENAI_API_KEY = "test-key";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "unauthorized" })
    );

    const provider = getAIProvider()!;

    await expect(provider.chat([{ role: "user", content: "Hi" }])).rejects.toThrow(/401/);
  });
});

describe("Anthropic provider chat()", () => {
  it("separates system messages and extracts the reply text", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ text: "Sure, I can help." }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = getAIProvider()!;
    const reply = await provider.chat([
      { role: "system", content: "You are a shopping assistant." },
      { role: "user", content: "Recommend a snack" },
    ]);

    expect(reply).toBe("Sure, I can help.");

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse(requestInit.body);
    expect(body.system).toBe("You are a shopping assistant.");
    expect(body.messages).toEqual([{ role: "user", content: "Recommend a snack" }]);
  });
});

describe("Gemini provider chat()", () => {
  it("maps assistant role to 'model' and extracts the reply text", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "Here's an idea." }] } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = getAIProvider()!;
    const reply = await provider.chat([
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello!" },
    ]);

    expect(reply).toBe("Here's an idea.");

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse(requestInit.body);
    expect(body.contents.map((c: { role: string }) => c.role)).toEqual(["user", "model"]);
  });
});
