import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

const Cart = () => {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">Your cart is empty</h1>
          <p className="mb-6 text-muted-foreground">Add some delicious items from our menu!</p>
          <Button onClick={() => navigate("/#menu")}>Browse Menu</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <button onClick={() => navigate("/")} className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Continue Shopping
        </button>

        <h1 className="mb-6 font-heading text-3xl font-bold text-foreground">Your Cart</h1>

        <div className="mb-8 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row">
              <img src={item.image} alt={item.name} className="h-24 w-full rounded-lg object-cover sm:h-20 sm:w-20" loading="lazy" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading font-semibold text-card-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-destructive transition-colors hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-primary/10">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-primary/10">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="font-bold text-card-foreground">₹{item.price * item.quantity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">₹{totalPrice}</span>
          </div>
          <div className="mb-4 flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span className="font-semibold text-success">FREE</span>
          </div>
          <div className="mb-6 flex justify-between border-t border-border pt-4 text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">₹{totalPrice}</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={clearCart} className="flex-1">Clear Cart</Button>
            <Button onClick={() => navigate("/checkout")} className="flex-1">Proceed to Checkout</Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cart;
