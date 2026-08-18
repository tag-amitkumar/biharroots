import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReferralValidationError } from "@/features/referral/errors";

vi.mock("@/features/referral/repository", () => ({
  findUserByReferralCode: vi.fn(),
  setUserReferralCode: vi.fn(),
  createReferral: vi.fn((data) => ({ id: "referral-1", status: "completed", ...data })),
  findReferralsForReferrer: vi.fn(),
  countCompletedReferrals: vi.fn(),
  findAllReferrals: vi.fn(),
  sumRewardsPaid: vi.fn(),
}));

vi.mock("@/features/users/service", () => ({
  getUserById: vi.fn(),
}));

vi.mock("@/features/wallet/service", () => ({
  earnCoins: vi.fn(),
}));

vi.mock("@/features/loyalty/service", () => ({
  getConfig: vi.fn(() => ({ referralReferrerBonus: 150, referralReferredBonus: 100 })),
}));

import * as referralRepository from "@/features/referral/repository";
import * as userService from "@/features/users/service";
import * as walletService from "@/features/wallet/service";
import {
  getOrCreateReferralCode,
  redeemReferralCode,
} from "@/features/referral/service";

beforeEach(() => {
  vi.mocked(referralRepository.findUserByReferralCode).mockReset();
  vi.mocked(referralRepository.setUserReferralCode).mockClear();
  vi.mocked(referralRepository.createReferral).mockClear();
  vi.mocked(userService.getUserById).mockReset();
  vi.mocked(walletService.earnCoins).mockClear();
});

describe("getOrCreateReferralCode", () => {
  it("returns the existing code without generating a new one", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue({
      id: "user-1",
      name: "Jane Doe",
      referralCode: "JANE1234",
    } as never);

    const code = await getOrCreateReferralCode("user-1");

    expect(code).toBe("JANE1234");
    expect(referralRepository.setUserReferralCode).not.toHaveBeenCalled();
  });

  it("generates and persists a new code derived from the user's name when none exists", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue({
      id: "user-1",
      name: "Jane Doe",
      referralCode: null,
    } as never);
    vi.mocked(referralRepository.findUserByReferralCode).mockResolvedValue(null);

    const code = await getOrCreateReferralCode("user-1");

    expect(code).toMatch(/^JANEDO\d{4}$/);
    expect(referralRepository.setUserReferralCode).toHaveBeenCalledWith("user-1", code);
  });

  it("rejects when the user doesn't exist", async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(null);

    await expect(getOrCreateReferralCode("nonexistent")).rejects.toThrow(
      ReferralValidationError
    );
  });
});

describe("redeemReferralCode", () => {
  it("does nothing for a code that doesn't match any user", async () => {
    vi.mocked(referralRepository.findUserByReferralCode).mockResolvedValue(null);

    const result = await redeemReferralCode("BOGUS", "new-user-1");

    expect(result).toBeNull();
    expect(walletService.earnCoins).not.toHaveBeenCalled();
  });

  it("does nothing if the code somehow belongs to the same account", async () => {
    vi.mocked(referralRepository.findUserByReferralCode).mockResolvedValue({
      id: "user-1",
      referralCode: "JANE1234",
    } as never);

    const result = await redeemReferralCode("JANE1234", "user-1");

    expect(result).toBeNull();
    expect(walletService.earnCoins).not.toHaveBeenCalled();
  });

  it("rewards both the referrer and the new customer", async () => {
    vi.mocked(referralRepository.findUserByReferralCode).mockResolvedValue({
      id: "referrer-1",
      referralCode: "JANE1234",
    } as never);

    await redeemReferralCode("jane1234", "new-user-1");

    expect(walletService.earnCoins).toHaveBeenCalledWith(
      "referrer-1",
      150,
      "referral",
      expect.any(Object)
    );
    expect(walletService.earnCoins).toHaveBeenCalledWith(
      "new-user-1",
      100,
      "referral",
      expect.any(Object)
    );
    expect(referralRepository.createReferral).toHaveBeenCalledWith({
      referrerId: "referrer-1",
      referredId: "new-user-1",
      code: "JANE1234",
      referrerReward: 150,
      referredReward: 100,
    });
  });
});
