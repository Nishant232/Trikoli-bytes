
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';

ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
