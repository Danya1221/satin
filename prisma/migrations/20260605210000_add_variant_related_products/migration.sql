ALTER TABLE "ProductVariant" ADD COLUMN "relatedProductIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
