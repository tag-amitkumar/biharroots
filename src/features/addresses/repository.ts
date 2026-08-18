import { prisma } from "@/lib/prisma";

export function findAddressesForUser(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export function unsetDefaultForUser(userId: string) {
  return prisma.address.updateMany({
    where: { userId },
    data: { isDefault: false },
  });
}

export function createAddress(
  userId: string,
  data: {
    label: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
    isDefault: boolean;
  }
) {
  return prisma.address.create({ data: { userId, ...data } });
}

export function updateAddressForUser(
  id: string,
  userId: string,
  data: Partial<{
    label: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
    isDefault: boolean;
  }>
) {
  return prisma.address.updateMany({ where: { id, userId }, data });
}

export function deleteAddressForUser(id: string, userId: string) {
  return prisma.address.deleteMany({ where: { id, userId } });
}
