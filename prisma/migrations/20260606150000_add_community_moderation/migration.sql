ALTER TABLE "ProductReview"
ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "ProductQuestion"
ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "ProductReview_isVisible_createdAt_idx"
ON "ProductReview"("isVisible", "createdAt");

CREATE INDEX "ProductQuestion_isVisible_createdAt_idx"
ON "ProductQuestion"("isVisible", "createdAt");
