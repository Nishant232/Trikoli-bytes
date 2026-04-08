import type { Tables } from "@/integrations/supabase/types";
import type { MenuItem } from "@/types/menu";

type MenuItemRow = Tables<"menu_items">;

export const mapMenuItemRow = (item: MenuItemRow): MenuItem => ({
  id: item.id,
  name: item.name,
  description: item.description || "Freshly prepared and served hot.",
  price: item.price,
  image: item.image_url || "/placeholder.svg",
  category: item.category,
  isVeg: item.is_veg,
  rating: Number(item.rating),
  isPopular: item.is_popular,
  isAvailable: item.is_available,
});
