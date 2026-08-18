import { describe, it, expect } from "vitest";
import { pickTierForSpend, nextTierFor, type MembershipTier } from "@/features/membership/service";

function tier(name: string, minSpend: number): MembershipTier {
  return {
    id: name.toLowerCase(),
    name,
    minSpend,
    coinMultiplier: 1,
    discountPercent: 0,
    freeShipping: false,
    earlyAccess: false,
    birthdayBonus: 0,
    sortOrder: minSpend,
    badgeColor: "#000000",
    updatedAt: new Date(),
  };
}

const TIERS = [tier("Green", 0), tier("Silver", 2000), tier("Gold", 5000), tier("Platinum", 15000)];

describe("pickTierForSpend", () => {
  it("picks the entry-level tier for a brand-new customer", () => {
    expect(pickTierForSpend(TIERS, 0)?.name).toBe("Green");
  });

  it("picks the highest tier the customer's spend qualifies for", () => {
    expect(pickTierForSpend(TIERS, 2500)?.name).toBe("Silver");
    expect(pickTierForSpend(TIERS, 4999)?.name).toBe("Silver");
    expect(pickTierForSpend(TIERS, 5000)?.name).toBe("Gold");
  });

  it("picks the top tier once spend exceeds every threshold", () => {
    expect(pickTierForSpend(TIERS, 1_000_000)?.name).toBe("Platinum");
  });

  it("does not upgrade a customer prematurely - just below a threshold stays at the lower tier", () => {
    expect(pickTierForSpend(TIERS, 14_999)?.name).toBe("Gold");
  });
});

describe("nextTierFor", () => {
  it("returns the tier immediately above the current one", () => {
    const current = pickTierForSpend(TIERS, 2500);
    expect(nextTierFor(TIERS, current)?.name).toBe("Gold");
  });

  it("returns null once already at the top tier", () => {
    const current = pickTierForSpend(TIERS, 1_000_000);
    expect(nextTierFor(TIERS, current)).toBeNull();
  });

  it("returns null when there is no current tier", () => {
    expect(nextTierFor(TIERS, null)).toBeNull();
  });
});
