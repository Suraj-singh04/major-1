export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const batches = await prisma.inventoryBatch.findMany({
      include: {
        product: {
          include: {
            retailerScores: {
              orderBy: { compositeScore: 'desc' },
              take: 3, // Get top 3 retailers for this product
              include: { retailer: true }
            }
          }
        }
      },
      orderBy: { expiryDate: 'asc' } // Expiring soonest first
    });

    const formattedBatches = batches.map(batch => {
      // Calculate days difference
      const now = new Date();
      const diffTime = batch.expiryDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const daysLeft = diffDays;
      let status = "safe";

      if (daysLeft <= 0) status = "expired";
      else if (daysLeft <= 5) status = "critical";
      else if (daysLeft <= 14) status = "warning";

      // Calculate a mock urgency score between 0.0 and 1.0
      let urgency = 0;
      if (daysLeft <= 0) urgency = 1.0;
      else if (daysLeft < 30) urgency = 1 - (daysLeft / 30);

      // Ensure positive values just for UI presentation consistency
      const displayDays = Math.abs(daysLeft);

      return {
        id: batch.id,
        name: batch.product.name,
        category: batch.product.category || "Uncategorized", // Fallback if missing
        qty: batch.quantity,
        days: daysLeft,
        displayDays: displayDays,
        price: batch.sellingPrice,
        urgency: urgency,
        status: status,
        retailers: batch.product.retailerScores.map(rs => ({
          name: rs.retailer.name || rs.retailer.shopName || "Unknown Retailer",
          score: Math.round(rs.compositeScore * 100) // compositeScore is 0-1 float in DB
        }))
      };
    });

    return NextResponse.json(formattedBatches);
  } catch (error) {
    console.error("Error fetching inventory batches:", error);
    return NextResponse.json({ error: "Failed to fetch inventory batches" }, { status: 500 });
  }
}
