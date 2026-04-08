DROP POLICY IF EXISTS "Admins can read all menu items" ON public.menu_items;

CREATE POLICY "Admins can read all menu items"
ON public.menu_items FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE OR REPLACE FUNCTION public.place_order(
  p_delivery_address text,
  p_phone text,
  p_payment_method text DEFAULT 'cod',
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
  v_subtotal integer := 0;
  v_discount integer := 0;
  v_final_total integer := 0;
  v_coupon public.coupons%ROWTYPE;
  v_item jsonb;
  v_menu_item public.menu_items%ROWTYPE;
  v_quantity integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := COALESCE((v_item ->> 'quantity')::integer, 0);

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;

    SELECT *
    INTO v_menu_item
    FROM public.menu_items
    WHERE id = (v_item ->> 'id')::uuid
      AND deleted_at IS NULL
      AND is_available = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'One or more menu items are unavailable';
    END IF;

    v_subtotal := v_subtotal + (v_menu_item.price * v_quantity);
  END LOOP;

  IF p_coupon_code IS NOT NULL AND btrim(p_coupon_code) <> '' THEN
    SELECT *
    INTO v_coupon
    FROM public.coupons
    WHERE upper(code) = upper(btrim(p_coupon_code))
      AND is_active = true
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid coupon';
    END IF;

    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
      RAISE EXCEPTION 'Coupon expired';
    END IF;

    IF v_coupon.max_uses IS NOT NULL AND COALESCE(v_coupon.used_count, 0) >= v_coupon.max_uses THEN
      RAISE EXCEPTION 'Coupon usage limit reached';
    END IF;

    IF COALESCE(v_coupon.min_order_amount, 0) > v_subtotal THEN
      RAISE EXCEPTION 'Minimum order amount not met';
    END IF;

    v_discount := ROUND((v_subtotal * v_coupon.discount_percent) / 100.0);
  END IF;

  v_final_total := GREATEST(v_subtotal - v_discount, 0);

  INSERT INTO public.orders (
    user_id,
    total_amount,
    discount_amount,
    coupon_code,
    delivery_address,
    phone,
    payment_method,
    status,
    payment_status
  )
  VALUES (
    auth.uid(),
    v_final_total,
    v_discount,
    CASE
      WHEN p_coupon_code IS NULL OR btrim(p_coupon_code) = '' THEN NULL
      ELSE upper(btrim(p_coupon_code))
    END,
    p_delivery_address,
    p_phone,
    COALESCE(NULLIF(p_payment_method, ''), 'cod'),
    'pending',
    'pending'
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := COALESCE((v_item ->> 'quantity')::integer, 0);

    SELECT *
    INTO v_menu_item
    FROM public.menu_items
    WHERE id = (v_item ->> 'id')::uuid;

    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      name,
      price,
      quantity,
      image
    )
    VALUES (
      v_order_id,
      v_menu_item.id::text,
      v_menu_item.name,
      v_menu_item.price,
      v_quantity,
      v_menu_item.image_url
    );
  END LOOP;

  IF p_coupon_code IS NOT NULL AND btrim(p_coupon_code) <> '' THEN
    UPDATE public.coupons
    SET used_count = COALESCE(used_count, 0) + 1
    WHERE id = v_coupon.id;
  END IF;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(text, text, text, text, jsonb) TO authenticated;
