
-- Create order_status_history table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and admins can view order history"
  ON public.order_status_history FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "Users can view own order history"
  ON public.order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id AND o.user_id = auth.uid()
    )
  );

-- Trigger to record status changes
CREATE OR REPLACE FUNCTION public.record_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, status)
    VALUES (NEW.id, NEW.status);
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_status_change
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.record_order_status_change();

-- can_bootstrap_first_super_admin
CREATE OR REPLACE FUNCTION public.can_bootstrap_first_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'super_admin'
  )
$$;

-- bootstrap_first_super_admin
CREATE OR REPLACE FUNCTION public.bootstrap_first_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'super_admin');

  RETURN true;
END;
$$;

-- place_order function
CREATE OR REPLACE FUNCTION public.place_order(
  p_delivery_address text,
  p_phone text,
  p_payment_method text,
  p_coupon_code text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_total integer := 0;
  v_discount integer := 0;
  v_discount_percent integer := 0;
  v_item jsonb;
  v_menu record;
BEGIN
  -- Calculate total from menu items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_menu FROM public.menu_items
    WHERE id = (v_item->>'id')::uuid AND is_available = true AND deleted_at IS NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Menu item % not found or unavailable', v_item->>'id';
    END IF;

    v_total := v_total + (v_menu.price * (v_item->>'quantity')::integer);
  END LOOP;

  -- Apply coupon if provided
  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    SELECT discount_percent INTO v_discount_percent
    FROM public.coupons
    WHERE code = p_coupon_code
      AND is_active = true
      AND deleted_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses IS NULL OR used_count < max_uses)
      AND (min_order_amount IS NULL OR min_order_amount <= v_total);

    IF FOUND THEN
      v_discount := (v_total * v_discount_percent) / 100;
      UPDATE public.coupons SET used_count = used_count + 1 WHERE code = p_coupon_code;
    END IF;
  END IF;

  -- Create order
  INSERT INTO public.orders (user_id, total_amount, discount_amount, coupon_code, delivery_address, phone, payment_method, status, payment_status)
  VALUES (auth.uid(), v_total - v_discount, v_discount, p_coupon_code, p_delivery_address, p_phone, p_payment_method, 'pending', 'pending')
  RETURNING id INTO v_order_id;

  -- Create order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_menu FROM public.menu_items WHERE id = (v_item->>'id')::uuid;

    INSERT INTO public.order_items (order_id, menu_item_id, name, price, quantity, image)
    VALUES (v_order_id, v_menu.id::text, v_menu.name, v_menu.price, (v_item->>'quantity')::integer, v_menu.image_url);
  END LOOP;

  -- Record initial status
  INSERT INTO public.order_status_history (order_id, status)
  VALUES (v_order_id, 'pending');

  RETURN v_order_id;
END;
$$;

-- cancel_own_order function
CREATE OR REPLACE FUNCTION public.cancel_own_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
BEGIN
  SELECT * INTO v_order FROM public.orders
  WHERE id = p_order_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Order cannot be cancelled at this stage';
  END IF;

  UPDATE public.orders SET status = 'cancelled', updated_at = now()
  WHERE id = p_order_id;
END;
$$;
