import {NextResponse} from "next/server";

export async function GET(req, {params}) {
    try {
        const {id} = await params;

        const notification = await prisma.notifications.findUnique({
            where: { id },
            include: {
                retailer: {
                    select: { id: true, shopName: true, name: true }
                },
                inventoryBatch: {
                    include: {
                        product: true,
                        merchandiser: {
                            select: { id: true, shopName: true, phone: true }
                        }
                    }
                }
            }
        })

        if (!notification) {
            return NextResponse.json(
                { success: false, error: "Notification not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, notification })
    } catch (error){
        console.error("Get notification error:", error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

export async function PATCH(req, {params}) {
    try {
        const {id} = await params;

        const body = await req.json()
        const action = body.action

        if(!["viewed", "ordered", "ignored"].includes(action)) {
            return NextResponse.json(
                { success: false, error: "action must be: viewed, ordered, or ignored" },
                { status: 400 }
            )
        }

        const notification = await prisma.notificationLog.findUnique({
            where: { id },
            include: {
                inventoryBatch: {
                    select: {
                        id:          true,
                        expiryDate:  true,
                        quantity:    true,
                        productId:   true
                    }
                }
            }
        })

        if (!notification) {
            return NextResponse.json(
                { success: false, error: "Notification not found" },
                { status: 404 }
            )
        }

        const outcomeHierarchy = { pending: 0, viewed: 1, ignored: 1, ordered: 2 }
        const currentLevel  = outcomeHierarchy[notification.outcome] ?? 0
        const requestedLevel = outcomeHierarchy[action] ?? 0

        if (requestedLevel <= currentLevel && notification.outcome !== "pending") {
            return NextResponse.json({
                success: true,
                message: `Notification already marked as '${notification.outcome}', no change made`,
                notification
            })
        }

        const updateData = {
            outcome: action
        }

        if (action === "viewed" && !notification.viewedAt) {
            updateData.viewedAt = new Date()
        }

        if (action === "ordered" && !notification.orderedAt) {
            updateData.orderedAt = new Date()
            if (!notification.viewedAt) {
                updateData.viewedAt = new Date()
            }
        }

        const updated = await prisma.notificationLog.update({
            where: { id },
            data:  updateData,
            include: {
                inventoryBatch: {
                    include: { product: true }
                }
            }
        })

        console.log(
            `📊 Notification ${id} updated:`,
            `retailer ${notification.retailerId}`,
            `→ outcome: ${action}`,
            `(was: ${notification.outcome})`
        )

        return NextResponse.json({
            success: true,
            message: `Notification marked as '${action}'`,
            notification: {
                id:          updated.id,
                outcome:     updated.outcome,
                viewedAt:    updated.viewedAt,
                orderedAt:   updated.orderedAt,
                product:     updated.inventoryBatch.product.name,
                urgencyScore: updated.urgencyScore
            }
        })
    } catch (error) {
        console.error("Update notification error:", error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}