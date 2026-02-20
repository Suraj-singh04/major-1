import {prisma} from "@/lib/db";
import {NextResponse} from "next/server";

export async function POST(req) {
    try{
        const body = await req.json()

        const batch = await prisma.inventoryBatch.create({
            data: {
                productId: body.productId,
                merchandiserId: body.merchandiserId,
                quantity: body.quantity,
                purchasePrice: body.purchasePrice,
                sellingPrice: body.sellingPrice,
                expiryDate: new Date(body.expiryDate),
            }
        })
        return NextResponse.json(batch, {status: 200})
    } catch(error){
        return NextResponse.json({error:"Failed to add inventory"}, {status: 500});
    }
}