-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "offeredPrice" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "EngineRunLog" (
    "id" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atRiskCount" INTEGER NOT NULL,
    "notifiedCount" INTEGER NOT NULL,
    "runTimeSeconds" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "EngineRunLog_pkey" PRIMARY KEY ("id")
);
