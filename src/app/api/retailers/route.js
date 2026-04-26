export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchandiserId = searchParams.get("merchandiserId");

    if (!merchandiserId) {
      return NextResponse.json(
        { success: false, error: "merchandiserId is required" },
        { status: 400 }
      );
    }

    // Get all retailers who have scores for any product this merchandiser owns
    const scores = await prisma.retailerScore.findMany({
      where: {
        product: {
          batches: { some: { merchandiserId } }
        }
      },
      include: {
        retailer: {
          select: { id: true, name: true, shopName: true, address: true }
        },
        product: {
          select: { id: true, name: true, category: true }
        }
      }
    });

    // Group by retailer
    const retailerMap = new Map();

    for (const score of scores) {
      const rid = score.retailerId;
      if (!retailerMap.has(rid)) {
        retailerMap.set(rid, {
          retailerId: rid,
          shopName: score.retailer.shopName || score.retailer.name,
          address: score.retailer.address || "—",
          scores: [],
          categories: new Set(),
        });
      }
      const entry = retailerMap.get(rid);
      entry.scores.push(score);
      if (score.product.category) entry.categories.add(score.product.category);
    }

    // For each retailer, aggregate notification + order stats
    const retailerIds = [...retailerMap.keys()];

    const [notifStats, orderStats] = await Promise.all([
      // Notifications sent to each retailer via this merchandiser's batches
      prisma.notificationLog.groupBy({
        by: ["retailerId"],
        where: {
          retailerId: { in: retailerIds },
          inventoryBatch: { merchandiserId }
        },
        _count: { id: true }
      }),
      // Orders placed by each retailer with this merchandiser
      prisma.order.groupBy({
        by: ["retailerId"],
        where: {
          retailerId: { in: retailerIds },
          merchandiserId
        },
        _count: { id: true }
      })
    ]);

    const notifMap = Object.fromEntries(notifStats.map(n => [n.retailerId, n._count.id]));
    const orderMap = Object.fromEntries(orderStats.map(o => [o.retailerId, o._count.id]));

    const retailers = [...retailerMap.values()].map(entry => {
      // Average composite score across all products for this retailer
      const compositeAvg = entry.scores.length > 0
        ? entry.scores.reduce((sum, s) => sum + s.compositeScore, 0) / entry.scores.length
        : 0;

      // Best category = category with highest composite score
      const byCat = {};
      for (const s of entry.scores) {
        const cat = s.product.category || "Other";
        if (!byCat[cat] || s.compositeScore > byCat[cat]) byCat[cat] = s.compositeScore;
      }
      const bestCategory = Object.entries(byCat).sort(([,a],[,b]) => b - a)[0]?.[0] || "—";

      const notifCount = notifMap[entry.retailerId] || 0;
      const orderCount = orderMap[entry.retailerId] || 0;
      const conversionRate = notifCount > 0
        ? parseFloat(((orderCount / notifCount) * 100).toFixed(1))
        : 0;

      // Per-score breakdown (average across all products for each sub-score)
      const avg = (key) => entry.scores.length > 0
        ? parseFloat((entry.scores.reduce((s, r) => s + r[key], 0) / entry.scores.length).toFixed(1))
        : 0;

      return {
        retailerId: entry.retailerId,
        shopName: entry.shopName,
        address: entry.address,
        compositeScore: parseFloat(compositeAvg.toFixed(1)),
        bestCategory,
        categories: [...entry.categories],
        notifCount,
        orderCount,
        conversionRate,
        breakdown: {
          purchaseFrequency: avg("purchaseFrequencyScore"),
          volume:            avg("volumeScore"),
          recency:           avg("recencyScore"),
          sellThrough:       avg("sellThroughScore"),
          reliability:       avg("reliabilityScore"),
        }
      };
    });

    // Sort by compositeScore desc
    retailers.sort((a, b) => b.compositeScore - a.compositeScore);

    return NextResponse.json({ success: true, retailers });
  } catch (error) {
    console.error("Retailers API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
