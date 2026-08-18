import { prisma } from "@/lib/prisma";

const DEFAULTS = {
  id: "singleton",
  coinsPerRupee: 0.1,
  redemptionValue: 0.5,
  minRedemptionCoins: 100,
  reviewBonus: 20,
  dailyLoginBonus: 5,
  birthdayBonus: 100,
  referralReferrerBonus: 150,
  referralReferredBonus: 100,
  coinExpiryDays: null as number | null,
};

export async function getConfig() {
  const existing = await prisma.loyaltyConfig.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;

  return prisma.loyaltyConfig.create({ data: DEFAULTS });
}

type UpdateConfigInput = Partial<Omit<typeof DEFAULTS, "id">>;

export function updateConfig(data: UpdateConfigInput) {
  return prisma.loyaltyConfig.upsert({
    where: { id: "singleton" },
    update: data,
    create: { ...DEFAULTS, ...data },
  });
}

export function findMembershipTiers() {
  return prisma.membershipTier.findMany({ orderBy: { sortOrder: "asc" } });
}

export function updateMembershipTier(id: string, data: Partial<{
  minSpend: number;
  coinMultiplier: number;
  discountPercent: number;
  freeShipping: boolean;
  earlyAccess: boolean;
  birthdayBonus: number;
  badgeColor: string;
}>) {
  return prisma.membershipTier.update({ where: { id }, data });
}
