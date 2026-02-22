import {NextResponse} from "next/server"
import {prisma} from "@/lib/db"

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const merchandiserId = searchParams.get("merchandiserId")

        if (!merchandiserId) {
            return NextResponse.json(
                { success: false, error: "merchandiserId is required" },
                { status: 400 }
            )
        }

        const merchandiser = await prisma.user.findUnique({
            where: { id: merchandiserId },
            select: { id: true, role: true, shopName: true }
        })

        if (!merchandiser || merchandiser.role !== "MERCHANDISER") {
            return NextResponse.json(
                { success: false, error: "Merchandiser not found" },
                { status: 404 }
            )
        }

        const outcomeFilter = searchParams.get("outcome")
        const page  = parseInt(searchParams.get("page")  ?? "1")
        const limit = parseInt(searchParams.get("limit") ?? "20")
        const skip  = (page - 1) * limit

        const whereClause = {
            inventoryBatch: {
                merchandiserId
            },
            ...(outcomeFilter ? { outcome: outcomeFilter } : {})
        }

        const [total, notifications] = await Promise.all([
            prisma.notificationLog.count({ where: whereClause }),
            prisma.notificationLog.findMany({
                where:   whereClause,
                orderBy: { sentAt: "desc" },
                skip,
                take:    limit,
                include: {
                    retailer: {
                        select: { id: true, shopName: true, name: true }
                    },
                    inventoryBatch: {
                        include: {
                            product: {
                                select: { id: true, name: true, category: true }
                            }
                        }
                    }
                }
            })
        ])

        const allNotifications = await prisma.notificationLog.findMany({
            where: { inventoryBatch: { merchandiserId } },
            select: { outcome: true, urgencyScore: true }
        })

        const totalSent    = allNotifications.length
        const totalViewed  = allNotifications.filter(n => n.outcome === "viewed"  || n.outcome === "ordered").length
        const totalOrdered = allNotifications.filter(n => n.outcome === "ordered").length

        const conversionRate = totalSent > 0
            ? parseFloat(((totalOrdered / totalSent) * 100).toFixed(1))
            : 0

        const viewRate = totalSent > 0
            ? parseFloat(((totalViewed / totalSent) * 100).toFixed(1))
            : 0

        return NextResponse.json({
            success: true,
            merchandiser: {
                id:       merchandiser.id,
                shopName: merchandiser.shopName
            },
            stats: {
                totalSent,
                totalViewed,
                totalOrdered,
                conversionRate: `${conversionRate}%`,
                viewRate:       `${viewRate}%`,
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore:    page * limit < total
            },
            notifications: notifications.map(n => ({
                notificationId: n.id,
                outcome:        n.outcome,
                urgencyScore:   n.urgencyScore,
                retailerRank:   n.retailerRank,
                sentAt:         n.sentAt,
                viewedAt:       n.viewedAt,
                orderedAt:      n.orderedAt,
                retailer: {
                    id:       n.retailer.id,
                    shopName: n.retailer.shopName
                },
                batch: {
                    id:          n.inventoryBatch.id,
                    product:     n.inventoryBatch.product.name,
                    category:    n.inventoryBatch.product.category,
                    expiryDate:  n.inventoryBatch.expiryDate,
                    quantity:    n.inventoryBatch.quantity,
                    sellingPrice: n.inventoryBatch.sellingPrice
                }
            }))
        })

    } catch (error) {
        console.error("Notification history error:", error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}