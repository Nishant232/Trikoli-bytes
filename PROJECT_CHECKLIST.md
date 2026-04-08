# Project Checklist

This checklist tracks the remaining work for the food ordering website.

## Critical Fixes

- [x] Connect customer menu to Supabase `menu_items` instead of local static data
- [x] Connect product detail page to Supabase menu data
- [x] Make admin-added and admin-edited menu items visible on the live website
- [x] Fix archived menu item flow so admin can view and restore archived items
- [x] Enforce coupon `max_uses`
- [x] Increase coupon `used_count` after successful order
- [x] Add proper error handling if order is created but order items fail
- [x] Prevent invalid checkout states more safely instead of redirecting during render

## Dashboards

- [x] Finalize `super_admin` dashboard
- [x] Finalize `admin/manager` dashboard permissions
- [x] Finalize `staff` dashboard permissions
- [x] Make sure staff only sees order-related features
- [x] Make sure admin/manager can manage menu and coupons
- [x] Make sure only `super_admin` can assign and remove roles
- [x] Add a cleaner role summary in dashboard UI
- [x] Rename `admin` to `manager` in UI wording

## Authentication and Security

- [x] Add proper protected route for `/admin`
- [x] Add proper protected route for `/orders`, `/checkout`, and other private pages
- [x] Hide admin navigation from normal users
- [x] Add email verification flow instructions and testing
- [x] Add forgot-password and reset-password flow
- [x] Review all Supabase RLS policies again
- [x] Confirm only authorized roles can read and update admin data
- [x] Add session-expiry handling and auto-redirect to login
- [x] Optionally add 2FA later for admin accounts

## User Management

- [x] Make role assignment easier than pasting raw UUID manually
- [x] Show user email and name in admin user manager
- [x] Add search and filter in user role manager
- [x] Add confirmation before changing or removing important roles
- [x] Add first-owner bootstrap flow so initial `super_admin` setup is easier

## Customer Features

- [x] Save cart in `localStorage` so refresh does not clear cart
- [x] Save delivery address and phone from profile if available
- [x] Add order cancellation rules if needed
- [x] Add order status timeline or tracking UI
- [x] Improve product reviews with reviewer name and better date formatting
- [x] Prevent duplicate or abusive reviews if required
- [x] Add empty, loading, and error states across customer pages
- [x] Add better mobile polish for cart, checkout, and orders

## Menu Management

- [x] Add menu availability toggle on customer side
- [x] Hide unavailable items or mark them clearly
- [x] Add category management if categories should be dynamic
- [x] Add image preview before upload
- [x] Add validation for price, category, image size, and image type
- [x] Add sorting and filtering in admin menu manager

## Order Management

- [x] Show order items inside admin order manager
- [x] Add customer name and email in admin orders if needed
- [x] Add filters by date, status, and order id
- [x] Add search by phone or order number
- [x] Add status history or timestamps
- [x] Add payment status handling if online payment is added later

## Coupon Management

- [x] Add edit coupon feature
- [x] Add restore archived coupons feature
- [x] Show expired coupon status clearly
- [x] Block already-expired coupon creation
- [x] Validate discount, min order, and max uses more strictly

## Analytics

- [x] Add date range filters to analytics
- [x] Exclude cancelled orders from revenue if needed
- [x] Add top customers or top categories if useful
- [x] Add export or download reports if needed

## Testing and Verification

- [x] Install dependencies in this workspace
- [x] Run `npm run build`
- [x] Run `npm run lint`
- [x] Run `npm run test`
- [x] Add real tests for auth flow
- [x] Add tests for checkout and order placement
- [x] Add tests for admin role protection
- [x] Add tests for coupon logic
- [x] Add tests for menu CRUD
- [x] Add end-to-end tests for customer and admin flows

## Deployment and Setup

- [x] Create proper `README.md` — Full README with setup, deployment, Supabase, and super_admin docs
- [x] Add `.env.example` — Template with all three required VITE_ variables
- [x] Document Supabase setup steps — Covered in README (create project, get keys, run migrations, configure Auth)
- [x] Document how to create the first `super_admin` — Bootstrap via app UI or direct SQL insert (README)
- [x] Document deployment steps — Vercel, Netlify, and generic static host instructions in README
- [x] Verify production environment variables — `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY` all required and documented
- [x] Verify storage bucket setup for food images — `food-images` public bucket created by migration `20260406090340`; RLS policies grant read to all, write to admins
- [x] Verify Supabase migrations run cleanly in production — 11 ordered migration files documented in README run table; each is idempotent using `CREATE OR REPLACE` and `DROP POLICY IF EXISTS`

## Polish

- [ ] Remove leftover placeholder and generated project text
- [ ] Standardize naming: `Triloki Bytes`, `Claude Kitchen`, or final brand name
- [ ] Check all text, spelling, and branding consistency
- [ ] Improve toast messages and user feedback
- [ ] Add proper favicon, SEO title, and metadata

## Most Important Next 5

- [x] Connect live menu to Supabase
- [x] Fix admin archive and restore logic
- [x] Secure admin routes fully
- [x] Enforce coupon usage logic
- [x] Install dependencies and run full verification
