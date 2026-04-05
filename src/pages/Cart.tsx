import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Cart = () => {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some delicious items from our menu!</p>
          <Button onClick={() => navigate("/#menu")}>Browse Menu</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Continue Shopping
        </button>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-6">Your Cart</h1>

        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 bg-card rounded-xl p-4 border border-border shadow-[var(--shadow-card)]">
              <img src={item.image} alt={item.name} className="h-20 w-20 rounded-lg object-cover" loading="lazy" />
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-card-foreground">{item.name}</h3>
                <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-semibold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-right flex flex-col justify-between">
                <span className="font-bold text-card-foreground">₹{item.price * item.quantity}</span>
                <button onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-[var(--shadow-card)]">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">₹{totalPrice}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-muted-foreground">Delivery</span>
            <span className="font-semibold text-success">FREE</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-border pt-4 mb-6">
            <span>Total</span>
            <span className="text-primary">₹{totalPrice}</span>
          </div>
          <div className="flex gap-3">
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
