import { NextResponse} from "next/server";
import {prisma} from "@/lib/db";

export async function POST(req) {
    try {
        const body = await req.json();

        const user = await prisma.user.create({
            data: {
                name: body.name,
                phone: body.phone,
                role: body.role,
                shopName: body.shopName,
                address: body.address,
            },
        });
        return NextResponse.json(user, {status: 201});
    } catch (error) {
        return NextResponse.json(
            {error: "Failed to create user", details: error.message},
            {status: 500}
        )
    }
}

export async function GET() {
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
}