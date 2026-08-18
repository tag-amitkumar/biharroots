import { prisma } from "@/lib/prisma";

export function findWalletByUserId(userId: string) {
  return prisma.wallet.findUnique({ where: { userId } });
}

export function findTransactionsForUser(userId: string, limit = 50) {
  return prisma.walletTransaction.findMany({
    where: { wallet: { userId } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function findTransactionsSinceBySource(userId: string, source: string, since: Date) {
  return prisma.walletTransaction.findMany({
    where: { wallet: { userId }, source, createdAt: { gte: since } },
  });
}

// Atomically upserts the user's wallet, applies the balance delta, and
// appends a ledger entry recording the resulting balance - so the wallet's
// balance is always reconstructable from its transaction history, not just a
// mutable counter that can drift out of sync.
export async function applyTransaction(
  userId: string,
  data: { type: string; source: string; amount: number; note?: string; orderId?: string }
) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0 },
    });

    const balanceAfter = wallet.balance + data.amount;

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: balanceAfter },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: data.type,
        source: data.source,
        amount: data.amount,
        balanceAfter,
        note: data.note,
        orderId: data.orderId,
      },
    });

    return { wallet: updatedWallet, transaction };
  });
}
