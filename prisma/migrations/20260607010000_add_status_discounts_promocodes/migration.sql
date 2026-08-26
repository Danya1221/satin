ALTER TABLE "Order"
ADD COLUMN "subtotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "statusDiscount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "promoDiscount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "promoCode" TEXT NOT NULL DEFAULT '',
ADD COLUMN "discountTotal" INTEGER NOT NULL DEFAULT 0;

UPDATE "Order" SET "subtotal" = "total" WHERE "subtotal" = 0;

CREATE TABLE "PromoCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "discountType" TEXT NOT NULL DEFAULT 'percent',
  "discountValue" INTEGER NOT NULL,
  "maxDiscount" INTEGER NOT NULL DEFAULT 0,
  "minOrderTotal" INTEGER NOT NULL DEFAULT 0,
  "minItemPrice" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "usageLimit" INTEGER NOT NULL DEFAULT 0,
  "perCustomerLimit" INTEGER NOT NULL DEFAULT 1,
  "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
  "minCompletedOrders" INTEGER NOT NULL DEFAULT 0,
  "minTotalSpent" INTEGER NOT NULL DEFAULT 0,
  "conditionMode" TEXT NOT NULL DEFAULT 'all',
  "allowedStatuses" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "allowWithStatusDiscount" BOOLEAN NOT NULL DEFAULT true,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromoCodeUsage" (
  "id" TEXT NOT NULL,
  "promoCodeId" TEXT NOT NULL,
  "customerId" TEXT,
  "orderId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "discount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromoCodeUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
CREATE INDEX "PromoCode_active_startsAt_endsAt_idx" ON "PromoCode"("active", "startsAt", "endsAt");
CREATE UNIQUE INDEX "PromoCodeUsage_orderId_key" ON "PromoCodeUsage"("orderId");
CREATE INDEX "PromoCodeUsage_promoCodeId_customerId_idx" ON "PromoCodeUsage"("promoCodeId", "customerId");
CREATE INDEX "PromoCodeUsage_code_createdAt_idx" ON "PromoCodeUsage"("code", "createdAt");

ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
