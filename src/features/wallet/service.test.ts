import { describe, it, expect, vi, beforeEach } from "vitest";
import { WalletValidationError } from "@/features/wallet/errors";

vi.mock("@/features/wallet/repository", () => ({
  findWalletByUserId: vi.fn(),
  findTransactionsForUser: vi.fn(),
  findTransactionsSinceBySource: vi.fn(),
  applyTransaction: vi.fn((userId, data) => ({
    wallet: { userId, balance: 100 + data.amount },
    transaction: { ...data },
  })),
}));

vi.mock("@/features/loyalty/service", () => ({
  getConfig: vi.fn(() => ({
    minRedemptionCoins: 100,
    redemptionValue: 0.5,
    dailyLoginBonus: 5,
    birthdayBonus: 100,
  })),
}));

import * as walletRepository from "@/features/wallet/repository";
import * as loyaltyService from "@/features/loyalty/service";
import {
  earnCoins,
  redeemCoins,
  previewRedemption,
  claimDailyBonus,
} from "@/features/wallet/service";

beforeEach(() => {
  vi.mocked(walletRepository.findWalletByUserId).mockReset();
  vi.mocked(walletRepository.applyTransaction).mockClear();
  vi.mocked(walletRepository.findTransactionsSinceBySource).mockReset();
  vi.mocked(loyaltyService.getConfig).mockClear();
});

describe("earnCoins", () => {
  it("does nothing for a zero or negative amount", async () => {
    const result = await earnCoins("user-1", 0, "purchase");

    expect(result).toBeNull();
    expect(walletRepository.applyTransaction).not.toHaveBeenCalled();
  });

  it("records a positive earn transaction, rounded to a whole coin", async () => {
    await earnCoins("user-1", 12.7, "purchase", { orderId: "order-1" });

    expect(walletRepository.applyTransaction).toHaveBeenCalledWith("user-1", {
      type: "earn",
      source: "purchase",
      amount: 13,
      note: undefined,
      orderId: "order-1",
    });
  });
});

describe("redeemCoins", () => {
  it("rejects redemption below the configured minimum", async () => {
    await expect(redeemCoins("user-1", 50)).rejects.toThrow(WalletValidationError);
  });

  it("rejects redemption above the wallet's real balance", async () => {
    vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
      id: "wallet-1",
      userId: "user-1",
      balance: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(redeemCoins("user-1", 500)).rejects.toThrow(WalletValidationError);
  });

  it("applies a negative redeem transaction when the amount is valid", async () => {
    vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
      id: "wallet-1",
      userId: "user-1",
      balance: 500,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await redeemCoins("user-1", 200, "order-1");

    expect(walletRepository.applyTransaction).toHaveBeenCalledWith("user-1", {
      type: "redeem",
      source: "redemption",
      amount: -200,
      orderId: "order-1",
    });
  });
});

describe("previewRedemption", () => {
  it("returns zero when the wallet balance is below the minimum redemption", async () => {
    vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
      id: "wallet-1",
      userId: "user-1",
      balance: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(previewRedemption("user-1", 50, 1000)).resolves.toEqual(
      expect.objectContaining({ coins: 0, discount: 0 })
    );
  });

  it("clamps the requested coins to the wallet balance", async () => {
    vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
      id: "wallet-1",
      userId: "user-1",
      balance: 150,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(previewRedemption("user-1", 999, 1000)).resolves.toEqual(
      expect.objectContaining({ coins: 150, discount: 75 })
    );
  });

  it("clamps the discount so it can never exceed the order subtotal", async () => {
    vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
      id: "wallet-1",
      userId: "user-1",
      balance: 10000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // subtotal 100 at redemptionValue 0.5 -> at most 200 coins are usable
    await expect(previewRedemption("user-1", 5000, 100)).resolves.toEqual(
      expect.objectContaining({ coins: 200, discount: 100 })
    );
  });
});

describe("claimDailyBonus", () => {
  it("awards the daily bonus once when not already claimed today", async () => {
    vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
      id: "wallet-1",
      userId: "user-1",
      balance: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(walletRepository.findTransactionsSinceBySource).mockResolvedValue([]);

    const result = await claimDailyBonus("user-1", null);

    expect(result.dailyAwarded).toBe(5);
    expect(walletRepository.applyTransaction).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ source: "daily_login", amount: 5 })
    );
  });

  it("does not award the daily bonus twice on the same day", async () => {
    vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
      id: "wallet-1",
      userId: "user-1",
      balance: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(walletRepository.findTransactionsSinceBySource).mockResolvedValue([
      { id: "t1", walletId: "wallet-1", type: "earn", source: "daily_login", amount: 5, balanceAfter: 5, note: null, orderId: null, createdAt: new Date() },
    ]);

    const result = await claimDailyBonus("user-1", null);

    expect(result.dailyAwarded).toBe(0);
  });
});
