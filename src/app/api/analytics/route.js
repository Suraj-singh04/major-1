export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchandiserId = searchParams.get("merchandiserId");
    const days = parseInt(searchParams.get("days") ?? "30");

    if (!merchandiserId) {
      return NextResponse.json({ success: false, error: "merchandiserId is required" }, { status: 400 });
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    // 1. All notifications for this merchandiser in the period
    const notifications = await prisma.notificationLog.findMany({
      where: {
        sentAt: { gte: since },
        inventoryBatch: { merchandiserId },
      },
      include: {
        inventoryBatch: { include: { product: { select: { name: true, category: true } } } },
        retailer: { select: { id: true, shopName: true, name: true } },
      },
      orderBy: { sentAt: "asc" },
    });

    // 2. NOTIFICATIONS OVER TIME — group by date (sent vs ordered)
    const byDateMap = {};
    for (const n of notifications) {
      const dateKey = n.sentAt.toISOString().slice(0, 10);
      if (!byDateMap[dateKey]) byDateMap[dateKey] = { date: dateKey, sent: 0, ordered: 0, viewed: 0 };
      byDateMap[dateKey].sent++;
      if (n.outcome === "ordered") byDateMap[dateKey].ordered++;
      if (n.outcome === "viewed" || n.outcome === "ordered") byDateMap[dateKey].viewed++;
    }
    const notificationsOverTime = Object.values(byDateMap).sort((a, b) => a.date.localeCompare(b.date));

    // 3. CONVERSION BY CATEGORY
    const byCategoryMap = {};
    for (const n of notifications) {
      const cat = n.inventoryBatch.product.category || "Other";
      if (!byCategoryMap[cat]) byCategoryMap[cat] = { category: cat, sent: 0, ordered: 0 };
      byCategoryMap[cat].sent++;
      if (n.outcome === "ordered") byCategoryMap[cat].ordered++;
    }
    const conversionByCategory = Object.values(byCategoryMap)
      .map((c) => ({
        ...c,
        conversionRate: c.sent > 0 ? parseFloat(((c.ordered / c.sent) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate);

    // 4. TOP PRODUCTS BY AT-RISK FREQUENCY
    const byProductMap = {};
    for (const n of notifications) {
      const name = n.inventoryBatch.product.name;
      const cat = n.inventoryBatch.product.category || "Other";
      if (!byProductMap[name]) byProductMap[name] = { product: name, category: cat, count: 0, ordered: 0 };
      byProductMap[name].count++;
      if (n.outcome === "ordered") byProductMap[name].ordered++;
    }
    const topProductsByRisk = Object.values(byProductMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 5. RETAILER RANKINGS — compositeScore + recent orders
    const topScores = await prisma.retailerScore.groupBy({
      by: ["retailerId"],
      _avg: { compositeScore: true },
      orderBy: { _avg: { compositeScore: "desc" } },
      take: 8,
      where: { product: { batches: { some: { merchandiserId } } } },
    });

    const retailerRankings = await Promise.all(
      topScores.map(async (r) => {
        const user = await prisma.user.findUnique({ where: { id: r.retailerId }, select: { shopName: true, name: true } });
        const orders = await prisma.order.count({ where: { retailerId: r.retailerId, merchandiserId, createdAt: { gte: since } } });
        const notifs = notifications.filter((n) => n.retailer.id === r.retailerId).length;
        const ordered = notifications.filter((n) => n.retailer.id === r.retailerId && n.outcome === "ordered").length;
        return {
          name: user?.shopName || user?.name || "Unknown",
          compositeScore: parseFloat((r._avg.compositeScore ?? 0).toFixed(1)),
          orders,
          notifs,
          conversionRate: notifs > 0 ? parseFloat(((ordered / notifs) * 100).toFixed(1)) : 0,
        };
      })
    );

    // 6. INSIGHT CARDS
    const insights = [];

    // Most at-risk category
    const categoryRisk = {};
    for (const n of notifications) {
      const cat = n.inventoryBatch.product.category || "Other";
      categoryRisk[cat] = (categoryRisk[cat] || 0) + 1;
    }
    const topCat = Object.entries(categoryRisk).sort(([, a], [, b]) => b - a)[0];
    if (topCat && Object.keys(categoryRisk).length > 1) {
      const total = notifications.length;
      const pct = total > 0 ? Math.round((topCat[1] / total) * 100) : 0;
      insights.push({
        icon: "📦",
        text: `${topCat[0]} products account for ${pct}% of all at-risk notifications this period — more than any other category.`,
      });
    }

    // Best converting retailer
    const bestRetailer = retailerRankings.sort((a, b) => b.conversionRate - a.conversionRate)[0];
    if (bestRetailer && bestRetailer.conversionRate > 0) {
      insights.push({
        icon: "🏆",
        text: `${bestRetailer.name} has the highest conversion rate at ${bestRetailer.conversionRate}%. Prioritising them in engine runs is paying off.`,
      });
    }

    // Dedup rate
    const totalSent = notifications.length;
    const totalOrdered = notifications.filter((n) => n.outcome === "ordered").length;
    if (totalSent > 0) {
      const convRate = ((totalOrdered / totalSent) * 100).toFixed(1);
      insights.push({
        icon: "📬",
        text: `Overall conversion rate this period: ${convRate}% (${totalOrdered} orders from ${totalSent} alerts sent).`,
      });
    }

    return NextResponse.json({
      success: true,
      period: days,
      notificationsOverTime,
      conversionByCategory,
      topProductsByRisk,
      retailerRankings: retailerRankings.sort((a, b) => b.compositeScore - a.compositeScore),
      insights,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
