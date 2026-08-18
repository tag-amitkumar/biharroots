import { getServerSession } from "next-auth";
import { Award, Check, Gift, Sparkles, Truck, X } from "lucide-react";
import { authOptions } from "@/features/auth/auth-options";
import * as membershipService from "@/features/membership/service";
import * as loyaltyService from "@/features/loyalty/service";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function MembershipPage() {
  const session = await getServerSession(authOptions);

  const [membership, allTiers] = await Promise.all([
    membershipService.getMembershipForUser(session!.user.id),
    loyaltyService.listMembershipTiers(),
  ]);

  const { tier, nextTier, lifetimeSpend, amountToNextTier } = membership;
  const sortedTiers = [...allTiers].sort((a, b) => a.sortOrder - b.sortOrder);

  const progressPercent = nextTier
    ? Math.min(
        100,
        Math.round(
          ((lifetimeSpend - (tier?.minSpend ?? 0)) /
            (nextTier.minSpend - (tier?.minSpend ?? 0))) *
            100
        )
      )
    : 100;

  return (
    <div className="space-y-8">
      <div
        className="rounded-3xl p-8 text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${tier?.badgeColor ?? "#16a34a"}, #0f172a)`,
        }}
      >
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          <p className="text-sm font-semibold uppercase tracking-wide">NatureClub Membership</p>
        </div>
        <p className="mt-4 text-4xl font-extrabold">{tier?.name ?? "Green"}</p>
        <p className="mt-2 text-sm text-white/80">
          Lifetime spend: &#8377;{lifetimeSpend}
        </p>

        {nextTier ? (
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs text-white/80">
              <span>{tier?.name}</span>
              <span>{nextTier.name}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/80">
              Spend &#8377;{amountToNextTier} more to reach {nextTier.name}
            </p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-white/80">
            You&apos;ve reached our highest tier — thank you for being a loyal customer!
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {sortedTiers.map((t) => {
          const isCurrent = t.id === tier?.id;

          return (
            <div
              key={t.id}
              className={
                isCurrent
                  ? "rounded-3xl border-2 border-brand-600 bg-white p-6 shadow-lg dark:bg-neutral-900"
                  : "rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              }
            >
              <div className="mb-4 flex items-center justify-between">
                <Badge style={{ backgroundColor: t.badgeColor, color: "white", borderColor: "transparent" }}>
                  {t.name}
                </Badge>
                {isCurrent && <span className="text-xs font-semibold text-brand-600">Current</span>}
              </div>

              <p className="text-sm text-neutral-500">Min. spend</p>
              <p className="mb-4 text-xl font-bold text-neutral-900 dark:text-white">
                &#8377;{t.minSpend}+
              </p>

              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                  {t.coinMultiplier}&times; NatureCoins
                </li>
                <li className="flex items-center gap-2">
                  <Gift className="h-3.5 w-3.5 text-brand-600" />
                  {t.discountPercent}% member discount
                </li>
                <li className="flex items-center gap-2">
                  {t.freeShipping ? (
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-neutral-300" />
                  )}
                  <Truck className="h-3.5 w-3.5" /> Free shipping
                </li>
                <li className="flex items-center gap-2">
                  {t.earlyAccess ? (
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-neutral-300" />
                  )}
                  Early access to offers
                </li>
                <li className="flex items-center gap-2">
                  <Gift className="h-3.5 w-3.5 text-brand-600" />
                  {t.birthdayBonus} coin birthday bonus
                </li>
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
