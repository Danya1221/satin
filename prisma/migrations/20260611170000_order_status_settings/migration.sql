-- Allow order statuses to be configured from the admin panel.
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'new';
DROP TYPE IF EXISTS "OrderStatus";
