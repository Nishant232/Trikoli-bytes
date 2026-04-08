# 🍽️ Triloki Bytes — Food Ordering Platform

A full-stack food ordering web application built with **React + Vite**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **Supabase**. It includes a customer-facing storefront, a multi-role admin dashboard, order management, coupon system, and image storage.

---

## ✨ Features

- 🛒 **Customer storefront** — Browse menu, add to cart, apply coupons, and place orders
- 📦 **Order tracking** — Real-time order status timeline for customers
- 🔐 **Auth** — Email/password sign-up, login, forgot password, email verification
- 🎛️ **Multi-role admin dashboard** — `super_admin`, `admin/manager`, and `staff` roles
- 🍜 **Menu management** — Add, edit, archive, and restore menu items with image uploads
- 🏷️ **Coupon management** — Create, edit, archive, and validate coupons
- 👥 **User management** — Assign and remove roles; bootstrap first `super_admin`
- 📊 **Analytics** — Revenue, top items, order counts with date range filters
- 🖼️ **Image storage** — Food images stored in Supabase Storage (public bucket)

---

## 🏗️ Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Frontend    | React 18, TypeScript, Vite              |
| UI          | Tailwind CSS, shadcn/ui, Radix UI       |
| State       | TanStack React Query, React Context     |
| Backend     | Supabase (PostgreSQL, Auth, Storage)    |
| Testing     | Vitest, React Testing Library, Playwright |
| Deployment  | Vercel / Netlify / any static host      |

---

## 📁 Project Structure

```
flavorful-feasts-online/
├── public/                  # Static assets
├── src/
│   ├── components/          # Shared UI components
│   │   ├── auth/            # ProtectedRoute, AdminRoute
│   │   └── ...
│   ├── contexts/            # AuthContext, CartContext
│   ├── hooks/               # Custom React hooks
│   ├── integrations/
│   │   └── supabase/        # Auto-generated client & types
│   ├── pages/               # Route-level page components
│   └── types/               # TypeScript type definitions
├── supabase/
│   ├── config.toml          # Supabase project config
│   └── migrations/          # Ordered SQL migration files
├── .env.example             # Required environment variables template
├── vite.config.ts
└── package.json
```

---

## 🚀 Local Development Setup

### Prerequisites

- **Node.js** 18+ and **npm** (or **bun**)
- A **Supabase** project (free tier is sufficient)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/your-username/triloki-bytes.git
cd triloki-bytes/flavorful-feasts-online
```

### 2. Install dependencies

```bash
npm install
# or
bun install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials (see [Supabase Setup](#-supabase-setup) below):

```env
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-public-key"
```

### 4. Run database migrations

See [Supabase Setup → Running Migrations](#3-run-migrations).

### 5. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

---

## 🗄️ Supabase Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project** and fill in the details.
3. Wait for the project to be provisioned (~1 minute).

### 2. Get your API credentials

1. In your Supabase dashboard, go to **Settings → API**.
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project ID** (subdomain) → `VITE_SUPABASE_PROJECT_ID`
   - **anon / public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`

> ⚠️ Never use the `service_role` key in the frontend. Always use the **anon** key.

### 3. Run migrations

All database schema is managed through SQL migration files in `supabase/migrations/`. Run them **in filename order** in the Supabase SQL Editor.

Go to **SQL Editor** in your Supabase dashboard and run each file in order:

| Order | File | Description |
|-------|------|-------------|
| 1 | `20260405093022_*.sql` | Core tables: profiles, user_roles, reviews, coupons, orders, order_items |
| 2 | `20260405093041_*.sql` | User roles view-own-role policy |
| 3 | `20260406090340_*.sql` | Menu items table + food-images storage bucket |
| 4 | `20260406091637_*.sql` | App role updates (adds `super_admin`, `staff`) |
| 5 | `20260406091701_*.sql` | Updated RLS policies for all tables |
| 6 | `20260407124500_critical_fixes.sql` | `place_order` function, coupon enforcement |
| 7 | `20260407143000_user_management_helpers.sql` | Admin user management + first super_admin bootstrap |
| 8 | `20260407154500_customer_features.sql` | Customer feature improvements |
| 9 | `20260407170000_order_management.sql` | Order management enhancements |
| 10 | `20260407174500_coupon_management.sql` | Coupon management improvements |
| 11 | `20260407193000_auth_security.sql` | Auth security polish |

> 💡 **Tip:** You can copy-paste each file's content directly into the SQL Editor and click **Run**.

### 4. Configure Auth settings

1. Go to **Authentication → Settings** in your Supabase dashboard.
2. **Enable Email Provider** (should be on by default).
3. Optionally disable **Confirm email** for local development (re-enable for production).
4. Set your **Site URL** to your production domain (or `http://localhost:8080` for local dev).
5. Add your production domain to **Redirect URLs**.

### 5. Set up the Storage bucket

The `food-images` storage bucket is created automatically by migration `20260406090340_*.sql`. To verify:

1. Go to **Storage** in your Supabase dashboard.
2. Confirm the `food-images` bucket exists and is set to **public**.
3. If it doesn't exist, run the migration again or manually create a public bucket named `food-images`.

Storage RLS policies (set by migration):
- **Anyone** can read/view food images
- **Admin and super_admin** roles can upload, update, and delete images

---

## 👑 Creating the First `super_admin`

Because no `super_admin` exists yet in a fresh database, the application provides a **one-time bootstrap flow**:

### Option A — Bootstrap via the app (recommended)

1. **Sign up** for an account on the app (or log in with an existing account).
2. Navigate to `/admin/login` and log in.
3. Look for the **"Claim super admin"** or **"Bootstrap first admin"** button on the admin page. This button is **only shown when no super_admin exists yet**.
4. Click it. The `bootstrap_first_super_admin()` SQL function runs, granting your account the `super_admin` role.
5. The button disappears immediately after the role is granted — it can never be used again.

### Option B — Via the Supabase SQL Editor

If you prefer to set it up directly:

```sql
-- Replace with the UUID of the user you want to make super_admin
-- Find the UUID in Authentication → Users in the Supabase dashboard
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-UUID-HERE', 'super_admin');
```

### Roles Overview

| Role          | Access Level |
|---------------|--------------|
| `super_admin` | Full access — manage all data, assign/remove all roles |
| `admin`       | Manage menu, coupons, orders; cannot manage roles |
| `staff`       | View and update orders only |
| *(none)*      | Regular customer; can browse, order, review |

Once you are `super_admin`, you can assign `admin` or `staff` roles to other users from the **User Management** section of the Admin Dashboard.

---

## 🌐 Deployment

This is a static React SPA that can be deployed to any static hosting service.

### Deploy to Vercel (recommended)

1. Push your repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and import your repository.
3. Set the **Root Directory** to `flavorful-feasts-online` (if the repo contains multiple projects).
4. Set the **Framework Preset** to **Vite**.
5. Add all **Environment Variables** (see below).
6. Click **Deploy**.

### Deploy to Netlify

1. Push your repository to GitHub.
2. Go to [netlify.com](https://netlify.com) and click **Add new site → Import an existing project**.
3. Connect GitHub and select the repo.
4. Set **Base directory** to `flavorful-feasts-online`, **Build command** to `npm run build`, and **Publish directory** to `dist`.
5. Add environment variables.
6. Click **Deploy site**.

### Deploy to any static host

```bash
npm run build
# Upload the contents of the /dist folder to your host
```

---

## ✅ Production Environment Variables

Set these in your hosting provider's dashboard (Vercel, Netlify, etc.):

| Variable | Value | Where to find it |
|----------|-------|-----------------|
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` | Supabase → Settings → API |
| `VITE_SUPABASE_PROJECT_ID` | `your-project-id` | Supabase → Settings → General |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJ...` (anon key) | Supabase → Settings → API |

> ⚠️ All three variables are **required**. The app will fail to connect to Supabase without them.
>
> ⚠️ All three must be prefixed with `VITE_` for Vite to expose them to the browser bundle.

After setting environment variables, **redeploy** the app for changes to take effect.

---

## 🧪 Running Tests

```bash
# Unit and integration tests (Vitest)
npm run test

# Watch mode
npm run test:watch

# End-to-end tests (Playwright)
npx playwright test
```

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server on port 8080 |
| `npm run build` | Production build → `/dist` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint check |
| `npm run test` | Run all unit tests |
| `npm run test:watch` | Run tests in watch mode |

---

## 🔧 Environment Variables Reference

See [`.env.example`](./.env.example) for a full template.

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.
