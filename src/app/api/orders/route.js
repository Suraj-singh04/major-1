import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {createOrderSchema} from "@/lib/validator/order.validator";

export async function POST(req) {
    try {
        const body = await req.json();

        const existing = await prisma.order.findUnique({
            where: { idempotencyKey },
        });

        if (existing) {
            return NextResponse.json(existing);
        }

        const parsed = createOrderSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { retailerId, merchandiserId, items } = parsed.data;

        const retailer = await prisma.user.findUnique({
            where: { id: retailerId },
        });

        const merchandiser = await prisma.user.findUnique({
            where: { id: merchandiserId },
        });

        if (!retailer || retailer.role !== "RETAILER") {
            return NextResponse.json({ error: "Invalid retailer" }, { status: 400 });
        }

        if (!merchandiser || merchandiser.role !== "MERCHANDISER") {
            return NextResponse.json({ error: "Invalid merchandiser" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {

            const order = await tx.order.create({
                data: {
                    retailerId,
                    merchandiserId,
                },
            });

            for (const item of items) {
                if (item.quantity <= 0) {
                    throw new Error("Quantity must be greater than zero");
                }

                const batch = await tx.inventoryBatch.findUnique({
                    where: { id: item.inventoryBatchId },
                });

                if (new Date(batch.expiryDate) <= new Date()) {
                    throw new Error("Cannot sell expired product");
                }

                if (!batch || batch.quantity < item.quantity) {
                    throw new Error("Insufficient stock");
                }

                const updated = await tx.inventoryBatch.updateMany({
                    where: {
                        id: item.inventoryBatchId,
                        quantity: { gte: item.quantity },
                    },
                    data: {
                        quantity: { decrement: item.quantity },
                    },
                });

                if (updated.count === 0) {
                    throw new Error("Stock already sold to another retailer");
                }

                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        inventoryBatchId: item.inventoryBatchId,
                        quantity: item.quantity,
                        price: batch.sellingPrice,
                    },
                });

                await tx.retailerStock.upsert({
                    where: {
                        retailerId_productId: {
                            retailerId: retailerId,
                            productId: batch.productId,
                        },
                    },
                    update: {
                        quantity: { increment: item.quantity },
                    },
                    create: {
                        retailerId: retailerId,
                        productId: batch.productId,
                        quantity: item.quantity,
                    },
                });
            }

            return order;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Order creation error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Order failed" },
            { status: 400 }
        );
    }
}