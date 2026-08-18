import { getServerSession } from "next-auth";
import { ArrowDownCircle, ArrowUpCircle, Coins, Gift, Sparkles } from "lucide-react";
import { authOptions } from "@/features/auth/auth-options";
import * as walletService from "@/features/wallet/service";
import * as loyaltyService from "@/features/loyalty/service";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<string, string> = {
  purchase: "Order purchase",
  review: "Product review",
  referral: "Referral bonus",
  daily_login: "Daily login bonus",
  birthday: "Birthday bonus",
  campaign: "Promotional campaign",
  redemption: "Redeemed at checkout",
  admin: "Adjustment",
};

export default async function WalletPage() {
  const session = await getServerSession(authOptions);

  const [{ balance, transactions }, config] = await Promise.all([
    walletService.getWalletSummary(session!.user.id),
    loyaltyService.getConfig(),
  ]);

  const redeemableValue = Math.floor(balance * config.redemptionValue);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 p-8 text-white shadow-lg">
          <div className="flex items-center gap-2 text-amber-50">
            <Coins className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-wide">NatureCoin Balance</p>
          </div>
          <p className="mt-4 text-5xl font-extrabold">{balance}</p>
          <p className="mt-2 text-sm text-amber-50">
            Worth &#8377;{redeemableValue} toward your next order
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900 dark:text-white">
            <Gift className="h-5 w-5 text-brand-600" /> Ways to Earn
          </h2>

          <ul className="mt-4 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
            <li className="flex justify-between">
              <span>Every purchase</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {config.coinsPerRupee} coin / &#8377;1 spent
              </span>
            </li>
            <li className="flex justify-between">
              <span>Writing a review</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                +{config.reviewBonus} coins
              </span>
            </li>
            <li className="flex justify-between">
              <span>Daily login</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                +{config.dailyLoginBonus} coins
              </span>
            </li>
            <li className="flex justify-between">
              <span>Your birthday</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                +{config.birthdayBonus} coins
              </span>
            </li>
            <li className="flex justify-between">
              <span>Referring a friend</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                +{config.referralReferrerBonus} coins
              </span>
            </li>
          </ul>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-neutral-400">
            <Sparkles className="h-3.5 w-3.5" />
            Redeem {config.minRedemptionCoins}+ coins at checkout for &#8377;{config.redemptionValue}/coin off
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">
          Transaction History
        </h2>

        {transactions.length === 0 ? (
          <div className="py-10 text-center">
            <Coins className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-3 text-neutral-500">
              No NatureCoin activity yet — place an order or write a review to start earning!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-2xl border border-neutral-200/70 p-4 dark:border-neutral-800"
              >
                <div className="flex items-center gap-3">
                  {transaction.amount >= 0 ? (
                    <ArrowUpCircle className="h-5 w-5 text-brand-600" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-500" />
                  )}

                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {SOURCE_LABELS[transaction.source] || transaction.source}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {new Date(transaction.createdAt).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                      {transaction.note ? ` · ${transaction.note}` : ""}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={
                      transaction.amount >= 0
                        ? "font-bold text-brand-600"
                        : "font-bold text-red-500"
                    }
                  >
                    {transaction.amount >= 0 ? "+" : ""}
                    {transaction.amount}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    Balance: {transaction.balanceAfter}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
