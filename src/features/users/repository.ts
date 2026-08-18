import { prisma } from "@/lib/prisma";

const userListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export function findAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: userListSelect,
  });
}

export function updateUserRole(id: string, role: string) {
  return prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

export function countUsers() {
  return prisma.user.count();
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function createUser(data: {
  name: string;
  email: string;
  password?: string | null;
  image?: string | null;
}) {
  return prisma.user.create({ data });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function updateProfile(
  id: string,
  data: { name?: string; phone?: string }
) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });
}

export function updatePassword(id: string, password: string) {
  return prisma.user.update({ where: { id }, data: { password } });
}

export function incrementLifetimeSpend(id: string, amount: number) {
  return prisma.user.update({
    where: { id },
    data: { lifetimeSpend: { increment: amount } },
  });
}

export function updateLastLogin(id: string) {
  return prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
}
