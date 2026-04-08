CREATE OR REPLACE FUNCTION public.admin_list_users_with_roles()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  roles text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    users.id AS user_id,
    users.email::text AS email,
    profiles.full_name,
    COALESCE(array_agg(user_roles.role::text) FILTER (WHERE user_roles.role IS NOT NULL), '{}'::text[]) AS roles
  FROM auth.users AS users
  LEFT JOIN public.profiles AS profiles ON profiles.id = users.id
  LEFT JOIN public.user_roles AS user_roles ON user_roles.user_id = users.id
  GROUP BY users.id, users.email, profiles.full_name
  ORDER BY COALESCE(profiles.full_name, users.email), users.email;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_bootstrap_first_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'super_admin'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_first_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'super_admin'::public.app_role
  ) THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'super_admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users_with_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_bootstrap_first_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_super_admin() TO authenticated;
