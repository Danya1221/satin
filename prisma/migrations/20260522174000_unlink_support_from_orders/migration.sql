ALTER TABLE "SupportRequest" DROP CONSTRAINT IF EXISTS "SupportRequest_orderId_fkey";
ALTER TABLE "SupportRequest" DROP COLUMN IF EXISTS "orderId";
