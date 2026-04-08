
-- Drop any existing policies on storage.objects for food-images to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view food images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload food images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update food images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete food images" ON storage.objects;

-- Public read access
CREATE POLICY "Anyone can view food images"
ON storage.objects FOR SELECT
USING (bucket_id = 'food-images');

-- Admin/super_admin upload
CREATE POLICY "Admins can upload food images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'food-images'
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- Admin/super_admin update
CREATE POLICY "Admins can update food images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'food-images'
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- Admin/super_admin delete
CREATE POLICY "Admins can delete food images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'food-images'
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);
