import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Tag } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CouponPreview {
  code: string;
  discount_percent: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number | null;
  expires_at: string | null;
}

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    if (user && items.length === 0 && !orderPlaced) {
      navigate("/cart", { replace: true });
    }
  }, [items.length, navigate, orderPlaced, user]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("address, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setAddress(data.address || "");
        setPhone(data.phone || "");
      }

      setProfileLoading(false);
    };

    loadProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 font-heading text-2xl font-bold text-foreground">Please sign in to checkout</h1>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !orderPlaced) {
    return null;
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    const { data, error } = await supabase
      .from("coupons")
      .select("code, discount_percent, min_order_amount, max_uses, used_count, expires_at")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      toast({ title: "Invalid coupon", description: "This coupon code does not exist or is inactive.", variant: "destructive" });
      return;
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast({ title: "Coupon expired", variant: "destructive" });
      return;
    }

    if (data.max_uses !== null && (data.used_count || 0) >= data.max_uses) {
      toast({ title: "Coupon limit reached", description: "This coupon is no longer available.", variant: "destructive" });
      return;
    }

    if (data.min_order_amount && totalPrice < data.min_order_amount) {
      toast({
        title: "Minimum not met",
        description: `Minimum order of ₹${data.min_order_amount} required.`,
        variant: "destructive",
      });
      return;
    }

    const discountAmount = Math.round((totalPrice * data.discount_percent) / 100);
    setDiscount(discountAmount);
    setAppliedCoupon(data);
    toast({
      title: `${data.discount_percent}% off applied`,
      description: `You save ₹${discountAmount}`,
    });
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

    await supabase.from("profiles").upsert({
      id: user.id,
      address: address.trim(),
      phone,
    });

    const { data, error } = await supabase.rpc("place_order", {
      p_delivery_address: address.trim(),
      p_phone: phone,
      p_payment_method: "cod",
      p_coupon_code: appliedCoupon?.code || null,
      p_items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
    });

    if (error || !data) {
      toast({
        title: "Order failed",
        description: error?.message || "Something went wrong while placing your order.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    clearCart();
    setOrderPlaced(true);
    setLoading(false);
    toast({ title: "Order placed!", description: "Your order is being prepared." });
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-md px-4 py-20 text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-success" />
          <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">Order Confirmed!</h1>
          <p className="mb-6 text-muted-foreground">Your food is being prepared. Track your order in My Orders.</p>
          <div className="flex justify-center gap-3">
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
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <button onClick={() => navigate("/cart")} className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Cart
        </button>

        <h1 className="mb-6 font-heading text-3xl font-bold text-foreground">Checkout</h1>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 font-heading text-lg font-semibold text-card-foreground">Delivery Details</h2>
            {profileLoading ? (
              <p className="text-sm text-muted-foreground">Loading saved delivery details...</p>
            ) : (
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
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 font-heading text-lg font-semibold text-card-foreground">
              <Tag className="mr-2 inline h-4 w-4" />Apply Coupon
            </h2>
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg bg-success/10 p-3">
                <span className="text-sm font-medium text-success">Applied {appliedCoupon.code} - ₹{discount} off</span>
                <button onClick={() => { setAppliedCoupon(null); setDiscount(0); }} className="text-xs text-destructive hover:underline">Remove</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  maxLength={20}
                />
                <Button variant="outline" onClick={applyCoupon}>Apply</Button>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Try: WELCOME10, TRILOKI20, FOODIE15</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 font-heading text-lg font-semibold text-card-foreground">Order Summary</h2>
            <div className="mb-4 space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                  <span className="font-medium">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-border pt-3">
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
                <span className="font-medium text-success">FREE</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">₹{finalTotal}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 font-heading text-lg font-semibold text-card-foreground">Payment Method</h2>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <span className="text-lg">Cash</span>
              <div>
                <p className="text-sm font-medium text-card-foreground">Cash on Delivery</p>
                <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
              </div>
            </div>
          </div>

          <Button onClick={placeOrder} disabled={loading || profileLoading} className="w-full py-6 text-lg">
            {loading ? "Placing Order..." : `Place Order - ₹${finalTotal}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
