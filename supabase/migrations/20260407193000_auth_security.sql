DROP POLICY IF EXISTS "Admins can upload food images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update food images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete food images" ON storage.objects;

CREATE POLICY "Managers can upload food images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'food-images'
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role) OR
    public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

CREATE POLICY "Managers can update food images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'food-images'
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role) OR
    public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

CREATE POLICY "Managers can delete food images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'food-images'
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role) OR
    public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);
