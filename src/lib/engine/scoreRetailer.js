import {prisma} from "@/lib/db";

async function getPurchaseFrequencyScores(productId, retailerIds) {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { category: true }
    })

    if (!product) {
        const scores = {}
        for (const id of retailerIds) scores[id] = 0
        return scores
    }

    const since = new Date()
    since.setDate(since.getDate() - 180)

    const scores = {}
    for (const retailerId of retailerIds) {
        const orders = await prisma.order.count({
            where: {
                retailerId,
                createdAt: { gte: since },
                items: {
                    some: {
                        inventoryBatch: {
                            product: { category: product.category }
                        }
                    }
                }
            }
        })
        scores[retailerId] = orders
    }

    return normalizeScores(scores)
}

function normalizeScores(rawScores) {
    const values = Object.values(rawScores)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min

    const normalized = {}
    for (const [retailerId, value] of Object.entries(rawScores)) {
        normalized[retailerId] = range === 0 ? 0.5 : (value - min) / range
    }
    return normalized
}

async function getVolumeScores(productId, retailerIds) {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { category: true }
    })

    if (!product) {
        const scores = {}
        for (const id of retailerIds) scores[id] = 0
        return scores
    }

    const since = new Date()
    since.setDate(since.getDate() - 180)

    const scores = {}
    for (const retailerId of retailerIds) {
        const items = await prisma.orderItem.findMany({
            where: {
                order: {
                    retailerId,
                    createdAt: { gte: since }
                },
                inventoryBatch: {
                    product: { category: product.category }
                }
            },
            select: { quantity: true }
        })

        const avg = items.length > 0
            ? items.reduce((sum, i) => sum + i.quantity, 0) / items.length
            : 0

        scores[retailerId] = avg
    }

    return normalizeScores(scores)
}

async function getRecencyScores(productId, retailerIds) {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { category: true }
    })

    if (!product) {
        const scores = {}
        for (const id of retailerIds) scores[id] = 0
        return scores
    }

    const scores = {}
    for (const retailerId of retailerIds) {
        const lastOrder = await prisma.order.findFirst({
            where: {
                retailerId,
                items: {
                    some: {
                        inventoryBatch: {
                            product: { category: product.category }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        })

        if (!lastOrder) {
            scores[retailerId] = 0
            continue
        }

        const daysSince = (Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        scores[retailerId] = parseFloat(Math.exp(-0.05 * daysSince).toFixed(4))
    }

    return scores
}

async function getSellThroughScores(productId, retailerIds) {
    const since = new Date()
    since.setDate(since.getDate() - 60)

    const scores = {}
    for (const retailerId of retailerIds) {
        const sales = await prisma.dailySale.aggregate({
            where: {
                retailerId,
                productId,
                date: { gte: since }
            },
            _sum: { quantity: true }
        })

        const stock = await prisma.retailerStock.findUnique({
            where: {
                retailerId_productId: { retailerId, productId }
            }
        })

        const unitsSold = sales._sum.quantity ?? 0
        const currentStock = stock?.quantity ?? 0

        const total = unitsSold + currentStock
        scores[retailerId] = total > 0 ? unitsSold / total : 0
    }

    return normalizeScores(scores)
}

async function getReliabilityScores(retailerIds) {
    const scores = {}
    for (const retailerId of retailerIds) {
        const totalOrders = await prisma.order.count({
            where: { retailerId }
        })

        const completedOrders = await prisma.order.count({
            where: { retailerId, status: 'COMPLETED' }
        })

        scores[retailerId] = totalOrders > 0
            ? completedOrders / totalOrders
            : 0.5
    }

    return normalizeScores(scores)
}

export async function scoreRetailersForProduct(productId) {
    const retailers = await prisma.user.findMany({
        where: { role: 'RETAILER', isActive: true },
        select: { id: true, name: true, shopName: true }
    })

    const retailerIds = retailers.map(r => r.id)

    if (retailerIds.length === 0) return []

    const [
        freqScores,
        volScores,
        recencyScores,
        sellThroughScores,
        reliabilityScores
    ] = await Promise.all([
        getPurchaseFrequencyScores(productId, retailerIds),
        getVolumeScores(productId, retailerIds),
        getRecencyScores(productId, retailerIds),
        getSellThroughScores(productId, retailerIds),
        getReliabilityScores(retailerIds),
    ])

    // Default weights — will be tuned by L5 later
    const weights = {
        frequency:   0.20,
        volume:      0.20,
        recency:     0.15,
        sellThrough: 0.25,
        reliability: 0.20,
    }

    const scoredRetailers = retailers.map(retailer => {
        const id = retailer.id
        const composite = parseFloat((
            weights.frequency   * (freqScores[id]       ?? 0) +
            weights.volume      * (volScores[id]         ?? 0) +
            weights.recency     * (recencyScores[id]     ?? 0) +
            weights.sellThrough * (sellThroughScores[id] ?? 0) +
            weights.reliability * (reliabilityScores[id] ?? 0)
        ).toFixed(4))

        return {
            retailerId: id,
            retailerName: retailer.name,
            shopName: retailer.shopName,
            scores: {
                frequency:   parseFloat((freqScores[id]       ?? 0).toFixed(4)),
                volume:      parseFloat((volScores[id]         ?? 0).toFixed(4)),
                recency:     parseFloat((recencyScores[id]     ?? 0).toFixed(4)),
                sellThrough: parseFloat((sellThroughScores[id] ?? 0).toFixed(4)),
                reliability: parseFloat((reliabilityScores[id] ?? 0).toFixed(4)),
            },
            compositeScore: composite
        }
    })

    scoredRetailers.sort((a, b) => b.compositeScore - a.compositeScore)

    // Save scores to DB for L5 later
    for (const scored of scoredRetailers) {
        await prisma.retailerScore.upsert({
            where: {
                retailerId_productId: {
                    retailerId: scored.retailerId,
                    productId
                }
            },
            update: {
                purchaseFrequencyScore: scored.scores.frequency,
                volumeScore:            scored.scores.volume,
                recencyScore:           scored.scores.recency,
                sellThroughScore:       scored.scores.sellThrough,
                reliabilityScore:       scored.scores.reliability,
                compositeScore:         scored.compositeScore,
                lastUpdated:            new Date()
            },
            create: {
                retailerId:             scored.retailerId,
                productId,
                purchaseFrequencyScore: scored.scores.frequency,
                volumeScore:            scored.scores.volume,
                recencyScore:           scored.scores.recency,
                sellThroughScore:       scored.scores.sellThrough,
                reliabilityScore:       scored.scores.reliability,
                compositeScore:         scored.compositeScore,
            }
        })
    }

    return scoredRetailers
}