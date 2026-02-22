import {prisma} from "@/lib/db";

const TOP_N_RETAILERS = 5

const DEDUP_WINDOW_HOURS = 24

export async function writeNotifications(atRiskBatches, productScores) {
    let notificationsCreated = 0;
    let notificationsSkipped = 0;

    for(const batch of atRiskBatches) {
        const topRetailers = productScores[batch.productId]

        if(!topRetailers && topRetailers.length ===0 ) {
            console.log(`⚠️  No retailers scored for product ${batch.productId}, skipping batch ${batch.id}`)
            continue
        }

        const retailersToNotify = topRetailers.slice(0, TOP_N_RETAILERS)

        for(let rank = 0; rank < retailersToNotify.length; rank++) {
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

            if(existingNotification) {
                notificationsSkipped++
                continue
            }

            await prisma.notificationLog.create({
                data: {
                    retailerId: scored.retailerId,
                    inventoryBatchId: batch.id,
                    urgencyScore: batch.urgencyScore,
                    retailerRank: rank+1,
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