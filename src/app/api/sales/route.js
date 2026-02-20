import {prisma} from "@/lib/db";
import {NextResponse} from "next/server";

export async function POST(req) {
    try {
        const body = await req.json()
        const {retailerId, productId, quantity} = body;

        const stock = await prisma.retailerStock.findUnique({
            where: {
                retailerId_productId: {
                    retailerId,
                    productId,
                }
            }
        })

        if(!stock || stock.quantity < quantity) {
            return NextResponse.json(
                {error: "Not enough stock in shop"},
                {status: 400}
            )
        }

        await prisma.$transaction(async (tx) => {
            await tx.retailerStock.update({
                where: {
                    retailerId_productId: {
                        retailerId,
                        productId,
                    }
                },
                data: {
                    quantity: {decrement: quantity},
                }
            });

            await tx.dailySale.create({
                data: {
                    retailerId,
                    productId,
                    quantity,
                    date: new Date(),
                },
            });
        })

        return NextResponse.json({success: true})
    } catch (error) {
        console.error("Sale recording error:", error);
        return NextResponse.json(
            { error: "Failed to record sale", details: error.message},
            { status: 500 }
        );
    }
}