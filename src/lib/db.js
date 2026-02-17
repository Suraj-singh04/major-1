import {PrismaClient} from "@/generated/prisma";

const globalForPrisma = {
    prisma: PrismaClient | undefined
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient();

if(process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = prisma;