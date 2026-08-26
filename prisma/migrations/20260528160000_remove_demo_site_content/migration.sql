-- Remove demo storefront content that was previously inserted by seed.js.
-- Exact-match deletes keep manually edited real content untouched.
DELETE FROM "SiteBenefit"
WHERE ("title", "description") IN (
  ('Только оригинал', 'Работаем с проверенными поставщиками.'),
  ('Гарантия и сервис', 'Поможем после покупки и решим вопросы.'),
  ('Быстрая доставка', 'По Москве — быстро, по России — надёжно.'),
  ('Безопасная оплата', 'Удобные способы оплаты и подтверждение заказа.'),
  ('Поддержка 24/7', 'Подскажем с выбором и конфигурацией.')
)
AND "image" = ''
AND "href" = '';

DELETE FROM "SiteBanner"
WHERE "adminTitle" = 'Основной промо-баннер'
AND "title" = 'Соберите витрину без кода'
AND "subtitle" = 'Создавайте баннеры в редакторе и подключайте их к модулям главной.'
AND "imageLight" = ''
AND "imageDark" = ''
AND "imageMobile" = '';
