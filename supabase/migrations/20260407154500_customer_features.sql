CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_item_unique
ON public.reviews (user_id, menu_item_id);

CREATE OR REPLACE FUNCTION public.cancel_own_order(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'This order can no longer be cancelled';
  END IF;

  UPDATE public.orders
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_own_order(uuid) TO authenticated;
