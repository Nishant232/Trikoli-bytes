import { useState } from "react";
import { menuItems, categories } from "@/data/menuData";
import MenuCard from "./MenuCard";

const MenuSection = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All" ? menuItems : menuItems.filter((i) => i.category === activeCategory);

  return (
    <section id="menu" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">Our Menu</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Handcrafted dishes made with love, fresh ingredients, and authentic spices.</p>
        </div>

        <div className="flex gap-2 justify-center flex-wrap mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-primary/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
