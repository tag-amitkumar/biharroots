import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tiers = [
  {
    name: "Green",
    minSpend: 0,
    coinMultiplier: 1.0,
    discountPercent: 0,
    freeShipping: false,
    earlyAccess: false,
    birthdayBonus: 50,
    sortOrder: 0,
    badgeColor: "#16a34a",
  },
  {
    name: "Silver",
    minSpend: 2000,
    coinMultiplier: 1.25,
    discountPercent: 5,
    freeShipping: false,
    earlyAccess: false,
    birthdayBonus: 100,
    sortOrder: 1,
    badgeColor: "#71717a",
  },
  {
    name: "Gold",
    minSpend: 5000,
    coinMultiplier: 1.5,
    discountPercent: 10,
    freeShipping: true,
    earlyAccess: true,
    birthdayBonus: 200,
    sortOrder: 2,
    badgeColor: "#d97706",
  },
  {
    name: "Platinum",
    minSpend: 15000,
    coinMultiplier: 2.0,
    discountPercent: 15,
    freeShipping: true,
    earlyAccess: true,
    birthdayBonus: 500,
    sortOrder: 3,
    badgeColor: "#7c3aed",
  },
];

for (const tier of tiers) {
  await prisma.membershipTier.upsert({
    where: { name: tier.name },
    update: tier,
    create: tier,
  });
}

await prisma.loyaltyConfig.upsert({
  where: { id: "singleton" },
  update: {},
  create: { id: "singleton" },
});

console.log("Seeded membership tiers and loyalty config");
await prisma.$disconnect();
