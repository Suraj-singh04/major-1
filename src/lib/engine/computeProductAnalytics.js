import {prisma} from "@/lib/db";

export async function computeProductAnalytics() {
    const products = await prisma.product.findMany({
        where: {
            batches: {some: {}}
        }
    });

    for(const product of products) {
        const orderItems = await prisma.orderItem.findMany({
            where: {
                inventoryBatch: {
                    productId: product.id,
                }
            },
            include: {
                order: true,
                inventoryBatch: true,
            },
            orderBy: {
                order: { createdAt: 'desc' },
            }
        })

        if(orderItems.length === 0) {
            await prisma.productAnalytics.upsert({
                where: { productId: product.id },
                update: { lastUpdatedAt: new Date() },
                create: {
                    productId: product.id,
                    avgDaysToSell: 30,
                    sellVelocityPerDay: 0,
                    stdDevDays: 10,
                    dynamicThresholdDays: 14,
                }
            })
            continue
        }

        const totalUnitsSold = orderItems.reduce((sum , item) => sum + item.quantity, 0);

        const firstOrderDate = orderItems[orderItems.length - 1].order.createdAt
        const today = new Date();
        const daysCovered = Math.max(
            1,
            (today - firstOrderDate) / (1000 * 60 * 60 * 24)
        )

        const sellVelocityPerDay = totalUnitsSold / daysCovered

        const orderDates = [...new Set(
            orderItems.map(item => item.order.createdAt.toDateString())
        )].map(d => new Date(d)).sort((a,b) => a-b);

        let avgDaysToSell = 30;
        let stdDevDays = 7;

        if(orderItems.length > 1) {
            const gaps = [];
            for (let i = 1; i < orderDates.length; i++) {
                const gap = (orderDates[i] - orderDates[i - 1]) / (1000 * 60 * 60 * 24)
                gaps.push(gap)
            }
            avgDaysToSell = gaps.reduce((a, b) => a + b, 0) / gaps.length

            const mean = avgDaysToSell
            const variance = gaps.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / gaps.length
            stdDevDays = Math.sqrt(variance)
        }

        const dynamicThresholdDays = Math.ceil(avgDaysToSell + 1.5 * stdDevDays)

        await prisma.productAnalytics.upsert({
            where: { productId: product.id },
            update: {
                avgDaysToSell,
                sellVelocityPerDay,
                stdDevDays,
                dynamicThresholdDays,
                lastComputedAt: new Date()
            },
            create: {
                productId: product.id,
                avgDaysToSell,
                sellVelocityPerDay,
                stdDevDays,
                dynamicThresholdDays
            }
        })
    }

    console.log(`✅ ProductAnalytics computed for ${products.length} products`)
}
