# Deployment Guide — HARDWARE OS Backend

## Architecture

```
Vercel (Frontend) → Render Web Service (Backend) → Supabase (Postgres) + Redis
                                                  → Paystack API
                                                  → Resend Email API
```

---

## 1. Supabase (PostgreSQL)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string → URI**
3. Copy the connection string and set it as `DATABASE_URL`
4. Run migrations:
   ```bash
   DATABASE_URL="your-supabase-url" npx prisma migrate deploy --schema=apps/backend/src/prisma/schema.prisma
   ```

---

## 2. Redis

### Option A: Render Redis (recommended if using Render)

1. Create a Redis instance in Render dashboard
2. Copy the internal URL → set as `REDIS_URL`

### Option B: Upstash (serverless Redis)

1. Create a database at [upstash.com](https://upstash.com)
2. Copy the Redis URL → set as `REDIS_URL`

---

## 3. Render (Backend Hosting)

### Automatic (Blueprint)

1. Push `render.yaml` to repo
2. Go to **Render → New → Blueprint**
3. Connect GitHub repo → select `main` branch
4. Render reads `render.yaml` and creates the service
5. Fill in `sync: false` env vars in the dashboard

### Manual

1. **New → Web Service → Docker**
2. Root: repository root
3. Dockerfile: `apps/backend/Dockerfile`
4. Docker context: `.`
5. Set all environment variables from `.env.example`
6. Health check path: `/health`

### Post-deploy

```bash
# Run migrations (via Render shell or one-off job)
DATABASE_URL="..." npx prisma migrate deploy --schema=apps/backend/src/prisma/schema.prisma
```

---

## 4. Paystack Webhook

1. Go to [Paystack Dashboard → Settings → Webhooks](https://dashboard.paystack.com/#/settings/webhooks)
2. Set webhook URL: `https://your-render-url.onrender.com/payments/webhook`
3. Copy the webhook secret → set as `PAYSTACK_WEBHOOK_SECRET`

---

## 5. Vercel (Frontend)

1. Import `apps/web` to Vercel
2. Set root directory to `apps/web`
3. Set `NEXT_PUBLIC_API_URL` to your Render backend URL
4. Deploy

---

## 6. Environment Variable Checklist

| Variable                  | Where to get it                | Required |
| ------------------------- | ------------------------------ | -------- |
| `DATABASE_URL`            | Supabase → Settings → Database | ✅       |
| `REDIS_URL`               | Render Redis / Upstash         | ✅       |
| `JWT_ACCESS_SECRET`       | `openssl rand -hex 32`         | ✅       |
| `JWT_REFRESH_SECRET`      | `openssl rand -hex 32`         | ✅       |
| `PAYSTACK_SECRET_KEY`     | Paystack Dashboard             | ✅       |
| `PAYSTACK_PUBLIC_KEY`     | Paystack Dashboard             | ✅       |
| `PAYSTACK_WEBHOOK_SECRET` | Paystack Dashboard → Webhooks  | ✅       |
| `RESEND_API_KEY`          | Resend Dashboard               | ✅       |
| `FRONTEND_URL`            | Your Vercel URL                | ✅       |
| `CORS_ORIGINS`            | Your Vercel URL                | ✅       |

---

## Quick Commands

```bash
# Local dev (starts Postgres + Redis)
docker compose up -d
pnpm dev

# Build
pnpm build

# Docker build (test locally)
docker build -f apps/backend/Dockerfile -t hardware-os-backend .

# Run Prisma migrations
npx prisma migrate deploy --schema=apps/backend/src/prisma/schema.prisma

# Generate Prisma client
npx prisma generate --schema=apps/backend/src/prisma/schema.prisma
```
