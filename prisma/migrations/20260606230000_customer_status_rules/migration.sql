ALTER TABLE "Customer"
ADD COLUMN "statusOverride" TEXT NOT NULL DEFAULT '',
ADD COLUMN "statusOverrideAt" TIMESTAMP(3);
