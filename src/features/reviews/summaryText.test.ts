import { describe, it, expect } from "vitest";
import { computeDeterministicSummary } from "@/features/reviews/summaryText";

describe("computeDeterministicSummary", () => {
  it("classifies a high-rated set of reviews as overwhelmingly positive", () => {
    const result = computeDeterministicSummary([
      { rating: 5, comment: "Amazing quality and fast delivery" },
      { rating: 5, comment: "Great quality, will buy again" },
      { rating: 4, comment: "Good quality overall" },
    ]);

    expect(result.sentiment).toBe("Overwhelmingly Positive");
    expect(result.recommendationScore).toBe(100);
  });

  it("classifies a low-rated set of reviews as overwhelmingly negative", () => {
    const result = computeDeterministicSummary([
      { rating: 1, comment: "Terrible packaging, arrived broken" },
      { rating: 1, comment: "Poor packaging and late delivery" },
    ]);

    expect(result.sentiment).toBe("Overwhelmingly Negative");
    expect(result.recommendationScore).toBe(0);
  });

  it("classifies a genuinely polarized set of reviews as mixed rather than averaging it away", () => {
    const result = computeDeterministicSummary([
      { rating: 5, comment: "Loved it" },
      { rating: 5, comment: "Loved it" },
      { rating: 1, comment: "Hated it" },
      { rating: 1, comment: "Hated it" },
    ]);

    expect(result.sentiment).toBe("Mixed");
    expect(result.recommendationScore).toBe(50);
  });

  it("extracts real repeated keywords from positive comments as pros", () => {
    const result = computeDeterministicSummary([
      { rating: 5, comment: "The packaging was excellent and secure" },
      { rating: 4, comment: "Really liked the packaging, very secure" },
      { rating: 5, comment: "Packaging was great" },
    ]);

    expect(result.pros).toContain("packaging");
  });

  it("extracts real repeated keywords from negative comments as cons", () => {
    const result = computeDeterministicSummary([
      { rating: 1, comment: "Delivery was extremely late" },
      { rating: 2, comment: "Late delivery, disappointed" },
    ]);

    expect(result.cons).toContain("delivery");
  });

  it("does not fabricate pros when there are no positive reviews", () => {
    const result = computeDeterministicSummary([
      { rating: 1, comment: "Awful experience" },
      { rating: 2, comment: "Not good" },
    ]);

    expect(result.pros).toEqual([]);
  });
});
