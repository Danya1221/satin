-- Add staff roles for admin users
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'owner';
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "AdminUser_role_idx" ON "AdminUser"("role");
