import { prisma } from "@/lib/prisma";

export function findActiveCouponByCode(code: string) {
  return prisma.coupon.findFirst({ where: { code, active: true } });
}

export function findAllCoupons() {
  return prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });
}

export function findActiveCoupons() {
  return prisma.coupon.findMany({
    where: {
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });
}

type CreateCouponData = {
  code: string;
  type: string;
  value: number;
  minOrderAmount: number;
  expiresAt: Date | null;
  maxRedemptions: number | null;
  perUserLimit: number | null;
};

export function createCoupon(data: CreateCouponData) {
  return prisma.coupon.create({ data });
}

export function deleteCoupon(id: string) {
  return prisma.coupon.delete({ where: { id } });
}

export function setCouponActive(id: string, active: boolean) {
  return prisma.coupon.update({ where: { id }, data: { active } });
}

export function countRedemptionsForCoupon(couponId: string) {
  return prisma.couponRedemption.count({ where: { couponId } });
}

export function countRedemptionsForCouponByUser(couponId: string, userId: string) {
  return prisma.couponRedemption.count({ where: { couponId, userId } });
}

export function createCouponRedemption(data: {
  couponId: string;
  userId: string | null;
  orderId: string;
}) {
  return prisma.couponRedemption.create({ data });
}
