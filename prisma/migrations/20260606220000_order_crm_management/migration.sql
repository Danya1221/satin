ALTER TABLE "Order"
ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
ADD COLUMN "managerComment" TEXT NOT NULL DEFAULT '',
ADD COLUMN "assignedToId" TEXT,
ADD COLUMN "assignedToName" TEXT NOT NULL DEFAULT '';

ALTER TABLE "SupportRequest"
ADD COLUMN "orderId" TEXT;

CREATE TABLE "OrderChange" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "adminId" TEXT,
  "adminName" TEXT NOT NULL DEFAULT 'Менеджер',
  "action" TEXT NOT NULL,
  "details" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderChange_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_assignedToId_status_idx" ON "Order"("assignedToId", "status");
CREATE INDEX "OrderChange_orderId_createdAt_idx" ON "OrderChange"("orderId", "createdAt");
CREATE INDEX "SupportRequest_orderId_idx" ON "SupportRequest"("orderId");

ALTER TABLE "Order"
ADD CONSTRAINT "Order_assignedToId_fkey"
FOREIGN KEY ("assignedToId") REFERENCES "AdminUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderChange"
ADD CONSTRAINT "OrderChange_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportRequest"
ADD CONSTRAINT "SupportRequest_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
