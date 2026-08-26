CREATE TABLE "FaqCategory" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "eyebrow" TEXT NOT NULL DEFAULT '',
  "title" TEXT NOT NULL,
  "icon" TEXT NOT NULL DEFAULT '?',
  "description" TEXT NOT NULL DEFAULT '',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FaqCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FaqQuestion" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FaqQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FaqCategory_slug_key" ON "FaqCategory"("slug");
CREATE INDEX "FaqCategory_isActive_sortOrder_idx" ON "FaqCategory"("isActive", "sortOrder");
CREATE INDEX "FaqQuestion_categoryId_isActive_sortOrder_idx" ON "FaqQuestion"("categoryId", "isActive", "sortOrder");

ALTER TABLE "FaqQuestion"
ADD CONSTRAINT "FaqQuestion_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "FaqCategory"("id")
ON DELETE CASCADE ON UPDATE CASCADE;


INSERT INTO "FaqCategory" ("id","slug","eyebrow","title","icon","description","isActive","sortOrder","createdAt","updatedAt")
VALUES ('faq_delivery','delivery','Получение','Доставка и ПВЗ','→','Курьер, самовывоз, адрес и сроки получения заказа.',true,10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqCategory" ("id","slug","eyebrow","title","icon","description","isActive","sortOrder","createdAt","updatedAt")
VALUES ('faq_order','order','Заявка','Заказ и подтверждение','№','Как проходит заявка, подтверждение и связь с менеджером.',true,20,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqCategory" ("id","slug","eyebrow","title","icon","description","isActive","sortOrder","createdAt","updatedAt")
VALUES ('faq_payment','payment','Оплата','Наличные при получении','₽','Как клиент оплачивает заказ и почему нет онлайн-оплаты.',true,30,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqCategory" ("id","slug","eyebrow","title","icon","description","isActive","sortOrder","createdAt","updatedAt")
VALUES ('faq_products','products','Каталог','Товары и конфигурации','N','Модели, память, цвет, SIM/eSIM и наличие.',true,40,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqCategory" ("id","slug","eyebrow","title","icon","description","isActive","sortOrder","createdAt","updatedAt")
VALUES ('faq_warranty','warranty','После покупки','Гарантия и проблема','!','Что делать после покупки, если есть вопрос по товару.',true,50,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_d_1','faq_delivery','Как выбрать доставку?','В корзине откройте блок «Доставка» и выберите курьерскую доставку или ПВЗ / самовывоз. Пока способ получения не выбран, оформить заказ нельзя.',true,10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_d_2','faq_delivery','Что нужно указать для курьерской доставки?','Незарегистрированный клиент указывает город и адрес доставки. Если клиент вошёл в личный кабинет, можно выбрать сохранённый адрес или добавить новый.',true,20,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_d_3','faq_delivery','Как работает ПВЗ / самовывоз?','Клиент выбирает пункт выдачи из доступного варианта на сайте. Адрес ПВЗ задаётся магазином и будет показан в корзине перед оформлением.',true,30,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_d_4','faq_delivery','Когда станет известен точный срок?','После заявки менеджер проверит наличие, город, способ получения и подтвердит точный срок вручную.',true,40,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_o_1','faq_order','Это онлайн-оплата или заявка?','Сейчас оформление работает как заявка. Клиент выбирает товар, доставку и контакты, а менеджер подтверждает наличие, конфигурацию и итоговую стоимость.',true,10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_o_2','faq_order','Почему заказ подтверждает менеджер?','У техники могут меняться наличие, поставка, цвет, память и цена. Поэтому перед передачей товара менеджер проверяет детали и связывается с клиентом.',true,20,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_o_3','faq_order','Что будет после отправки заявки?','Менеджер получит данные заказа, проверит товар и свяжется с клиентом для подтверждения способа получения и итоговой суммы.',true,30,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_o_4','faq_order','Можно ли изменить конфигурацию после заявки?','Да. До подтверждения менеджером можно обсудить другую память, цвет, SIM/eSIM или похожую модель.',true,40,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_p_1','faq_payment','Какая оплата доступна?','Оплата только наличными при получении. Онлайн-оплаты на сайте сейчас нет.',true,10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_p_2','faq_payment','Нужно ли вносить предоплату?','Для обычной заявки предоплата на сайте не требуется. Если товар редкий или под заказ, условия менеджер уточнит отдельно.',true,20,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_p_3','faq_payment','Цена на сайте окончательная?','Цена показывает ориентир по выбранной модели или конкретной конфигурации. Итоговую сумму менеджер подтверждает перед получением.',true,30,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_c_1','faq_products','Почему в каталоге цена “от — до”?','Каталог показывает модель товара, а цена считается по всем доступным конфигурациям: память, цвет, SIM/eSIM и наличие.',true,10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_c_2','faq_products','Когда появляется точная цена?','Точная цена появляется после выбора конкретной конфигурации товара. Например: iPhone 17 Pro, 256 GB, Blue, eSIM.',true,20,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_c_3','faq_products','Почему некоторые параметры серые?','Серые параметры показывают варианты, которые недоступны в текущей комбинации. Их видно, но выбрать нельзя, чтобы клиент не собрал несуществующий товар.',true,30,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_c_4','faq_products','Можно ли заказать товар, которого нет в каталоге?','Да. Для этого лучше написать в поддержку и указать модель, желаемую конфигурацию и бюджет.',true,40,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_w_1','faq_warranty','Техника оригинальная?','Да, магазин работает с оригинальной техникой. Детали по конкретной поставке и гарантии менеджер подтверждает перед заказом.',true,10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_w_2','faq_warranty','Что делать, если возникла проблема?','Напишите в поддержку и выберите тему «Брак / проблема». Лучше сразу указать модель, дату покупки, номер заявки и кратко описать ситуацию.',true,20,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO "FaqQuestion" ("id","categoryId","question","answer","isActive","sortOrder","createdAt","updatedAt")
VALUES ('fq_w_3','faq_warranty','Гарантия одинаковая на все товары?','Условия могут отличаться в зависимости от модели и поставки. Поэтому гарантию по конкретному товару лучше уточнить до оформления.',true,30,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);