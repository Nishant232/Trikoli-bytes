import { useEffect, useState } from "react";
import { Tag, Clock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  min_order_amount: number | null;
  expires_at: string | null;
}

const Offers = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("coupons")
      .select("id, code, discount_percent, min_order_amount, expires_at")
      .eq("is_active", true)
      .is("deleted_at", null)
      .then(({ data }) => {
        setCoupons((data as Coupon[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <button onClick={() => navigate("/")} className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Menu
        </button>

        <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">Offers & Deals</h1>
        <p className="mb-8 text-muted-foreground">Grab these amazing deals before they expire!</p>

        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Loading offers...</p>
        ) : coupons.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-12 text-center">
            <Tag className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No active offers right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <span className="font-heading text-lg font-bold text-primary">{coupon.discount_percent}% OFF</span>
                </div>
                <p className="mb-3 font-mono text-xl font-bold tracking-wider text-foreground">{coupon.code}</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {coupon.min_order_amount != null && coupon.min_order_amount > 0 && (
                    <p>Min. order: ₹{coupon.min_order_amount}</p>
                  )}
                  {coupon.expires_at && (
                    <p className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Expires: {new Date(coupon.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Offers;
