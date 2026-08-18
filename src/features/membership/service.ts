import * as loyaltyService from "@/features/loyalty/service";
import * as userService from "@/features/users/service";

export type MembershipTier = Awaited<ReturnType<typeof loyaltyService.listMembershipTiers>>[number];

// A user's tier is never stored directly - it's always derived from their
// lifetimeSpend against the current tier thresholds, so reconfiguring
// thresholds in the admin panel instantly reclassifies every customer
// without a data migration or background job.
export function pickTierForSpend(tiers: MembershipTier[], lifetimeSpend: number): MembershipTier | null {
  const sorted = [...tiers].sort((a, b) => b.minSpend - a.minSpend);
  return sorted.find((tier) => lifetimeSpend >= tier.minSpend) ?? sorted[sorted.length - 1] ?? null;
}

export function nextTierFor(tiers: MembershipTier[], currentTier: MembershipTier | null) {
  if (!currentTier) return null;

  return (
    [...tiers]
      .sort((a, b) => a.minSpend - b.minSpend)
      .find((tier) => tier.minSpend > currentTier.minSpend) ?? null
  );
}

export async function getMembershipForUser(userId: string) {
  const [user, tiers] = await Promise.all([
    userService.getUserById(userId),
    loyaltyService.listMembershipTiers(),
  ]);

  const lifetimeSpend = user?.lifetimeSpend ?? 0;
  const tier = pickTierForSpend(tiers, lifetimeSpend);
  const nextTier = nextTierFor(tiers, tier);

  return {
    lifetimeSpend,
    tier,
    nextTier,
    amountToNextTier: nextTier ? Math.max(0, nextTier.minSpend - lifetimeSpend) : 0,
  };
}

export async function getCoinMultiplierForUser(userId: string) {
  const membership = await getMembershipForUser(userId);
  return membership.tier?.coinMultiplier ?? 1;
}

export async function getDiscountPercentForUser(userId: string) {
  const membership = await getMembershipForUser(userId);
  return membership.tier?.discountPercent ?? 0;
}

export async function hasFreeShippingForUser(userId: string) {
  const membership = await getMembershipForUser(userId);
  return membership.tier?.freeShipping ?? false;
}
