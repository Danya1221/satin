-- Multiple admin roles per employee. Existing single role stays for backwards compatibility.
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "roles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "AdminUser"
SET "roles" = CASE
  WHEN "roles" IS NULL OR cardinality("roles") = 0 THEN ARRAY[COALESCE(NULLIF("role", ''), 'manager')]
  ELSE "roles"
END;
