Neontech full admin/database build

Что внутри:
- актуальный проект без node_modules, .next и .env
- Railway + PostgreSQL + Prisma
- админка товаров читает БД
- создание карточек товаров
- создание SKU / позиции
- редактирование карточки
- редактирование SKU
- удаление ошибочной SKU
- nixpacks.toml заставляет Railway использовать npm install вместо npm ci

После распаковки локально:
1) npm.cmd install
2) npm.cmd run build
3) git add .
4) git commit -m "Apply full admin database build"
5) git push

На Railway должны быть Variables:
DATABASE_URL=${{Postgres.DATABASE_URL}}
ADMIN_LOGIN=admin
ADMIN_PASSWORD=ваш_пароль
AUTH_SECRET=случайный_секрет_для_подписи_сессий

AUTH_SECRET обязателен для входа в production. Сгенерируйте его локально:
openssl rand -hex 32
Вставьте результат в Variables сервиса сайта на Railway и примените изменения
через Deploy. Не используйте пароль администратора в качестве AUTH_SECRET и
не сохраняйте значение в GitHub. Сохраняйте этот ключ между перезапусками:
его смена завершает существующие сессии. Также поддерживается NEXTAUTH_SECRET,
если он уже настроен вместо AUTH_SECRET.

Не загружать в GitHub:
.env
node_modules
.next
