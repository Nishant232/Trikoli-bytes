import { Plus, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import type { MenuItem } from "@/types/menu";

const MenuCard = ({ item }: { item: MenuItem }) => {
  const { addItem } = useCart();
  const navigate = useNavigate();

  return (
    <div className={`group overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] ${!item.isAvailable ? "opacity-75" : ""}`}>
      <div className="relative h-48 cursor-pointer overflow-hidden" onClick={() => navigate(`/product/${item.id}`)}>
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          width={640}
          height={640}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {item.isPopular && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            Popular
          </span>
        )}
        {!item.isAvailable && (
          <span className="absolute bottom-3 left-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
            Currently Unavailable
          </span>
        )}
        <span className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded border-2 text-[8px] font-bold ${item.isVeg ? "border-success text-success" : "border-accent text-accent"}`}>
          ●
        </span>
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-start justify-between">
          <h3 className="cursor-pointer font-heading font-semibold text-card-foreground transition-colors hover:text-primary" onClick={() => navigate(`/product/${item.id}`)}>
            {item.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            {item.rating}
          </div>
        </div>
        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-card-foreground">₹{item.price}</span>
          <button
            onClick={() => item.isAvailable && addItem({ id: item.id, name: item.name, price: item.price, image: item.image })}
            disabled={!item.isAvailable}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            <Plus className="h-4 w-4" /> {item.isAvailable ? "Add" : "View"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
