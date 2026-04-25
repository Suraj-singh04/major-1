import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * GET /api/users/me
 * Returns the first MERCHANDISER in the database.
 * Since this app has no auth, this acts as the "logged in" user.
 * This avoids hardcoding user IDs that break after every re-seed.
 */
export async function GET() {
    try {
        const merchandiser = await prisma.user.findFirst({
            where: { role: "MERCHANDISER" },
            select: { id: true, name: true, shopName: true, role: true }
        })

        if (!merchandiser) {
            return NextResponse.json(
                { success: false, error: "No merchandiser found. Run the seed script first." },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, user: merchandiser })
    } catch (error) {
        console.error("GET /api/users/me error:", error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
