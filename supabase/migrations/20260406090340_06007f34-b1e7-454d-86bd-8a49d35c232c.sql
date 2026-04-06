
-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'Main Course',
  is_veg BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.0,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read available menu items
CREATE POLICY "Anyone can read menu items" ON public.menu_items
  FOR SELECT USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert menu items" ON public.menu_items
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update menu items" ON public.menu_items
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete menu items" ON public.menu_items
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for food images
INSERT INTO storage.buckets (id, name, public) VALUES ('food-images', 'food-images', true);

-- Storage policies
CREATE POLICY "Anyone can view food images" ON storage.objects
  FOR SELECT USING (bucket_id = 'food-images');

CREATE POLICY "Admins can upload food images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'food-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update food images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'food-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete food images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'food-images' AND public.has_role(auth.uid(), 'admin'));
