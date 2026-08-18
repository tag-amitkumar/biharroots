// Deterministic (no-LLM) natural-language analysis of real review comments -
// word-frequency extraction, not a fabricated summary. Always available,
// and what every review summary falls back to when no AI provider is
// configured, so the feature is genuinely useful without one.

const STOPWORDS = new Set([
  "the", "a", "an", "is", "was", "are", "were", "it", "its", "this", "that",
  "these", "those", "i", "we", "you", "they", "he", "she", "and", "or", "but",
  "so", "of", "to", "in", "on", "for", "with", "as", "at", "by", "from", "up",
  "out", "if", "then", "than", "not", "no", "very", "just", "really", "also",
  "my", "our", "your", "their", "be", "have", "has", "had", "will", "would",
  "can", "could", "did", "do", "does", "product", "item", "order", "bought",
  "got", "get", "one", "im", "its", "all", "some", "much", "more", "into",
]);

function tokenize(comment: string): string[] {
  return comment
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

// Ranks the most frequently mentioned meaningful words across a set of
// comments - a real signal of what reviewers actually keep bringing up,
// not a guess.
function topKeywords(comments: string[], limit: number): string[] {
  const counts = new Map<string, number>();

  for (const comment of comments) {
    for (const word of new Set(tokenize(comment))) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export type DeterministicSummary = {
  sentiment: string;
  recommendationScore: number;
  pros: string[];
  cons: string[];
};

export function computeDeterministicSummary(
  reviews: { rating: number; comment: string }[]
): DeterministicSummary {
  const total = reviews.length;
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
  const positive = reviews.filter((r) => r.rating >= 4);
  const negative = reviews.filter((r) => r.rating <= 2);

  const recommendationScore = Math.round((positive.length / total) * 100);

  let sentiment: string;
  if (positive.length / total >= 0.25 && negative.length / total >= 0.25) {
    sentiment = "Mixed";
  } else if (avgRating >= 4.5) {
    sentiment = "Overwhelmingly Positive";
  } else if (avgRating >= 3.5) {
    sentiment = "Mostly Positive";
  } else if (avgRating >= 2.5) {
    sentiment = "Mixed";
  } else if (avgRating >= 1.5) {
    sentiment = "Mostly Negative";
  } else {
    sentiment = "Overwhelmingly Negative";
  }

  const pros = topKeywords(
    positive.map((r) => r.comment),
    5
  );
  const cons = topKeywords(
    negative.map((r) => r.comment),
    5
  );

  return { sentiment, recommendationScore, pros, cons };
}
