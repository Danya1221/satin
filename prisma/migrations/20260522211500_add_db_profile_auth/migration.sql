-- Admin accounts and customer favorites are stored in PostgreSQL.
CREATE TABLE IF NOT EXISTS "AdminUser" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Администратор',
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_login_key" ON "AdminUser"("login");
CREATE INDEX IF NOT EXISTS "AdminUser_isActive_idx" ON "AdminUser"("isActive");

CREATE TABLE IF NOT EXISTS "CustomerFavorite" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerFavorite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerFavorite_customerId_productId_key" ON "CustomerFavorite"("customerId", "productId");
CREATE INDEX IF NOT EXISTS "CustomerFavorite_customerId_createdAt_idx" ON "CustomerFavorite"("customerId", "createdAt");

ALTER TABLE "CustomerFavorite"
ADD CONSTRAINT "CustomerFavorite_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerFavorite"
ADD CONSTRAINT "CustomerFavorite_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "SupportMessage" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupportMessage_requestId_createdAt_idx" ON "SupportMessage"("requestId", "createdAt");

ALTER TABLE "SupportMessage"
ADD CONSTRAINT "SupportMessage_requestId_fkey"
FOREIGN KEY ("requestId") REFERENCES "SupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
