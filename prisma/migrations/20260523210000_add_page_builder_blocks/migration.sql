CREATE TABLE IF NOT EXISTS "PageBlock" (
  "id" TEXT NOT NULL,
  "pageKey" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 100,
  "settings" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PageBlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PageBlock_pageKey_enabled_sortOrder_idx" ON "PageBlock"("pageKey", "enabled", "sortOrder");
CREATE INDEX IF NOT EXISTS "PageBlock_type_idx" ON "PageBlock"("type");
