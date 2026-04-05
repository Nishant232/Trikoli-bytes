import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Tag, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-4">Please sign in to checkout</h1>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !orderPlaced) {
    navigate("/cart");
    return null;
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      toast({ title: "Invalid coupon", description: "This coupon code doesn't exist or is expired.", variant: "destructive" });
      return;
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast({ title: "Coupon expired", variant: "destructive" });
      return;
    }

    if (data.min_order_amount && totalPrice < data.min_order_amount) {
      toast({ title: "Minimum not met", description: `Minimum order of ₹${data.min_order_amount} required.`, variant: "destructive" });
      return;
    }

    const discountAmount = Math.round(totalPrice * data.discount_percent / 100);
    setDiscount(discountAmount);
    setAppliedCoupon(data.code);
    toast({ title: `🎉 ${data.discount_percent}% off applied!`, description: `You save ₹${discountAmount}` });
  };

  const finalTotal = totalPrice - discount;

  const placeOrder = async () => {
    if (!address.trim() || !phone.trim()) {
      toast({ title: "Missing details", description: "Please fill in address and phone.", variant: "destructive" });
      return;
    }
    if (phone.length < 10) {
      toast({ title: "Invalid phone", description: "Please enter a valid phone number.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: finalTotal,
        discount_amount: discount,
        coupon_code: appliedCoupon || null,
        delivery_address: address,
        phone,
        payment_method: "cod",
        status: "pending",
      })
      .select()
      .single();

    if (orderError || !order) {
      toast({ title: "Order failed", description: orderError?.message || "Something went wrong.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    }));

    await supabase.from("order_items").insert(orderItems);

    clearCart();
    setOrderPlaced(true);
    setLoading(false);
    toast({ title: "Order placed! 🎉", description: "Your order is being prepared." });
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-6">Your food is being prepared. Track your order in My Orders.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/orders")}>My Orders</Button>
            <Button onClick={() => navigate("/")}>Back to Menu</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <button onClick={() => navigate("/cart")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Cart
        </button>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-6">Checkout</h1>

        <div className="space-y-6">
          {/* Delivery Details */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-[var(--shadow-card)]">
            <h2 className="font-heading font-semibold text-lg text-card-foreground mb-4">Delivery Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-card-foreground">Delivery Address</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address"
                  className="mt-1"
                  maxLength={500}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-card-foreground">Phone Number</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Coupon */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-[var(--shadow-card)]">
            <h2 className="font-heading font-semibold text-lg text-card-foreground mb-4">
              <Tag className="inline h-4 w-4 mr-2" />Apply Coupon
            </h2>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-success/10 p-3 rounded-lg">
                <span className="text-sm font-medium text-success">✅ {appliedCoupon} applied — ₹{discount} off</span>
                <button onClick={() => { setAppliedCoupon(""); setDiscount(0); }} className="text-xs text-destructive hover:underline">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  maxLength={20}
                />
                <Button variant="outline" onClick={applyCoupon}>Apply</Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">Try: WELCOME10, TRILOKI20, FOODIE15</p>
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-[var(--shadow-card)]">
            <h2 className="font-heading font-semibold text-lg text-card-foreground mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                  <span className="font-medium">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{totalPrice}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-success font-medium">FREE</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-border pt-3">
                <span>Total</span>
                <span className="text-primary">₹{finalTotal}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-[var(--shadow-card)]">
            <h2 className="font-heading font-semibold text-lg text-card-foreground mb-3">Payment Method</h2>
            <div className="bg-muted/50 p-3 rounded-lg flex items-center gap-3">
              <span className="text-lg">💵</span>
              <div>
                <p className="font-medium text-sm text-card-foreground">Cash on Delivery</p>
                <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
              </div>
            </div>
          </div>

          <Button onClick={placeOrder} disabled={loading} className="w-full py-6 text-lg">
            {loading ? "Placing Order..." : `Place Order — ₹${finalTotal}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
