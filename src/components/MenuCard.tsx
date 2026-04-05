import { Plus, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import type { MenuItem } from "@/data/menuData";

const MenuCard = ({ item }: { item: MenuItem }) => {
  const { addItem } = useCart();
  const navigate = useNavigate();

  return (
    <div className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 shadow-[var(--shadow-card)]">
      <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => navigate(`/product/${item.id}`)}>
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          width={640}
          height={640}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {item.isPopular && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
            🔥 Popular
          </span>
        )}
        <span className={`absolute top-3 right-3 h-5 w-5 rounded border-2 flex items-center justify-center text-[8px] font-bold ${item.isVeg ? "border-success text-success" : "border-accent text-accent"}`}>
          ●
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-heading font-semibold text-card-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/product/${item.id}`)}>
            {item.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            {item.rating}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-card-foreground">₹{item.price}</span>
          <button
            onClick={() => addItem({ id: item.id, name: item.name, price: item.price, image: item.image })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
