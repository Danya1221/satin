-- Earlier application versions already read these fields, but had no migration.
-- Keep existing values in databases previously synchronized with prisma db push.
ALTER TABLE "SiteBanner" ADD COLUMN IF NOT EXISTS "secondaryButtonText" TEXT NOT NULL DEFAULT 'Каталог';
ALTER TABLE "SiteBanner" ADD COLUMN IF NOT EXISTS "secondaryButtonHref" TEXT NOT NULL DEFAULT '/catalog';
