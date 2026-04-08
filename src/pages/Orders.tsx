import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Package, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  updated_at: string | null;
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

const timelineStatuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"];

const statusLabels: Record<string, string> = {
  pending: "Order received",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [authLoading, navigate, user]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    const { data, error: ordersError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (ordersError) {
      setError(ordersError.message);
      setOrders([]);
    } else {
      setOrders((data as Order[]) || []);
    }

    setLoading(false);
  };

  const cancelOrder = async (orderId: string) => {
    const confirmed = confirm("Cancel this order? You can only cancel before preparation starts.");
    if (!confirmed) return;

    setCancellingId(orderId);
    const { error: cancelError } = await supabase.rpc("cancel_own_order", {
      p_order_id: orderId,
    });

    if (cancelError) {
      toast({ title: "Unable to cancel order", description: cancelError.message, variant: "destructive" });
    } else {
      toast({ title: "Order cancelled" });
      fetchOrders();
    }
    setCancellingId(null);
  };

  const canCancelOrder = (status: string) => ["pending", "confirmed"].includes(status);

  const emptyState = useMemo(
    () => (
      <div className="py-12 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="mb-4 text-muted-foreground">No orders yet</p>
        <Button onClick={() => navigate("/#menu")}>Browse Menu</Button>
      </div>
    ),
    [navigate],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <button onClick={() => navigate("/")} className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Menu
        </button>

        <h1 className="mb-6 font-heading text-3xl font-bold text-foreground">My Orders</h1>

        {loading ? (
          <div className="rounded-xl border border-border bg-card py-12 text-center text-muted-foreground">
            Loading orders...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 py-12 text-center">
            <p className="text-destructive">Unable to load orders. {error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchOrders}>Try Again</Button>
          </div>
        ) : orders.length === 0 ? (
          emptyState
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const currentIndex = timelineStatuses.indexOf(order.status);

              return (
                <div key={order.id} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                      {canCancelOrder(order.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                        >
                          {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 rounded-lg bg-muted/40 p-3">
                    <p className="mb-3 text-sm font-medium text-card-foreground">Order Tracking</p>
                    {order.status === "cancelled" ? (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <XCircle className="h-4 w-4" />
                        This order was cancelled before preparation started.
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-5">
                        {timelineStatuses.map((status, index) => {
                          const completed = currentIndex >= index;
                          const active = order.status === status;

                          return (
                            <div key={status} className="flex items-center gap-2 sm:flex-col sm:items-start">
                              <div className={`h-3 w-3 rounded-full ${completed ? "bg-primary" : "bg-border"} ${active ? "ring-4 ring-primary/20" : ""}`} />
                              <div>
                                <p className={`text-xs font-medium ${completed ? "text-card-foreground" : "text-muted-foreground"}`}>
                                  {statusLabels[status]}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mb-3 space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-lg bg-muted/30 p-2">
                        {item.image && <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />}
                        <span className="flex-1 text-sm">{item.name} x {item.quantity}</span>
                        <span className="text-sm font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>{order.payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}</p>
                      {order.coupon_code && <p>Coupon: {order.coupon_code}</p>}
                      {order.delivery_address && (
                        <div className="flex items-start gap-1">
                          <MapPin className="mt-0.5 h-3.5 w-3.5" />
                          <span>{order.delivery_address}</span>
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-primary">₹{order.total_amount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Orders;
