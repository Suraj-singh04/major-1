import { prisma } from "@/lib/db";

const CATEGORY_MIN_LEAD_DAYS = {
    'Dairy': 7,   // milk/curd — short shelf, but retailers need at least a week
    'Beverages': 14,  // juice/drinks — 2 weeks minimum
    'Instant Food': 30, // Maggi etc — need a month minimum
    'Snacks': 21,  // chips/namkeen — 3 weeks
    'Biscuits': 25,  // biscuits — 3.5 weeks
    'Personal Care': 35, // soap/toothpaste — 5 weeks
    'Staples': 40,  // atta/oil/salt — nearly 6 weeks
}

const DEFAULT_MIN_LEAD_DAYS = 14;

export async function computeProductAnalytics() {
    const products = await prisma.product.findMany({
        where: { batches: { some: {} } },
        select: { id: true, name: true, category: true }
    })

    for (const product of products) {
        const orderItems = await prisma.orderItem.findMany({
            where: {
                inventoryBatch: {
                    productId: product.id
                }
            },
            include: {
                order: { select: { createdAt: true } },
                inventoryBatch: { select: { id: true } }
            },
            orderBy: {
                order: { createdAt: 'desc' }
            }
        })

        if (orderItems.length === 0) {

            const categoryMin = CATEGORY_MIN_LEAD_DAYS[product.category] ?? DEFAULT_MIN_LEAD_DAYS

            await prisma.productAnalytics.upsert({
                where: { productId: product.id },
                update: { lastComputedAt: new Date() },  // ← fixed: was lastUpdatedAt
                create: {
                    productId: product.id,
                    avgDaysToSell: categoryMin,
                    sellVelocityPerDay: 0,
                    stdDevDays: categoryMin * 0.3,
                    dynamicThresholdDays: categoryMin,
                }
            })
            continue
        }

        const totalUnitsSold = orderItems.reduce((sum, item) => sum + item.quantity, 0)

        const firstOrderDate = orderItems[orderItems.length - 1].order.createdAt
        const today = new Date()
        const daysCovered = Math.max(
            1,
            (today - firstOrderDate) / (1000 * 60 * 60 * 24)
        )

        const sellVelocityPerDay = totalUnitsSold / daysCovered

        const orderDates = [...new Set(
            orderItems.map(item => item.order.createdAt.toDateString())
        )].map(d => new Date(d)).sort((a, b) => a - b)

        let avgDaysToSell = CATEGORY_MIN_LEAD_DAYS[product.category] ?? DEFAULT_MIN_LEAD_DAYS

        let stdDevDays = avgDaysToSell * 0.3

        if (orderDates.length > 1) {
            const gaps = []
            for (let i = 1; i < orderDates.length; i++) {
                const gap = (orderDates[i] - orderDates[i - 1]) / (1000 * 60 * 60 * 24)
                if (gap > 0) gaps.push(gap) // ignore same-day orders
            }
            if (gaps.length > 0) {
                avgDaysToSell = gaps.reduce((a, b) => a + b, 0) / gaps.length

                const mean = avgDaysToSell
                const variance = gaps.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / gaps.length
                stdDevDays = Math.sqrt(variance)
            }
        }
        const categoryMinimum = CATEGORY_MIN_LEAD_DAYS[product.category] ?? DEFAULT_MIN_LEAD_DAYS
        const computed = Math.ceil(avgDaysToSell + 1.5 * stdDevDays)
        const dynamicThresholdDays = Math.max(computed, categoryMinimum)

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