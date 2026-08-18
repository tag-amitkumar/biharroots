import * as filtering from "@/features/products/filtering";
import { parseNaturalLanguageQuery, DIETARY_KEYWORDS } from "@/features/products/nlpQuery";
import { SHIPPING_OPTIONS, FREE_EXPRESS_SHIPPING_THRESHOLD } from "@/features/orders/shipping";
import { generateChatCompletion, isAIConfigured } from "@/features/ai/service";
import { AIMessage } from "@/features/ai/provider";
import { AIProviderNotConfiguredError } from "@/features/ai/errors";

// Every reply the assistant gives is grounded in one of two ways:
//  - "rule": a template answer built from real store data (shipping
//    config, real product search results) - always available, no LLM
//    required, and never claims to be more than it is.
//  - "llm": a free-form reply from the configured AI provider, used only
//    for open-ended questions the rule-based matcher can't handle.
export type AssistantReplyProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
};

export type AssistantReply = {
  reply: string;
  products: AssistantReplyProduct[];
  source: "rule" | "llm";
};

type Intent =
  | { type: "greeting" }
  | { type: "shipping" }
  | { type: "returns" }
  | { type: "payment" }
  | { type: "escalate" }
  | {
      type: "filtered";
      maxPrice?: number;
      dietary?: { field: keyof filtering.ProductFilterInput; label: string };
      keywords?: string;
    }
  | { type: "compare"; termA: string; termB: string }
  | { type: "search"; keywords: string }
  | { type: "unmatched" };

function matchIntent(raw: string): Intent {
  const text = raw.toLowerCase().trim();

  if (!text) return { type: "unmatched" };

  const compareMatch = text.match(/^(?:compare\s+)?(.+?)\s+(?:vs\.?|versus|or)\s+(.+)$/);
  if (compareMatch) {
    return { type: "compare", termA: compareMatch[1].trim(), termB: compareMatch[2].trim() };
  }

  if (/\b(human|agent|representative|real person|customer care|talk to (someone|support))\b/.test(text)) {
    return { type: "escalate" };
  }

  if (text.length <= 20 && /\b(hi|hello|hey|namaste|good morning|good evening)\b/.test(text)) {
    return { type: "greeting" };
  }

  if (/\b(ship|shipping|shipped|delivery|deliver|when will .*(arrive|reach))\b/.test(text)) {
    return { type: "shipping" };
  }

  if (/\b(return|returns|refund|refunds|exchange|cancel)\b/.test(text)) {
    return { type: "returns" };
  }

  if (/\b(pay|payment|cod|cash on delivery|upi|credit card|debit card)\b/.test(text)) {
    return { type: "payment" };
  }

  // Shared with AI Smart Search (products/nlpQuery.ts) so a budget/dietary
  // phrase typed into the chat is understood identically to one typed into
  // the search box, instead of maintaining two copies of this parsing.
  const parsed = parseNaturalLanguageQuery(text);
  const matchedDietary = DIETARY_KEYWORDS.find((dietary) => parsed[dietary.field]);

  if (parsed.maxPrice !== undefined || matchedDietary) {
    return {
      type: "filtered",
      maxPrice: parsed.maxPrice,
      dietary: matchedDietary ? { field: matchedDietary.field, label: matchedDietary.label } : undefined,
      keywords: parsed.freeText || undefined,
    };
  }

  if (text.length > 2) return { type: "search", keywords: raw.trim() };

  return { type: "unmatched" };
}

function toReplyProduct(product: {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}): AssistantReplyProduct {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    description: product.description,
  };
}

async function searchTopProducts(input: filtering.ProductFilterInput, limit = 4) {
  const products = await filtering.findFilteredProducts({
    ...input,
    sort: input.sort ?? "popularity",
    page: 1,
    pageSize: limit,
  });

  return products.map(toReplyProduct);
}

function shippingAnswer() {
  const [standard, express] = SHIPPING_OPTIONS;

  return (
    `${standard.label} is free on every order. ` +
    `${express.label} costs ₹${express.cost}, but it's free once your order is ₹${FREE_EXPRESS_SHIPPING_THRESHOLD} or more.`
  );
}

function returnsAnswer() {
  return (
    "We don't have an automated online return flow yet - if something isn't right with your order, " +
    "our support team can sort it out directly. Want me to connect you with them?"
  );
}

function paymentAnswer() {
  return "Right now we accept Cash on Delivery for every order. Online payment is coming soon!";
}

async function handleIntent(intent: Intent): Promise<AssistantReply> {
  switch (intent.type) {
    case "greeting":
      return {
        reply: "Hi! I'm the NatureCart shopping assistant. Ask me about shipping, payments, or say something like \"organic snacks under 300\" and I'll find real matches for you.",
        products: [],
        source: "rule",
      };

    case "shipping":
      return { reply: shippingAnswer(), products: [], source: "rule" };

    case "returns":
      return { reply: returnsAnswer(), products: [], source: "rule" };

    case "payment":
      return { reply: paymentAnswer(), products: [], source: "rule" };

    case "escalate":
      return {
        reply: "Of course - use the \"Talk to a human\" button below and our team will follow up by email.",
        products: [],
        source: "rule",
      };

    case "filtered": {
      const filterInput: filtering.ProductFilterInput = {
        maxPrice: intent.maxPrice,
        search: intent.keywords,
        ...(intent.dietary ? { [intent.dietary.field]: true } : {}),
      };

      const products = await searchTopProducts(filterInput);

      const descriptor = [intent.dietary?.label, intent.maxPrice !== undefined ? `under ₹${intent.maxPrice}` : undefined]
        .filter(Boolean)
        .join(" ");

      return {
        reply:
          products.length > 0
            ? `Here are some ${descriptor || "matching"} picks:`
            : `I couldn't find anything ${descriptor ? descriptor + " " : ""}right now - try a different budget or keyword.`,
        products,
        source: "rule",
      };
    }

    case "compare": {
      const [resultsA, resultsB] = await Promise.all([
        searchTopProducts({ search: intent.termA }, 1),
        searchTopProducts({ search: intent.termB }, 1),
      ]);

      const products = [...resultsA, ...resultsB];

      if (products.length === 0) {
        return {
          reply: `I couldn't find "${intent.termA}" or "${intent.termB}" in our catalog to compare.`,
          products: [],
          source: "rule",
        };
      }

      const lines = products.map((p) => `${p.name} - ₹${p.price}`);

      return {
        reply: `Here's what I found:\n${lines.join("\n")}\nOpen our Compare page to see a full side-by-side.`,
        products,
        source: "rule",
      };
    }

    case "search": {
      const products = await searchTopProducts({ search: intent.keywords });

      return {
        reply:
          products.length > 0
            ? `Here's what I found for "${intent.keywords}":`
            : `I couldn't find anything matching "${intent.keywords}". Try a different word, or ask me about shipping, payment, or a budget.`,
        products,
        source: "rule",
      };
    }

    case "unmatched":
      return {
        reply:
          "I can help with shipping, payments, budget-based shopping, or organic/vegan/gluten-free picks. " +
          "For anything else, use the \"Talk to a human\" button and our team will help.",
        products: [],
        source: "rule",
      };
  }
}

function buildSystemPrompt() {
  return (
    "You are the friendly, concise shopping assistant for NatureCart, an organic grocery store. " +
    "Keep replies short (2-4 sentences) and practical. " +
    `Real store facts: ${shippingAnswer()} ${paymentAnswer()} ${returnsAnswer()} ` +
    "Do not invent product names, prices, or policies beyond what's given here - " +
    "if asked about a specific product, suggest the customer search for it on the site instead of guessing details."
  );
}

// Main entry point: always tries the rule-based matcher first (fast,
// reliable, uses real data). Only asks the LLM for genuinely open-ended
// questions the matcher couldn't classify, and only when a provider is
// configured - otherwise it returns the honest "unmatched" rule reply.
export async function getAssistantReply(
  message: string,
  history: AIMessage[] = []
): Promise<AssistantReply> {
  const intent = matchIntent(message);

  if (intent.type !== "unmatched" || !isAIConfigured()) {
    return handleIntent(intent);
  }

  try {
    const reply = await generateChatCompletion([
      { role: "system", content: buildSystemPrompt() },
      ...history.slice(-6),
      { role: "user", content: message },
    ]);

    return { reply: reply.trim(), products: [], source: "llm" };
  } catch (error) {
    if (error instanceof AIProviderNotConfiguredError) {
      return handleIntent({ type: "unmatched" });
    }

    throw error;
  }
}
