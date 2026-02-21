import {prisma} from "@/lib/db";

export async function computeAtRiskBatches() {
    const allAnalytics = await prisma.productAnalytics.findMany();

    const thresholdMap = {}
    for (const analytics of allAnalytics) {
        thresholdMap[analytics.productId] = analytics.dynamicThresholdDays
    }

    const today = new Date();

    const batches = await prisma.inventoryBatch.findMany({
        where: {
            expiryDate: {gt: today},
            quantity: {gt: 0},
        },
        include: {
            product: true
        }
    })

    const atRiskBatches = [];

    for (const batch of batches) {
        const thresholdDays = thresholdMap[batch.productId];

        const daysRemaining = Math.ceil(
            (batch.expiryDate - today) / (1000* 60* 60* 24)
        )

        if(daysRemaining <= thresholdDays) {
            const urgencyScore = parseFloat(
                (1- daysRemaining/ thresholdDays).toFixed(4)
            )

            atRiskBatches.push({
                    ...batch,
                    daysRemaining,
                    urgencyScore,
                    thresholdDays,
            })
        }
    }

    atRiskBatches.sort((a, b) => b.urgencyScore - a.urgencyScore)

    console.log(`⚠️  Found ${atRiskBatches.length} at-risk batches`)
    return atRiskBatches;

}