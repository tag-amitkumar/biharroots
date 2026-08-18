// Pluggable AI provider abstraction. Every provider implements the same
// tiny `chat` contract via plain fetch calls to each vendor's REST API -
// no vendor SDK dependency, so swapping or adding a provider never touches
// call sites, just this file. getAIProvider() picks whichever provider has
// an API key present in the environment; if none do, it returns null and
// every caller is required to handle that explicitly (see
// AIProviderNotConfiguredError) rather than fabricating a response.

export type AIMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AIProvider {
  name: string;
  chat(messages: AIMessage[], options?: { temperature?: number; maxTokens?: number }): Promise<string>;
}

function splitSystem(messages: AIMessage[]) {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const rest = messages.filter((m) => m.role !== "system");
  return { system, rest };
}

function createOpenAIProvider(apiKey: string, model = "gpt-4o-mini"): AIProvider {
  return {
    name: "openai",
    async chat(messages, options) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 600,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI request failed: ${res.status} ${await res.text()}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    },
  };
}

function createAnthropicProvider(apiKey: string, model = "claude-3-5-haiku-latest"): AIProvider {
  return {
    name: "anthropic",
    async chat(messages, options) {
      const { system, rest } = splitSystem(messages);

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          system: system || undefined,
          messages: rest.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: options?.maxTokens ?? 600,
          temperature: options?.temperature ?? 0.7,
        }),
      });

      if (!res.ok) {
        throw new Error(`Anthropic request failed: ${res.status} ${await res.text()}`);
      }

      const data = await res.json();
      return data.content?.[0]?.text ?? "";
    },
  };
}

function createGeminiProvider(apiKey: string, model = "gemini-2.0-flash"): AIProvider {
  return {
    name: "gemini",
    async chat(messages, options) {
      const { system, rest } = splitSystem(messages);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: system ? { parts: [{ text: system }] } : undefined,
            contents: rest.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            generationConfig: {
              temperature: options?.temperature ?? 0.7,
              maxOutputTokens: options?.maxTokens ?? 600,
            },
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`);
      }

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    },
  };
}

// Checked in this priority order; the first configured key wins. Reads
// env vars fresh each call rather than caching, since serverless/dev
// environments can have env vars change between invocations.
export function getAIProvider(): AIProvider | null {
  if (process.env.OPENAI_API_KEY) {
    return createOpenAIProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL);
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return createAnthropicProvider(process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_MODEL);
  }

  if (process.env.GEMINI_API_KEY) {
    return createGeminiProvider(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL);
  }

  return null;
}

export function isAIConfigured(): boolean {
  return getAIProvider() !== null;
}
