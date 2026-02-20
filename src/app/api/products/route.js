import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";

export async function POST(req) {
    try {
        const body = await req.json()

        const product = await prisma.product.create({
            data: {
                name: body.name,
                brand: body.brand,
                category: body.category,
                unit: body.unit,
            }
        })

        return NextResponse.json(product)
    } catch (error) {
        return NextResponse.json({
            error:"Failed to create a product",
            details:error.message,
        }, {status: 500})
    }
}

export async function GET() {
    const products = await prisma.product.findMany()
    return NextResponse.json(products)
}