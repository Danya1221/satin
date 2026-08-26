
ALTER TABLE "ProductReview"
ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "helpfulCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "unhelpfulCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "ProductReview_productId_rating_idx"
ON "ProductReview"("productId", "rating");

CREATE TABLE "ProductReviewVote" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "value" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductReviewVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductReviewVote_reviewId_customerId_key"
ON "ProductReviewVote"("reviewId", "customerId");

CREATE INDEX "ProductReviewVote_reviewId_value_idx"
ON "ProductReviewVote"("reviewId", "value");

ALTER TABLE "ProductReviewVote"
ADD CONSTRAINT "ProductReviewVote_reviewId_fkey"
FOREIGN KEY ("reviewId") REFERENCES "ProductReview"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductReviewVote"
ADD CONSTRAINT "ProductReviewVote_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
