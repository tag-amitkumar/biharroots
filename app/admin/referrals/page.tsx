import { Coins, Gift, Trophy, Users } from "lucide-react";
import * as referralService from "@/features/referral/service";

export const dynamic = "force-dynamic";

export default async function AdminReferralsPage() {
  const analytics = await referralService.getReferralAnalytics();

  const stats = [
    { label: "Completed Referrals", value: analytics.completedCount, icon: Users },
    { label: "Coins Paid to Referrers", value: analytics.totalReferrerRewards, icon: Coins },
    { label: "Coins Paid to New Customers", value: analytics.totalReferredRewards, icon: Gift },
  ];

  return (
    <div className="p-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
        Growth
      </p>
      <h1 className="mb-8 mt-2 flex items-center gap-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
        <Gift className="h-8 w-8 text-brand-600" /> Referral Analytics
      </h1>

      <div className="mb-10 grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/20">
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-sm text-neutral-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {analytics.topReferrers.length > 0 && (
        <div className="mb-10 rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900 dark:text-white">
            <Trophy className="h-5 w-5 text-amber-500" /> Top Referrers
          </h2>

          <div className="space-y-2">
            {analytics.topReferrers.map((entry, index) => (
              <div
                key={entry.user?.id ?? index}
                className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3 dark:border-neutral-800"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-900/20">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {entry.user?.name ?? "Deleted user"}
                    </p>
                    {entry.user?.email && (
                      <p className="text-xs text-neutral-400">{entry.user.email}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-neutral-500">
                  {entry.referralCount} referral{entry.referralCount === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50">
            <tr>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Referrer</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Referred</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Rewards</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Date</th>
            </tr>
          </thead>

          <tbody>
            {analytics.referrals.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-neutral-400">
                  No referrals yet.
                </td>
              </tr>
            ) : (
              analytics.referrals.map((referral) => (
                <tr key={referral.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="p-4 text-neutral-900 dark:text-white">
                    {referral.referrer.name}
                    <span className="ml-1 text-xs text-neutral-400">({referral.referrer.email})</span>
                  </td>
                  <td className="p-4 text-neutral-600 dark:text-neutral-300">
                    {referral.referred?.name ?? "—"}
                  </td>
                  <td className="p-4 text-neutral-600 dark:text-neutral-300">
                    +{referral.referrerReward} / +{referral.referredReward}
                  </td>
                  <td className="p-4 text-neutral-500">
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
