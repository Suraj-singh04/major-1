import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

let prisma;

if (process.env.NODE_ENV === 'production') {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
  prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })
} else {
  const { Pool } = require('pg')
  const { PrismaPg } = require('@prisma/adapter-pg')
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })
}

export { prisma }

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma