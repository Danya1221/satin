INSERT INTO "PageBlock"
  ("id", "pageKey", "type", "title", "description", "enabled", "sortOrder", "settings", "createdAt", "updatedAt")
SELECT
  'faq-header-default',
  'faq',
  'faq-header',
  'Заголовок FAQ',
  'Верхний блок страницы FAQ: заголовок, описание и кнопки.',
  true,
  10,
  '{"title":"Частые вопросы","subtitle":"Коротко объясняем, как работает выбор техники, корзина, доставка, оплата и связь с менеджером.","showSupportButton":true,"supportButtonText":"Написать в поддержку","supportButtonHref":"/help","showCatalogButton":true,"catalogButtonText":"Перейти в каталог","catalogButtonHref":"/catalog"}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "PageBlock" WHERE "pageKey" = 'faq' AND "type" = 'faq-header'
);

INSERT INTO "PageBlock"
  ("id", "pageKey", "type", "title", "description", "enabled", "sortOrder", "settings", "createdAt", "updatedAt")
SELECT
  'faq-content-default',
  'faq',
  'faq-content',
  'Разделы и вопросы',
  'Основной блок FAQ с разделами, вопросами, ответами и изображениями.',
  true,
  20,
  '{"title":"Разделы FAQ","showImages":true,"showBenefits":true,"layout":"tabs"}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "PageBlock" WHERE "pageKey" = 'faq' AND "type" = 'faq-content'
);
