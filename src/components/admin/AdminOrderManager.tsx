import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package } from "lucide-react";

interface Order {
  id: string;
  user_id: string | null;
  total_amount: number;
  discount_amount: number | null;
  coupon_code: string | null;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  delivery_address: string | null;
  phone: string | null;
  created_at: string | null;
}

const statuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminOrderManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Order status → ${newStatus.replace("_", " ")}` });
      fetchOrders();
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading orders...</p>;

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-foreground mb-4">Orders ({orders.length})</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Package className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">No orders yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    Order #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
                  </p>
                </div>
                <Badge className={statusColors[order.status] || "bg-muted text-muted-foreground"}>
                  {order.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-medium">₹{order.total_amount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment: </span>
                  <span className="font-medium uppercase">{order.payment_method || "—"}</span>
                </div>
                {order.delivery_address && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Address: </span>
                    <span>{order.delivery_address}</span>
                  </div>
                )}
                {order.phone && (
                  <div>
                    <span className="text-muted-foreground">Phone: </span>
                    <span>{order.phone}</span>
                  </div>
                )}
                {order.coupon_code && (
                  <div>
                    <span className="text-muted-foreground">Coupon: </span>
                    <span className="text-primary font-medium">{order.coupon_code}</span>
                    {order.discount_amount ? ` (-₹${order.discount_amount})` : ""}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Update status:</span>
                <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                  <SelectTrigger className="w-48 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrderManager;
