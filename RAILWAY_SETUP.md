# Railway test deploy

## Services
Create one Railway project with two services:

1. PostgreSQL
2. Next.js app from the repository

## Variables
Copy `DATABASE_URL` from Railway PostgreSQL into the Next.js service variables.
Also add:

```env
NEXT_PUBLIC_SITE_URL="https://your-test-domain.up.railway.app"
ADMIN_LOGIN="admin"
ADMIN_PASSWORD="change-me"
```

## Local setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

## Railway deploy flow

Railway will run:

```bash
npm install
npm run build
npm run db:migrate
npm run start
```

For the first test database you can seed manually from Railway shell:

```bash
npm run db:seed
```

## Health check

After deploy open:

```txt
/api/admin/health
```

It should return:

```json
{ "ok": true, "database": "connected" }
```
