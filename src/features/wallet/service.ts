import * as walletRepository from "@/features/wallet/repository";
import * as loyaltyService from "@/features/loyalty/service";
import { WalletValidationError } from "@/features/wallet/errors";

export async function getWalletSummary(userId: string) {
  const [wallet, transactions] = await Promise.all([
    walletRepository.findWalletByUserId(userId),
    walletRepository.findTransactionsForUser(userId),
  ]);

  return {
    balance: wallet?.balance ?? 0,
    transactions,
  };
}

export async function earnCoins(
  userId: string,
  amount: number,
  source: string,
  options?: { note?: string; orderId?: string }
) {
  if (amount <= 0) return null;

  const { wallet } = await walletRepository.applyTransaction(userId, {
    type: "earn",
    source,
    amount: Math.round(amount),
    note: options?.note,
    orderId: options?.orderId,
  });

  return wallet;
}

export async function redeemCoins(userId: string, amount: number, orderId?: string) {
  const config = await loyaltyService.getConfig();

  if (amount < config.minRedemptionCoins) {
    throw new WalletValidationError(
      `Minimum redemption is ${config.minRedemptionCoins} NatureCoins`
    );
  }

  const wallet = await walletRepository.findWalletByUserId(userId);

  if (!wallet || wallet.balance < amount) {
    throw new WalletValidationError("Insufficient NatureCoin balance");
  }

  const { wallet: updated } = await walletRepository.applyTransaction(userId, {
    type: "redeem",
    source: "redemption",
    amount: -amount,
    orderId,
  });

  return updated;
}

// Bounds a requested redemption to what's actually usable: can't redeem more
// coins than the wallet holds, below the configured minimum, or for more
// value than the order subtotal (so an order can never look "free" purely
// from coin redemption rounding).
export async function previewRedemption(userId: string, requestedCoins: number, subtotal: number) {
  const [config, wallet] = await Promise.all([
    loyaltyService.getConfig(),
    walletRepository.findWalletByUserId(userId),
  ]);

  const balance = wallet?.balance ?? 0;

  if (requestedCoins <= 0 || balance < config.minRedemptionCoins) {
    return { coins: 0, discount: 0, redemptionValue: config.redemptionValue };
  }

  const maxCoinsBySubtotal = Math.floor(subtotal / config.redemptionValue);
  const coins = Math.max(
    0,
    Math.min(requestedCoins, balance, maxCoinsBySubtotal)
  );

  const discount = Math.round(coins * config.redemptionValue);

  return { coins, discount, redemptionValue: config.redemptionValue };
}

export async function claimDailyBonus(
  userId: string,
  birthday: Date | null,
  birthdayBonusOverride?: number
) {
  const config = await loyaltyService.getConfig();
  const birthdayBonus = birthdayBonusOverride ?? config.birthdayBonus;

  const now = new Date();
  // Bucket by UTC calendar day (same reasoning as analytics.getRevenueOverTime):
  // local-timezone day boundaries would let a customer east of UTC claim the
  // bonus twice around midnight, or never on days that straddle the boundary.
  const todayStartUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const wallet = await walletRepository.findWalletByUserId(userId);
  const claimedToday = await walletRepository.findTransactionsSinceBySource(
    userId,
    "daily_login",
    todayStartUTC
  );

  const alreadyClaimedToday = claimedToday.length > 0;

  let dailyAwarded = 0;
  let birthdayAwarded = 0;

  if (!alreadyClaimedToday && config.dailyLoginBonus > 0) {
    await earnCoins(userId, config.dailyLoginBonus, "daily_login", {
      note: "Daily login bonus",
    });
    dailyAwarded = config.dailyLoginBonus;
  }

  if (birthday) {
    const isBirthdayToday =
      birthday.getUTCMonth() === now.getUTCMonth() &&
      birthday.getUTCDate() === now.getUTCDate();

    if (isBirthdayToday && birthdayBonus > 0) {
      const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      const birthdayThisYear = await walletRepository.findTransactionsSinceBySource(
        userId,
        "birthday",
        yearStart
      );

      if (birthdayThisYear.length === 0) {
        await earnCoins(userId, birthdayBonus, "birthday", {
          note: "Happy birthday from NatureCart!",
        });
        birthdayAwarded = birthdayBonus;
      }
    }
  }

  const updatedWallet = await walletRepository.findWalletByUserId(userId);

  return {
    dailyAwarded,
    birthdayAwarded,
    balance: updatedWallet?.balance ?? wallet?.balance ?? 0,
  };
}
