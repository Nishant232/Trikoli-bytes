CREATE OR REPLACE FUNCTION public.validate_coupon_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.code := upper(btrim(NEW.code));

  IF NEW.code IS NULL OR NEW.code = '' THEN
    RAISE EXCEPTION 'Coupon code is required';
  END IF;

  IF NEW.discount_percent IS NULL OR NEW.discount_percent < 1 OR NEW.discount_percent > 100 THEN
    RAISE EXCEPTION 'Discount must be between 1 and 100 percent';
  END IF;

  IF NEW.min_order_amount IS NOT NULL AND NEW.min_order_amount < 0 THEN
    RAISE EXCEPTION 'Minimum order amount cannot be negative';
  END IF;

  IF NEW.max_uses IS NOT NULL AND NEW.max_uses < 1 THEN
    RAISE EXCEPTION 'Max uses must be at least 1';
  END IF;

  IF NEW.used_count IS NOT NULL AND NEW.used_count < 0 THEN
    RAISE EXCEPTION 'Used count cannot be negative';
  END IF;

  IF NEW.max_uses IS NOT NULL AND COALESCE(NEW.used_count, 0) > NEW.max_uses THEN
    RAISE EXCEPTION 'Used count cannot exceed max uses';
  END IF;

  IF TG_OP = 'INSERT' AND NEW.expires_at IS NOT NULL AND NEW.expires_at <= now() THEN
    RAISE EXCEPTION 'Expiry date must be in the future';
  END IF;

  IF TG_OP = 'UPDATE'
    AND NEW.expires_at IS DISTINCT FROM OLD.expires_at
    AND NEW.expires_at IS NOT NULL
    AND NEW.expires_at <= now() THEN
    RAISE EXCEPTION 'Expiry date must be in the future';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_coupon_fields_trigger ON public.coupons;
CREATE TRIGGER validate_coupon_fields_trigger
BEFORE INSERT OR UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.validate_coupon_fields();
