-- CreateIndex
CREATE INDEX "Photo_propertyId_position_idx" ON "Photo"("propertyId", "position");

-- CreateIndex
CREATE INDEX "Property_status_expiresAt_idx" ON "Property"("status", "expiresAt");
