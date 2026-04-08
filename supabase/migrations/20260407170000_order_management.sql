CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own order status history" ON public.order_status_history;
CREATE POLICY "Users can view own order status history"
ON public.order_status_history FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_status_history.order_id
      AND orders.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users and staff can insert order status history" ON public.order_status_history;
CREATE POLICY "Users and staff can insert order status history"
ON public.order_status_history FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_status_history.order_id
      AND (
        orders.user_id = auth.uid() OR
        has_role(auth.uid(), 'super_admin'::app_role) OR
        has_role(auth.uid(), 'admin'::app_role) OR
        has_role(auth.uid(), 'staff'::app_role)
      )
  )
);

DROP POLICY IF EXISTS "Staff and admins can view all order status history" ON public.order_status_history;
CREATE POLICY "Staff and admins can view all order status history"
ON public.order_status_history FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'staff'::app_role)
);

CREATE OR REPLACE FUNCTION public.set_order_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_updated_at_trigger ON public.orders;
CREATE TRIGGER set_order_updated_at_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_updated_at();

CREATE OR REPLACE FUNCTION public.log_order_status_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_history (order_id, status, changed_at)
    VALUES (NEW.id, NEW.status, COALESCE(NEW.created_at, now()));
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history (order_id, status, changed_at)
    VALUES (NEW.id, NEW.status, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_order_status_history_trigger ON public.orders;
CREATE TRIGGER log_order_status_history_trigger
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_history();

INSERT INTO public.order_status_history (order_id, status, changed_at)
SELECT orders.id, orders.status, COALESCE(orders.created_at, now())
FROM public.orders AS orders
WHERE NOT EXISTS (
  SELECT 1
  FROM public.order_status_history AS history
  WHERE history.order_id = orders.id
);

CREATE OR REPLACE FUNCTION public.admin_list_order_customers()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'super_admin'::public.app_role) OR
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'staff'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    users.id AS user_id,
    users.email::text AS email,
    profiles.full_name
  FROM auth.users AS users
  LEFT JOIN public.profiles AS profiles ON profiles.id = users.id
  ORDER BY COALESCE(profiles.full_name, users.email), users.email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_order_customers() TO authenticated;
