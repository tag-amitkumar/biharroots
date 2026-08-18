import { getAIProvider, isAIConfigured, AIMessage } from "@/features/ai/provider";
import { AIProviderNotConfiguredError } from "@/features/ai/errors";

export { isAIConfigured };

// Every genuinely LLM-dependent feature routes through this single choke
// point. It never fabricates a response when no provider is configured -
// it throws, and callers are expected to surface that honestly (a clear
// "AI provider not configured" state in the UI) rather than falling back
// to text that merely looks AI-generated.
export async function generateChatCompletion(
  messages: AIMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const provider = getAIProvider();

  if (!provider) {
    throw new AIProviderNotConfiguredError();
  }

  return provider.chat(messages, options);
}

// Best-effort JSON extraction from an LLM response: providers are asked to
// respond with JSON only, but even well-behaved models sometimes wrap it
// in prose or a markdown code fence, so this strips both before parsing.
export function parseJSONResponse<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;

  const start = candidate.indexOf("{");
  const arrayStart = candidate.indexOf("[");
  const firstBrace =
    start === -1 ? arrayStart : arrayStart === -1 ? start : Math.min(start, arrayStart);

  const lastBrace = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));

  const jsonSlice = firstBrace !== -1 && lastBrace !== -1 ? candidate.slice(firstBrace, lastBrace + 1) : candidate;

  return JSON.parse(jsonSlice.trim()) as T;
}
