-- Allow users to delete their own order items (for delivered orders)
CREATE POLICY "Users can delete own delivered order items"
ON public.order_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
      AND orders.status = 'delivered'
  )
);

-- Allow users to delete their own delivered orders
CREATE POLICY "Users can delete own delivered orders"
ON public.orders FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND status = 'delivered'
);