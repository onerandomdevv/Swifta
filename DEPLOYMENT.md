# Server Deployment Guide (Render)

This guide takes you step-by-step through deploying the SwiftTrade Backend to Render, connecting your database, and launching the Frontend on Vercel.

## Step 1: Prepare Your Database & Cache

Before deploying the backend code, you need a live database and cache.

1. **PostgreSQL Database (Supabase)**
   - Create a free project at [Supabase](https://supabase.com).
   - Navigate to **Project Settings → Database → Connection string → URI**.
   - Copy this connection string. It will look like: `postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres`.
   - _This is your `DATABASE_URL`._

2. **Redis Cache (Render)**
   - Log into your [Render Dashboard](https://dashboard.render.com).
   - Click **New +** and select **Key Value** _(Render recently renamed 'Redis' to 'Key Value')_.
   - Name it `hardware-os-cache` and create the instance.
   - Once created, copy the **Internal Redis URL** (e.g., `redis://red-xxxx:6379`).
   - _This is your `REDIS_URL`._

---

## Step 2: Deploy the Backend to Render

1. On your Render Dashboard, click **New +** and select **Web Service**.
2. Connect your GitHub repository (`hardware-os`).
3. Fill out the deployment details exactly as follows:
   - **Name**: `hardware-os-backend`
   - **Environment**: Node
   - **Root Directory**: `apps/backend`
   - **Build Command**: `pnpm install && npx prisma generate && pnpm run build`
   - **Start Command**: `pnpm run start:prod`

4. Scroll down to **Environment Variables** and click Add Environment Variable. Add all of these:

| Key                        | Value                                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`             | _(The Supabase URL you copied in Step 1)_                                                                                                                 |
| `REDIS_URL`                | _(The Render Internal Redis URL from Step 1)_                                                                                                             |
| `PORT`                     | `4000`                                                                                                                                                    |
| `JWT_ACCESS_SECRET`        | _(Any random long string, e.g., `my-super-secret`)_                                                                                                       |
| `JWT_REFRESH_SECRET`       | _(Another random long string)_                                                                                                                            |
| `JWT_ACCESS_TTL`           | `15m`                                                                                                                                                     |
| `JWT_REFRESH_TTL`          | `7d`                                                                                                                                                      |
| `PAYSTACK_SECRET_KEY`      | _(Your Paystack Test Secret Key from Paystack Dashboard)_                                                                                                 |
| `PAYSTACK_PUBLIC_KEY`      | _(Your Paystack Test Public Key)_                                                                                                                         |
| `PAYSTACK_WEBHOOK_SECRET`  | _(Same as your Secret Key)_                                                                                                                               |
| `PAYSTACK_BASE_URL`        | `https://api.paystack.co`                                                                                                                                 |
| `EMAIL_PROVIDER`           | `resend`                                                                                                                                                  |
| `RESEND_API_KEY`           | _(Your Resend API Key for sending emails)_                                                                                                                |
| `EMAIL_FROM`               | `onboarding@resend.dev`                                                                                                                                   |
| `CLOUDINARY_CLOUD_NAME`    | _(Your Cloudinary Cloud Name)_                                                                                                                            |
| `CLOUDINARY_API_KEY`       | _(Your Cloudinary API Key)_                                                                                                                               |
| `CLOUDINARY_API_SECRET`    | _(Your Cloudinary API Secret)_                                                                                                                            |
| `AT_USERNAME`              | `sandbox` _(or your Africa's Talking username)_                                                                                                           |
| `AT_API_KEY`               | _(Your Africa's Talking API Key)_                                                                                                                         |
| `ADMIN_BOOTSTRAP_EMAIL`    | `admin@swifttrade.ng` _(Change if used!)_                                                                                                                 |
| `ADMIN_BOOTSTRAP_PASSWORD` | _(Generate a strong secret, e.g. via your password manager. Set this as an env var)_                                                                      |
| `CORS_ORIGINS`             | `https://your-vercel-domain.vercel.app` _(Explicitly list allowed origins for security! Ensure sameSite/secure cookie settings align with this for auth)_ |

5. Click **Deploy Web Service**. Render will now install dependencies, build the code, and start the server.

---

## Step 3: Initialize the Production Database

Now that the backend is running, you must create all the tables in your live Supabase database.

1. On your Render dashboard for `hardware-os-backend`, click on the **Shell** tab (a built-in terminal).
2. Type the following command and press Enter:
   ```bash
   npx prisma migrate deploy
   ```
   _This analyzes your database and safely applies all the tables needed for SwiftTrade._

---

## Step 4: Seed the Master Admin Account

Instead of creating an admin through the frontend (which leaves messy 'Merchant' ghost profiles), run the automated security seed script on Render to generate your first `SUPER_ADMIN` account cleanly.

1. Stay in the **Shell** tab on your Render dashboard.
2. Type the following command to securely inject the default administrator:
   ```bash
   npx prisma db seed
   ```
3. Once it says "Super Admin created successfully", you can log into your dashboard using:
   - **Email:** `admin@hardware-os.com`
   - **Password:** `Admin@123`

_(**CRITICAL**: You must securely change this default password the very first time you log in!)_

---

## Step 5: Deploy the Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and click **Add New → Project**.
2. Import your GitHub repository (`hardware-os`).
3. In the configuration settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: Select `apps/web` (Important!)
4. Expand **Environment Variables** and add:
   - `NEXT_PUBLIC_API_URL`: _(Your new Render Backend URL, e.g., `https://hardware-os-backend.onrender.com`)_
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: _(Your Paystack Test Public Key)_
5. Click **Deploy**.

---

## Step 6: Final Security Lockdown

Once Vercel finishes deploying, your frontend is live! One last step is required to secure the connection:

1. Copy your new Vercel Frontend URL (e.g., `https://hardware-os.vercel.app`).
2. Go back to the **Render Dashboard** for your backend.
3. Edit the `CORS_ORIGINS` environment variable.
4. Replace `*` with your Vercel URL: `https://hardware-os.vercel.app`
5. Save the changes. Render will automatically restart your backend.

**Congratulations! SwiftTrade is now fully live and securely linked!** 🎉
