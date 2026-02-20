-- CreateIndex
CREATE INDEX "DailySale_retailerId_productId_idx" ON "DailySale"("retailerId", "productId");

-- CreateIndex
CREATE INDEX "DailySale_date_idx" ON "DailySale"("date");

-- CreateIndex
CREATE INDEX "InventoryBatch_expiryDate_idx" ON "InventoryBatch"("expiryDate");

-- CreateIndex
CREATE INDEX "InventoryBatch_productId_idx" ON "InventoryBatch"("productId");

-- CreateIndex
CREATE INDEX "Order_retailerId_idx" ON "Order"("retailerId");

-- CreateIndex
CREATE INDEX "Order_merchandiserId_idx" ON "Order"("merchandiserId");
