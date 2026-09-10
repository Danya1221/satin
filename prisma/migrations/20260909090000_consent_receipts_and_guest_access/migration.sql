ALTER TABLE "SupportRequest" ADD COLUMN "guestTokenHash" TEXT NOT NULL DEFAULT '';
CREATE TABLE "ConsentReceipt" (
  "id" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "documentVersion" TEXT NOT NULL,
  "documentText" TEXT NOT NULL,
  "documentHash" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsentReceipt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ConsentReceipt_subjectId_purpose_idx" ON "ConsentReceipt"("subjectId", "purpose");
CREATE INDEX "ConsentReceipt_acceptedAt_idx" ON "ConsentReceipt"("acceptedAt");
