ALTER TABLE "ProductReview" ADD COLUMN "readAt" TIMESTAMP(3), ADD COLUMN "answer" TEXT NOT NULL DEFAULT '', ADD COLUMN "answeredAt" TIMESTAMP(3);
ALTER TABLE "ProductQuestion" ADD COLUMN "readAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "deliveryCarrier" TEXT NOT NULL DEFAULT 'courier', ADD COLUMN "deliveryZone" TEXT NOT NULL DEFAULT '', ADD COLUMN "deliveryFee" INTEGER, ADD COLUMN "checkoutKey" TEXT;
UPDATE "Order" SET "deliveryCarrier" = 'pickup', "deliveryFee" = 0 WHERE "deliveryType" = 'pickup';
CREATE UNIQUE INDEX "Order_checkoutKey_key" ON "Order"("checkoutKey");
