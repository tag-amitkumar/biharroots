import { prisma } from "@/lib/prisma";

export function findUserByReferralCode(code: string) {
  return prisma.user.findUnique({ where: { referralCode: code } });
}

export function setUserReferralCode(userId: string, code: string) {
  return prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
}

export function createReferral(data: {
  referrerId: string;
  referredId: string;
  code: string;
  referrerReward: number;
  referredReward: number;
}) {
  return prisma.referral.create({
    data: {
      ...data,
      status: "completed",
      completedAt: new Date(),
    },
  });
}

export function findReferralsForReferrer(referrerId: string) {
  return prisma.referral.findMany({
    where: { referrerId },
    orderBy: { createdAt: "desc" },
    include: { referred: { select: { name: true, email: true } } },
  });
}

export function countCompletedReferrals() {
  return prisma.referral.count({ where: { status: "completed" } });
}

export function findAllReferrals(limit = 100) {
  return prisma.referral.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      referrer: { select: { name: true, email: true } },
      referred: { select: { name: true, email: true } },
    },
  });
}

export function sumRewardsPaid() {
  return prisma.referral.aggregate({
    where: { status: "completed" },
    _sum: { referrerReward: true, referredReward: true },
  });
}

export function findTopReferrers(limit = 5) {
  return prisma.referral.groupBy({
    by: ["referrerId"],
    where: { status: "completed" },
    _count: { referrerId: true },
    orderBy: { _count: { referrerId: "desc" } },
    take: limit,
  });
}

export function findUsersByIds(ids: string[]) {
  return prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true },
  });
}
