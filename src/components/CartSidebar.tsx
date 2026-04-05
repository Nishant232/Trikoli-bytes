import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const CartSidebar = () => {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/40 z-50 animate-fade-in" onClick={() => setIsOpen(false)} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card z-50 shadow-2xl flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-heading text-lg font-bold text-card-foreground">Your Cart</h2>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <ShoppingBag className="h-12 w-12" />
            <p className="font-medium">Your cart is empty</p>
            <button onClick={() => setIsOpen(false)} className="text-primary text-sm font-medium hover:underline">Browse Menu</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 bg-muted/50 rounded-lg p-3">
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-card-foreground truncate">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">₹{item.price}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-sm text-card-foreground">₹{item.price * item.quantity}</span>
                    <button onClick={() => removeItem(item.id)} className="block mt-1 text-xs text-destructive hover:underline">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-card-foreground">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-semibold text-success">FREE</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-border pt-3">
                <span>Total</span>
                <span className="text-primary">₹{totalPrice}</span>
              </div>
              <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all">
                Place Order
              </button>
              <button onClick={clearCart} className="w-full py-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
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
