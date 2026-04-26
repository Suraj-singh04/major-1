import { prisma } from "@/lib/db";

const TOP_N_RETAILERS = 5

const DEDUP_WINDOW_HOURS = 24

function computeOfferedPrice(sellingPrice, purchasePrice, urgencyScore) {
    // Determine discount percentage based on urgency tier
    let discountPct = 0
    if (urgencyScore >= 0.8) discountPct = 0.30  // 30% off — clearance
    else if (urgencyScore >= 0.6) discountPct = 0.10  // 10% off — critical
    else if (urgencyScore >= 0.3) discountPct = 0.05  // 5% off — at risk
    else discountPct = 0.02  //  2% off — early alert

    const discounted = sellingPrice * (1 - discountPct)

    // Never go below purchase price — merchandiser must not lose money
    const floor = purchasePrice ?? sellingPrice * 0.75 // fallback if purchasePrice missing
    const offeredPrice = Math.max(discounted, floor)

    return parseFloat(offeredPrice.toFixed(2))
}

export async function writeNotifications(atRiskBatches, productScores) {
    let notificationsCreated = 0;
    let notificationsSkipped = 0;

    for (const batch of atRiskBatches) {
        const topRetailers = productScores[batch.productId]

        if (!topRetailers || topRetailers.length === 0) {
            console.log(`⚠️  No retailers scored for product ${batch.productId}, skipping batch ${batch.id}`)
            continue
        }

        const offeredPrice = computeOfferedPrice(
            batch.sellingPrice,
            batch.purchasePrice,
            batch.urgencyScore
        )

        const discountPct = Math.round((1 - offeredPrice / batch.sellingPrice) * 100)
        if (discountPct > 0) {
            console.log(
                `💰 ${batch.product?.name ?? batch.productId}: ` +
                `₹${batch.sellingPrice} → ₹${offeredPrice} (${discountPct}% off, urgency ${batch.urgencyScore})`
            )
        }

        const retailersToNotify = topRetailers.slice(0, TOP_N_RETAILERS)

        for (let rank = 0; rank < retailersToNotify.length; rank++) {
            const scored = retailersToNotify[rank]

            //if already notified about this batch then skip, dont notify again
            const dedupWindowStart = new Date()
            dedupWindowStart.setHours(dedupWindowStart.getHours() - DEDUP_WINDOW_HOURS)

            const existingNotification = await prisma.notificationLog.findFirst({
                where: {
                    retailerId: scored.retailerId,
                    inventoryBatchId: batch.id,
                    sentAt: {
                        gte: dedupWindowStart,
                    }
                }
            })

            if (existingNotification) {
                notificationsSkipped++
                continue
            }

            await prisma.notificationLog.create({
                data: {
                    retailerId: scored.retailerId,
                    inventoryBatchId: batch.id,
                    urgencyScore: batch.urgencyScore,
                    retailerRank: rank + 1,
                    offeredPrice,
                    sentAt: new Date(),
                    outcome: "pending"
                }
            })
            notificationsCreated++
        }
    }

    console.log(`📬 Notifications created: ${notificationsCreated}, skipped (dedup): ${notificationsSkipped}`)

    return {
        notificationsCreated,
        notificationsSkipped
    }
}