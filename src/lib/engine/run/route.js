import {computeProductAnalytics} from "@/lib/engine/computeProductAnalytics";
import {computeAtRiskBatches} from "@/lib/engine/computeAtRiskBatches";
import {NextResponse} from "next/server";

export async function POST() {
    try {
        await computeProductAnalytics();

        const atRiskBatches = await computeAtRiskBatches();

        return NextResponse.json({
            success: true,
            atRiskCount: atRiskBatches.length,
            batches: atRiskBatches.map(b => ({
                batchId: b.id,
                product: b.product.name,
                expiryDate: b.expiryDate,
                daysRemaining: b.daysRemaining,
                urgencyScore: b.urgencyScore,
                quantity: b.quantity,
            }))
        })
    } catch (error) {
        console.error("Engine error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}