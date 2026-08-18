import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/service";
import * as analyticsService from "@/features/analytics/service";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [revenueOverTime, orderStatusBreakdown, topProducts, customers, inventory] =
    await Promise.all([
      analyticsService.getRevenueOverTime(),
      analyticsService.getOrderStatusBreakdown(),
      analyticsService.getTopSellingProducts(),
      analyticsService.getCustomerAnalytics(),
      analyticsService.getInventoryInsights(),
    ]);

  return NextResponse.json({
    revenueOverTime,
    orderStatusBreakdown,
    topProducts,
    customers,
    inventory,
  });
}
