import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";

export async function GET(request) {
    try {
        const {searchParams } = new URL(request.url)
        const retailerId = searchParams.get('retailerId')

        if(!retailerId) {
            return NextResponse.json(
                { success: false, error: "retailerId is required as a query parameter" },
                { status: 400 }
            )
        }

        const retailer = await prisma.user.findUnique({
            where: {id: retailerId},
            select: {id: true, role: true, shopName:true, isActive: true}
        })

        if (!retailer) {
            return NextResponse.json(
                { success: false, error: "Retailer not found" },
                { status: 404 }
            )
        }

        if(retailer.role !== "RETAILER") {
            return NextResponse.json(
                { success: false, error: "Only retailers have a notification inbox" },
                { status: 403 }
            )
        }

        const outcomeFilter = searchParams.get("outcome")

        const page = parseInt(searchParams.get("page") ?? "1")
        const limit = parseInt(searchParams.get("limit") ?? "20")
        const skip = (page - 1) * limit

        const whereClause = {
            retailerId,
            inventoryBatch: {
                expiryDate: {gt: new Date()},
                quantity: {gt: 0}
            },
            ...(outcomeFilter ? {outcome: outcomeFilter} : {}),
        }

        const [total, notifications] = await Promise.all([
            prisma.notificationLog.count({ where : whereClause}),
            prisma.notificationLog.findMany({
                where: {whereClause},
                order: [
                    { urgencyScore: "desc"},
                    { sentAt: "desc"}
                ],
                skip,
                take: limit,
                include: {
                    inventoryBatch: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    brand: true,
                                    category: true,
                                    unit: true,
                                }
                            }
                        }
                    }
                }
            })
        ])

        const formattedNotifications = notifications.map(n => ({
            notificationId: n.id,
            outcome: n.outcome,
            urgencyScore: n.urgencyScore,
            retailerRank: n.retailerRank,
            sentAt: n.sentAt,
            viewedAt: n.viewedAt,
            orderedAt: n.orderedAt,

            batch: {
                batchId:      n.inventoryBatch.id,
                quantity:     n.inventoryBatch.quantity,
                sellingPrice: n.inventoryBatch.sellingPrice,
                expiryDate:   n.inventoryBatch.expiryDate,

                daysRemaining: Math.max(
                    0,
                    Math.ceil(
                        (new Date(n.inventoryBatch.expiryDate) - new Date())/(1000*60*60*24)
                    )
                )
            },
            product: {
                productId: n.inventoryBatch.product.id,
                name:      n.inventoryBatch.product.name,
                brand:     n.inventoryBatch.product.brand,
                category:  n.inventoryBatch.product.category,
                unit:      n.inventoryBatch.product.unit
            }
        }))

        const urgentCount = formattedNotifications.filter(n => n.urgencyScore > 0.7).length
        const pendingCount = formattedNotifications.filter(n => n.outcome === "pending").length

        return NextResponse.json({
            success: true,
            retailer: {
                id:       retailer.id,
                shopName: retailer.shopName
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore:    page * limit < total
            },
            summary: {
                total:        formattedNotifications.length,
                urgentCount,
                pendingCount
            },
            notifications: formattedNotifications
        })

    } catch (error){
        console.error("Notifications fetch error:", error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}