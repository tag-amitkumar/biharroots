import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/features/products/filtering", () => ({
  findFilteredProducts: vi.fn(() => []),
}));

vi.mock("@/features/ai/service", () => ({
  generateChatCompletion: vi.fn(),
  isAIConfigured: vi.fn(() => false),
}));

import * as filtering from "@/features/products/filtering";
import * as aiService from "@/features/ai/service";
import { getAssistantReply } from "@/features/assistant/service";

function product(overrides: Partial<{ id: string; name: string; price: number }> = {}) {
  return {
    id: "p1",
    name: "Organic Almonds",
    price: 200,
    image: "/img.jpg",
    description: "",
    ...overrides,
  };
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.mocked(filtering.findFilteredProducts).mockReset().mockResolvedValue([]);
  vi.mocked(aiService.generateChatCompletion).mockReset();
  vi.mocked(aiService.isAIConfigured).mockReset().mockReturnValue(false);
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("getAssistantReply - rule-based intents", () => {
  it("answers a shipping question with real shipping data, without calling the AI provider", async () => {
    const result = await getAssistantReply("how long does shipping take?");

    expect(result.source).toBe("rule");
    expect(result.reply).toMatch(/free/i);
    expect(result.reply).toMatch(/999/);
    expect(aiService.generateChatCompletion).not.toHaveBeenCalled();
  });

  it("answers a payment question honestly (COD only)", async () => {
    const result = await getAssistantReply("what payment methods do you accept?");

    expect(result.reply).toMatch(/cash on delivery/i);
    expect(result.source).toBe("rule");
  });

  it("answers a returns question honestly, without inventing a return policy", async () => {
    const result = await getAssistantReply("can I return this?");

    expect(result.reply).toMatch(/don't have an automated online return/i);
  });

  it("greets back for a short greeting", async () => {
    const result = await getAssistantReply("hi");

    expect(result.reply).toMatch(/hi/i);
    expect(result.source).toBe("rule");
  });

  it("prompts the escalation flow for a request to talk to a human", async () => {
    const result = await getAssistantReply("I want to talk to a human agent");

    expect(result.reply).toMatch(/talk to a human/i);
  });

  it("extracts a budget and keeps a genuine product keyword as the search term", async () => {
    vi.mocked(filtering.findFilteredProducts).mockResolvedValue([product()] as never);

    await getAssistantReply("show me snacks under 300");

    expect(filtering.findFilteredProducts).toHaveBeenCalledWith(
      expect.objectContaining({ maxPrice: 300, search: "snacks" })
    );
  });

  it("strips filler words from a budget query instead of using them as a literal search filter", async () => {
    // Regression test: a naive "everything after the price phrase" search
    // filter would search for the literal phrase "show me something nice
    // rupees", which matches zero real product names.
    vi.mocked(filtering.findFilteredProducts).mockResolvedValue([product()] as never);

    await getAssistantReply("show me something nice under 150 rupees");

    const call = vi.mocked(filtering.findFilteredProducts).mock.calls[0][0];
    expect(call.maxPrice).toBe(150);
    expect(call.search).toBeUndefined();
  });

  it("recognizes a dietary keyword and filters by the matching attribute", async () => {
    vi.mocked(filtering.findFilteredProducts).mockResolvedValue([product()] as never);

    await getAssistantReply("do you have anything vegan?");

    expect(filtering.findFilteredProducts).toHaveBeenCalledWith(
      expect.objectContaining({ vegan: true })
    );
  });

  it("handles a 'X vs Y' comparison by searching for both products", async () => {
    vi.mocked(filtering.findFilteredProducts)
      .mockResolvedValueOnce([product({ id: "a", name: "Almonds" })] as never)
      .mockResolvedValueOnce([product({ id: "b", name: "Cashews" })] as never);

    const result = await getAssistantReply("almonds vs cashews");

    expect(result.products.map((p) => p.id)).toEqual(["a", "b"]);
    expect(result.reply).toMatch(/compare/i);
  });

  it("falls back to a plain keyword search for unrecognized queries", async () => {
    vi.mocked(filtering.findFilteredProducts).mockResolvedValue([product()] as never);

    const result = await getAssistantReply("mango");

    expect(filtering.findFilteredProducts).toHaveBeenCalledWith(
      expect.objectContaining({ search: "mango" })
    );
    expect(result.source).toBe("rule");
  });
});

describe("getAssistantReply - AI fallback for genuinely unmatched input", () => {
  it("returns the honest capability list when nothing matches and no AI provider is configured", async () => {
    const result = await getAssistantReply("");

    expect(result.source).toBe("rule");
    expect(result.reply).toMatch(/talk to a human/i);
    expect(aiService.generateChatCompletion).not.toHaveBeenCalled();
  });

  it("calls the AI provider for empty input already covered by 'unmatched' handling", async () => {
    // Sanity check that isAIConfigured is honored: mock it true and confirm
    // the assistant does call generateChatCompletion for truly unmatched text.
    vi.mocked(aiService.isAIConfigured).mockReturnValue(true);
    vi.mocked(aiService.generateChatCompletion).mockResolvedValue("A helpful, open-ended reply.");

    // "unmatched" requires text.length <= 2 to fail every other matcher;
    // an empty string exercises the same code path deterministically.
    const result = await getAssistantReply("");

    expect(result.source).toBe("llm");
    expect(result.reply).toBe("A helpful, open-ended reply.");
    expect(aiService.generateChatCompletion).toHaveBeenCalled();
  });
});
