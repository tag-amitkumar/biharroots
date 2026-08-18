import * as referralRepository from "@/features/referral/repository";
import * as userService from "@/features/users/service";
import * as walletService from "@/features/wallet/service";
import * as loyaltyService from "@/features/loyalty/service";
import { ReferralValidationError } from "@/features/referral/errors";

function randomSuffix() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function slugifyName(name: string) {
  const alpha = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (alpha || "NATURE").slice(0, 6);
}

// Referral codes are generated lazily on first request, not at signup - most
// users never share theirs, so there's no reason to burn a code (or a DB
// write) for every new account. Collisions are vanishingly unlikely given the
// 4-digit random suffix, but retried defensively since referralCode is unique.
export async function getOrCreateReferralCode(userId: string) {
  const user = await userService.getUserById(userId);

  if (!user) {
    throw new ReferralValidationError("User not found");
  }

  if (user.referralCode) {
    return user.referralCode;
  }

  const base = slugifyName(user.name);

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${base}${randomSuffix()}`;
    const existing = await referralRepository.findUserByReferralCode(candidate);

    if (!existing) {
      await referralRepository.setUserReferralCode(userId, candidate);
      return candidate;
    }
  }

  throw new ReferralValidationError("Could not generate a unique referral code, please try again");
}

// Called once, at signup, with the new user's own id as referredId. Rewards
// both parties immediately - referredId is unique on the Referral model, so
// a given account can only ever be "the referred" once, which is what
// prevents a user from repeatedly redeeming codes to farm rewards.
export async function redeemReferralCode(code: string, newUserId: string) {
  const referrer = await referralRepository.findUserByReferralCode(code.trim().toUpperCase());

  if (!referrer) {
    // An invalid/mistyped code shouldn't block signup - it's just silently
    // not applied, same spirit as an optional field failing gracefully.
    return null;
  }

  if (referrer.id === newUserId) {
    return null;
  }

  const config = await loyaltyService.getConfig();

  const referral = await referralRepository.createReferral({
    referrerId: referrer.id,
    referredId: newUserId,
    code: referrer.referralCode!,
    referrerReward: config.referralReferrerBonus,
    referredReward: config.referralReferredBonus,
  });

  if (config.referralReferrerBonus > 0) {
    await walletService.earnCoins(referrer.id, config.referralReferrerBonus, "referral", {
      note: "Referral bonus - a friend joined using your code",
    });
  }

  if (config.referralReferredBonus > 0) {
    await walletService.earnCoins(newUserId, config.referralReferredBonus, "referral", {
      note: "Welcome bonus - thanks for using a referral code",
    });
  }

  return referral;
}

export function getReferralHistory(userId: string) {
  return referralRepository.findReferralsForReferrer(userId);
}

export async function getReferralAnalytics() {
  const [completedCount, rewardTotals, allReferrals, topReferrerGroups] = await Promise.all([
    referralRepository.countCompletedReferrals(),
    referralRepository.sumRewardsPaid(),
    referralRepository.findAllReferrals(),
    referralRepository.findTopReferrers(),
  ]);

  const topReferrerUsers = await referralRepository.findUsersByIds(
    topReferrerGroups.map((group) => group.referrerId)
  );

  const topReferrers = topReferrerGroups.map((group) => ({
    user: topReferrerUsers.find((user) => user.id === group.referrerId) ?? null,
    referralCount: group._count.referrerId,
  }));

  return {
    completedCount,
    totalReferrerRewards: rewardTotals._sum.referrerReward || 0,
    totalReferredRewards: rewardTotals._sum.referredReward || 0,
    referrals: allReferrals,
    topReferrers,
  };
}
