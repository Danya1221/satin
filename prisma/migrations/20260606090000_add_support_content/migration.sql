
CREATE TABLE "SupportFeature" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "text" TEXT NOT NULL DEFAULT '',
  "icon" TEXT NOT NULL DEFAULT '✓',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportFeature_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportFaqItem" (
  "id" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportFaqItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportFeature_isActive_sortOrder_idx"
ON "SupportFeature"("isActive", "sortOrder");

CREATE INDEX "SupportFaqItem_isActive_sortOrder_idx"
ON "SupportFaqItem"("isActive", "sortOrder");

INSERT INTO "SupportFeature"
("id","title","text","icon","isActive","sortOrder","createdAt","updatedAt")
VALUES
('support_feature_original','Только оригинал','Работаем напрямую с официальными поставщиками.','✓',true,10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('support_feature_warranty','Официальная гарантия','Гарантия производителя и собственная поддержка.','✓',true,20,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('support_feature_delivery','Быстрая доставка','По Москве — 1 день, по России — от 2 дней.','✓',true,30,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('support_feature_payment','Безопасная оплата','Защищённые платежи и удобные способы оплаты.','✓',true,40,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "SupportFaqItem"
("id","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES
('support_faq_config','Можно ли выбрать конфигурацию?','Да. На странице товара можно выбрать нужный объём памяти, цвет и доступные параметры модели.',true,10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('support_faq_stock','Есть ли техника в наличии?','Да, большинство популярных моделей есть в наличии. Актуальный статус наличия показывается в карточке товара.',true,20,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('support_faq_order','Как оформить заказ?','Добавьте товар в корзину, укажите контакты и способ доставки — после этого менеджер подтвердит заказ.',true,30,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('support_faq_request','Можно ли заказать товар под запрос?','Да. Если нужной конфигурации нет в наличии, мы можем привезти её под заказ. Сроки и условия уточняются индивидуально.',true,40,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
