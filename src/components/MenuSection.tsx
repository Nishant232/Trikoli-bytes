import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mapMenuItemRow } from "@/lib/menu";
import type { Tables } from "@/integrations/supabase/types";
import MenuCard from "./MenuCard";

const MenuSection = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [items, setItems] = useState<Tables<"menu_items">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      setError(null);

      const { data, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .is("deleted_at", null)
        .order("is_available", { ascending: false })
        .order("is_popular", { ascending: false })
        .order("name", { ascending: true });

      if (menuError) {
        setError(menuError.message);
        setItems([]);
      } else {
        setItems(data || []);
      }

      setLoading(false);
    };

    fetchMenuItems();
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((item) => item.category))).sort()],
    [items],
  );

  const filteredItems = useMemo(() => {
    const visibleItems = items.map(mapMenuItemRow);
    return activeCategory === "All"
      ? visibleItems
      : visibleItems.filter((item) => item.category === activeCategory);
  }, [activeCategory, items]);

  return (
    <section id="menu" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">Our Menu</h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            Handcrafted dishes made with love, fresh ingredients, and authentic spices.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Unavailable dishes are shown for reference and cannot be ordered right now.
          </p>
        </div>

        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeCategory === category
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-primary/10"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            Loading menu...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center text-destructive">
            Unable to load menu right now. {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            No dishes found in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MenuSection;
