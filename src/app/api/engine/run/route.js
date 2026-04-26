export const dynamic = 'force-dynamic';
import {computeProductAnalytics} from "@/lib/engine/computeProductAnalytics";
import {computeAtRiskBatches} from "@/lib/engine/computeAtRiskBatches";
import {scoreRetailersForProduct} from "@/lib/engine/scoreRetailer";
import {NextResponse} from "next/server";
import {writeNotifications} from "@/lib/engine/writeNotifications";
import {prisma} from "@/lib/db";

export async function POST() {
    const engineStartTime = new Date();

    try {
        // L2 — Step 1: Refresh product analytics (thresholds)
        await computeProductAnalytics()

        // L2 — Step 2: Find at-risk batches using those thresholds
        const atRiskBatches = await computeAtRiskBatches()

        // If no batches are at risk, return early.
        if (atRiskBatches.length === 0) {
            const runMs = Date.now() - engineStartTime;

            await prisma.engineRunLog.create({
                data: { atRiskCount: 0, notifiedCount: 0, runTimeSeconds: runMs / 1000 }
            });

            return NextResponse.json({
                success:      true,
                atRiskCount:  0,
                message:      "No at-risk batches found. Inventory looks healthy.",
                engineRunMs:  runMs,
                batches:      []
            })
        }

        // L3 — Step 3: Score retailers for each unique at-risk product
        const uniqueProductIds = [...new Set(atRiskBatches.map(b => b.productId))]

        const productScores = {}
        for (let i = 0; i < uniqueProductIds.length; i++) {
            const productId = uniqueProductIds[i]
            const topRetailers = await scoreRetailersForProduct(productId)
            productScores[productId] = topRetailers.slice(0, 5) // top 5 per product
        }

        // L4 — Step 4: Write notifications, Decides which retailers to notify about which batches.
        const { notificationsCreated, notificationsSkipped } =
            await writeNotifications(atRiskBatches, productScores)

        const runMs = Date.now() - engineStartTime;

        // Persist this run to EngineRunLog
        await prisma.engineRunLog.create({
            data: {
                atRiskCount:    atRiskBatches.length,
                notifiedCount:  notificationsCreated,
                runTimeSeconds: runMs / 1000,
            }
        });

        // Combine: attach top retailers to each batch
        const result = atRiskBatches.map(batch => ({
            batchId:       batch.id,
            product:       batch.product.name,
            category:      batch.product.category,
            daysRemaining: batch.daysRemaining,
            urgencyScore:  batch.urgencyScore,
            quantity:      batch.quantity,
            expiryDate:    batch.expiryDate,
            topRetailers:  productScores[batch.productId] ?? []
        }))

        return NextResponse.json({
            success: true,
            atRiskCount: atRiskBatches.length,
            notificationsCreated,
            notificationsSkipped,
            engineRunMs: runMs,
            batches: result
        })

    } catch (error) {
        console.error("Engine error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// GET — return run history for the control panel
export async function GET() {
    try {
        const runs = await prisma.engineRunLog.findMany({
            take: 10,
            orderBy: { ranAt: "desc" }
        });
        return NextResponse.json({ success: true, runs });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}