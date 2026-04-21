const { Client } = require('pg');
const fs = require('fs');

const sql = `
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE IF NOT EXISTS "UserRole" AS ENUM ('MERCHANDISER', 'RETAILER');

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "shopName" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InventoryBatch" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "merchandiserId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "merchandiserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "idempotencyKey" TEXT,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "inventoryBatchId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RetailerStock" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RetailerStock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DailySale" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailySale_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductAnalytics" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "avgDaysToSell" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "sellVelocityPerDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stdDevDays" DOUBLE PRECISION NOT NULL DEFAULT 7,
    "dynamicThresholdDays" INTEGER NOT NULL DEFAULT 24,
    "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductAnalytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RetailerScore" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "purchaseFrequencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volumeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellThroughScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "compositeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RetailerScore_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NotificationLog" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "inventoryBatchId" TEXT NOT NULL,
    "urgencyScore" DOUBLE PRECISION NOT NULL,
    "retailerRank" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),
    "orderedAt" TIMESTAMP(3),
    "outcome" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EngineRunLog" (
    "id" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atRiskCount" INTEGER NOT NULL,
    "notifiedCount" INTEGER NOT NULL,
    "runTimeSeconds" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "EngineRunLog_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
CREATE INDEX IF NOT EXISTS "InventoryBatch_expiryDate_idx" ON "InventoryBatch"("expiryDate");
CREATE INDEX IF NOT EXISTS "InventoryBatch_productId_idx" ON "InventoryBatch"("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Order_retailerId_idx" ON "Order"("retailerId");
CREATE INDEX IF NOT EXISTS "Order_merchandiserId_idx" ON "Order"("merchandiserId");
CREATE UNIQUE INDEX IF NOT EXISTS "RetailerStock_retailerId_productId_key" ON "RetailerStock"("retailerId", "productId");
CREATE INDEX IF NOT EXISTS "DailySale_retailerId_productId_idx" ON "DailySale"("retailerId", "productId");
CREATE INDEX IF NOT EXISTS "DailySale_date_idx" ON "DailySale"("date");
CREATE UNIQUE INDEX IF NOT EXISTS "DailySale_retailerId_productId_date_key" ON "DailySale"("retailerId", "productId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductAnalytics_productId_key" ON "ProductAnalytics"("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "RetailerScore_retailerId_productId_key" ON "RetailerScore"("retailerId", "productId");

-- Foreign Keys
ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_merchandiserId_fkey" FOREIGN KEY ("merchandiserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_merchandiserId_fkey" FOREIGN KEY ("merchandiserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_inventoryBatchId_fkey" FOREIGN KEY ("inventoryBatchId") REFERENCES "InventoryBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RetailerStock" ADD CONSTRAINT "RetailerStock_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RetailerStock" ADD CONSTRAINT "RetailerStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DailySale" ADD CONSTRAINT "DailySale_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DailySale" ADD CONSTRAINT "DailySale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductAnalytics" ADD CONSTRAINT "ProductAnalytics_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RetailerScore" ADD CONSTRAINT "RetailerScore_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RetailerScore" ADD CONSTRAINT "RetailerScore_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_inventoryBatchId_fkey" FOREIGN KEY ("inventoryBatchId") REFERENCES "InventoryBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
`;

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });

    try {
        await client.connect();
        console.log('✅ Connected to Supabase!');

        // Split by semicolon and run each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                await client.query(statement);
                const firstLine = statement.split('\n').find(l => l.trim());
                console.log(`✅ ${firstLine}`);
            } catch (e) {
                // Skip "already exists" errors
                if (e.message.includes('already exists')) {
                    console.log(`⏭️  Already exists, skipping`);
                } else {
                    console.error(`❌ Error: ${e.message}`);
                    console.error(`   Statement: ${statement.substring(0, 80)}...`);
                }
            }
        }

        console.log('\n🎉 Migration complete!');
    } catch (e) {
        console.error('❌ Connection failed:', e.message);
    } finally {
        await client.end();
    }
}

main();