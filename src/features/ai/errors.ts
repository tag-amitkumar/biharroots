export class AIValidationError extends Error {}

// Thrown whenever a genuinely LLM-dependent feature is invoked but no
// provider is configured (no OPENAI_API_KEY / ANTHROPIC_API_KEY /
// GEMINI_API_KEY in the environment). Callers must catch this and report
// unavailability honestly rather than substituting fake generated content.
export class AIProviderNotConfiguredError extends Error {
  constructor() {
    super(
      "No AI provider is configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY to enable this feature."
    );
  }
}
