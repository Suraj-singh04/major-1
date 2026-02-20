/*
  Warnings:

  - You are about to drop the column `userId` on the `DailySale` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "DailySale" DROP CONSTRAINT "DailySale_userId_fkey";

-- AlterTable
ALTER TABLE "DailySale" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
