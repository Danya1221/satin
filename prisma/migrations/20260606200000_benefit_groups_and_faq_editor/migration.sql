ALTER TABLE "SiteBenefit"
ADD COLUMN IF NOT EXISTS "placement" TEXT NOT NULL DEFAULT 'store';

CREATE INDEX IF NOT EXISTS "SiteBenefit_placement_enabled_sortOrder_idx"
ON "SiteBenefit"("placement", "enabled", "sortOrder");

INSERT INTO "SiteBenefit"
  ("id", "title", "description", "icon", "image", "href", "placement", "enabled", "sortOrder", "createdAt", "updatedAt")
SELECT
  'product-' || "id",
  "title",
  "description",
  "icon",
  "image",
  "href",
  'product',
  "enabled",
  "sortOrder",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "SiteBenefit"
WHERE "placement" = 'store'
  AND NOT EXISTS (SELECT 1 FROM "SiteBenefit" WHERE "placement" = 'product');

ALTER TABLE "FaqCategory"
ADD COLUMN IF NOT EXISTS "image" TEXT NOT NULL DEFAULT '';

ALTER TABLE "FaqQuestion"
ADD COLUMN IF NOT EXISTS "image" TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "FaqHighlight" (
  "id" TEXT NOT NULL,
  "eyebrow" TEXT NOT NULL DEFAULT '',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "image" TEXT NOT NULL DEFAULT '',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FaqHighlight_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FaqHighlight_isActive_sortOrder_idx"
ON "FaqHighlight"("isActive", "sortOrder");

INSERT INTO "FaqHighlight"
  ("id", "eyebrow", "title", "description", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('faq-highlight-selection', 'Подбор', 'Не знаете модель?', 'Напишите в поддержку задачу и бюджет — менеджер подскажет подходящую технику.', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('faq-highlight-order', 'Заказ', 'Всё подтверждается', 'Наличие, доставка и итоговая сумма подтверждаются менеджером перед получением.', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('faq-highlight-payment', 'Оплата', 'Только наличными', 'Онлайн-оплаты нет. Клиент оплачивает заказ наличными при получении.', true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
