import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  discount_amount: number | null;
  coupon_code: string | null;
  delivery_address: string | null;
  payment_method: string | null;
  created_at: string | null;
  order_items: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) fetchOrders();
  }, [user, authLoading]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Menu
        </button>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-6">My Orders</h1>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No orders yet</p>
            <Button onClick={() => navigate("/#menu")}>Browse Menu</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-card rounded-xl p-5 border border-border shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="space-y-2 mb-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.image && <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />}
                      <span className="text-sm flex-1">{item.name} × {item.quantity}</span>
                      <span className="text-sm font-medium">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    {order.payment_method === "cod" ? "💵 Cash on Delivery" : "💳 Online Payment"}
                    {order.coupon_code && ` • Coupon: ${order.coupon_code}`}
                  </div>
                  <span className="font-bold text-primary">₹{order.total_amount}</span>
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

export default Orders;
