import {computeProductAnalytics} from "@/lib/engine/computeProductAnalytics";
import {computeAtRiskBatches} from "@/lib/engine/computeAtRiskBatches";
import {scoreRetailersForProduct} from "@/lib/engine/scoreRetailer";
import {NextResponse} from "next/server";

export async function POST() {
    try {
        // L2 — Step 1: Refresh product analytics (thresholds)
        await computeProductAnalytics()

        // L2 — Step 2: Find at-risk batches using those thresholds
        const atRiskBatches = await computeAtRiskBatches()

        // L3 — Step 3: Score retailers for each unique at-risk product
        const uniqueProductIds = [...new Set(atRiskBatches.map(b => b.productId))]

        const productScores = {}
        for (let i = 0; i < uniqueProductIds.length; i++) {
            const productId = uniqueProductIds[i]
            const topRetailers = await scoreRetailersForProduct(productId)
            productScores[productId] = topRetailers.slice(0, 5) // top 5 per product
        }

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
            batches: result
        })

    } catch (error) {
        console.error("Engine error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}