import { useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const CartSidebar = () => {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 animate-fade-in bg-foreground/40" onClick={() => setIsOpen(false)} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-heading text-lg font-bold text-card-foreground">Your Cart</h2>
          <button onClick={() => setIsOpen(false)} className="rounded-full p-1 transition-colors hover:bg-muted">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
            <ShoppingBag className="h-12 w-12" />
            <p className="font-medium">Your cart is empty</p>
            <button onClick={() => setIsOpen(false)} className="text-sm font-medium text-primary hover:underline">Browse Menu</button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-lg bg-muted/50 p-3">
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-card-foreground">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">₹{item.price}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-primary/10">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-primary/10">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-card-foreground">₹{item.price * item.quantity}</span>
                    <button onClick={() => removeItem(item.id)} className="mt-1 block text-xs text-destructive hover:underline">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3 border-t border-border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-card-foreground">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-semibold text-success">FREE</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">₹{totalPrice}</span>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/checkout");
                }}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-all hover:brightness-110"
              >
                Proceed to Checkout
              </button>
              <button onClick={clearCart} className="w-full py-2 text-sm text-muted-foreground transition-colors hover:text-destructive">
                Clear Cart
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
