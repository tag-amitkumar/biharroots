import * as loyaltyRepository from "@/features/loyalty/repository";
import { LoyaltyValidationError } from "@/features/loyalty/errors";

export function getConfig() {
  return loyaltyRepository.getConfig();
}

type UpdateConfigInput = {
  coinsPerRupee?: number;
  redemptionValue?: number;
  minRedemptionCoins?: number;
  reviewBonus?: number;
  dailyLoginBonus?: number;
  birthdayBonus?: number;
  referralReferrerBonus?: number;
  referralReferredBonus?: number;
  coinExpiryDays?: number | null;
};

export function updateConfig(input: UpdateConfigInput) {
  for (const [key, value] of Object.entries(input)) {
    if (key === "coinExpiryDays") continue;

    if (typeof value === "number" && value < 0) {
      throw new LoyaltyValidationError(`${key} cannot be negative`);
    }
  }

  return loyaltyRepository.updateConfig(input);
}

export function listMembershipTiers() {
  return loyaltyRepository.findMembershipTiers();
}

type UpdateTierInput = {
  minSpend?: number;
  coinMultiplier?: number;
  discountPercent?: number;
  freeShipping?: boolean;
  earlyAccess?: boolean;
  birthdayBonus?: number;
  badgeColor?: string;
};

export function updateMembershipTier(id: string, input: UpdateTierInput) {
  if (input.minSpend !== undefined && input.minSpend < 0) {
    throw new LoyaltyValidationError("minSpend cannot be negative");
  }

  if (input.coinMultiplier !== undefined && input.coinMultiplier <= 0) {
    throw new LoyaltyValidationError("coinMultiplier must be positive");
  }

  if (
    input.discountPercent !== undefined &&
    (input.discountPercent < 0 || input.discountPercent > 100)
  ) {
    throw new LoyaltyValidationError("discountPercent must be between 0 and 100");
  }

  return loyaltyRepository.updateMembershipTier(id, input);
}
