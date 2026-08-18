import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AIProviderNotConfiguredError } from "@/features/ai/errors";
import { generateChatCompletion, parseJSONResponse } from "@/features/ai/service";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.GEMINI_API_KEY;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("generateChatCompletion", () => {
  it("throws AIProviderNotConfiguredError when no provider is configured", async () => {
    await expect(generateChatCompletion([{ role: "user", content: "Hi" }])).rejects.toThrow(
      AIProviderNotConfiguredError
    );
  });
});

describe("parseJSONResponse", () => {
  it("parses a plain JSON object", () => {
    expect(parseJSONResponse('{"a": 1}')).toEqual({ a: 1 });
  });

  it("extracts JSON from a markdown code fence", () => {
    const raw = '```json\n{"title": "Fresh Mango", "tags": ["fruit", "organic"]}\n```';
    expect(parseJSONResponse(raw)).toEqual({ title: "Fresh Mango", tags: ["fruit", "organic"] });
  });

  it("extracts JSON surrounded by explanatory prose", () => {
    const raw = 'Here is the result:\n{"score": 4.5}\nLet me know if you need changes.';
    expect(parseJSONResponse(raw)).toEqual({ score: 4.5 });
  });

  it("parses a top-level JSON array", () => {
    expect(parseJSONResponse('["a", "b", "c"]')).toEqual(["a", "b", "c"]);
  });
});
