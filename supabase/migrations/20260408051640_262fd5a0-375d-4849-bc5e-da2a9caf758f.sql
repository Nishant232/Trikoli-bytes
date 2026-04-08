
-- Function: list customers who placed orders (for analytics & order manager)
CREATE OR REPLACE FUNCTION public.admin_list_order_customers()
RETURNS TABLE(user_id uuid, email text, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    p.id AS user_id,
    u.email::text AS email,
    p.full_name
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.id IN (SELECT o.user_id FROM public.orders o WHERE o.user_id IS NOT NULL)
$$;

-- Function: list all users with their roles (for user manager)
CREATE OR REPLACE FUNCTION public.admin_list_users_with_roles()
RETURNS TABLE(user_id uuid, email text, full_name text, roles text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id AS user_id,
    u.email::text AS email,
    p.full_name,
    COALESCE(
      ARRAY_AGG(r.role::text) FILTER (WHERE r.role IS NOT NULL),
      '{}'::text[]
    ) AS roles
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  GROUP BY u.id, u.email, p.full_name
$$;
