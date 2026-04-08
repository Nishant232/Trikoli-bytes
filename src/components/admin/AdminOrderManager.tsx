import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CreditCard, Mail, Package, Phone, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CustomerRecord {
  user_id: string;
  email: string | null;
  full_name: string | null;
}

interface OrderItem {
  id: string;
  image: string | null;
  name: string;
  price: number;
  quantity: number;
}

interface OrderStatusHistory {
  id: string;
  status: string;
  changed_at: string;
}

interface OrderRecord {
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
  updated_at: string | null;
  order_items: OrderItem[];
  order_status_history: OrderStatusHistory[];
}

const statuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
const paymentStatuses = ["pending", "paid", "failed"];

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const paymentLabels: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const paymentColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number | null) => `Rs. ${amount ?? 0}`;

const getPaymentMethodLabel = (paymentMethod: string | null) => {
  if (!paymentMethod) return "Not set";
  if (paymentMethod === "cod") return "Cash on delivery";
  if (paymentMethod === "online") return "Online payment";
  return paymentMethod.replace(/_/g, " ");
};

const AdminOrderManager = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [customers, setCustomers] = useState<Record<string, CustomerRecord>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);

    const [{ data: ordersData, error: ordersError }, { data: customersData, error: customersError }] =
      await Promise.all([
        supabase
          .from("orders")
          .select("*, order_items(*), order_status_history(*)")
          .order("created_at", { ascending: false }),
        supabase.rpc("admin_list_order_customers"),
      ]);

    if (ordersError) {
      toast({ title: "Unable to load orders", description: ordersError.message, variant: "destructive" });
      setOrders([]);
    } else {
      setOrders((ordersData as OrderRecord[]) || []);
    }

    if (customersError) {
      toast({
        title: "Unable to load customer details",
        description: customersError.message,
        variant: "destructive",
      });
      setCustomers({});
    } else {
      const nextCustomers = Object.fromEntries(
        ((customersData as CustomerRecord[]) || []).map((customer) => [customer.user_id, customer]),
      );
      setCustomers(nextCustomers);
    }

    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedOrderId = orderIdFilter.trim().toLowerCase();

    return orders.filter((order) => {
      const customer = order.user_id ? customers[order.user_id] : undefined;
      const shortOrderId = order.id.slice(0, 8).toLowerCase();
      const fullOrderId = order.id.toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        shortOrderId.includes(normalizedSearch) ||
        fullOrderId.includes(normalizedSearch) ||
        order.phone?.toLowerCase().includes(normalizedSearch) ||
        customer?.full_name?.toLowerCase().includes(normalizedSearch) ||
        customer?.email?.toLowerCase().includes(normalizedSearch);

      const matchesOrderId =
        normalizedOrderId.length === 0 ||
        shortOrderId.includes(normalizedOrderId) ||
        fullOrderId.includes(normalizedOrderId);

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesPayment = paymentStatusFilter === "all" || order.payment_status === paymentStatusFilter;
      const matchesDate = dateFilter.length === 0 || order.created_at?.slice(0, 10) === dateFilter;

      return Boolean(matchesSearch && matchesOrderId && matchesStatus && matchesPayment && matchesDate);
    });
  }, [customers, dateFilter, orderIdFilter, orders, paymentStatusFilter, searchTerm, statusFilter]);

  const updateOrderField = async (
    orderId: string,
    field: "status" | "payment_status",
    value: string,
  ) => {
    setUpdatingKey(`${field}:${orderId}`);

    const { error } = await supabase
      .from("orders")
      .update({ [field]: value })
      .eq("id", orderId);

    if (error) {
      toast({
        title: field === "status" ? "Status update failed" : "Payment update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title:
          field === "status"
            ? `Order moved to ${statusLabels[value] || value}`
            : `Payment marked as ${paymentLabels[value] || value}`,
      });
      await fetchOrders();
    }

    setUpdatingKey(null);
  };

  if (loading) return <p className="text-muted-foreground">Loading orders...</p>;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Orders ({filteredOrders.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Track items, customer details, status updates, and payment progress in one place.
          </p>
        </div>
        <Button variant="outline" onClick={fetchOrders}>
          Refresh Orders
        </Button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative md:col-span-2 xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by customer, phone, or order number"
            className="pl-9"
          />
        </div>
        <Input
          value={orderIdFilter}
          onChange={(event) => setOrderIdFilter(event.target.value)}
          placeholder="Filter by order id"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {statusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All payment states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payment states</SelectItem>
            {paymentStatuses.map((paymentStatus) => (
              <SelectItem key={paymentStatus} value={paymentStatus}>
                {paymentLabels[paymentStatus]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground md:col-span-1 xl:col-span-3">
          Use order status for kitchen and delivery flow. Payment status is ready for future online-payment handling.
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">No matching orders found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const customer = order.user_id ? customers[order.user_id] : undefined;
            const history = [...(order.order_status_history || [])].sort((a, b) =>
              a.changed_at.localeCompare(b.changed_at),
            );

            return (
              <div key={order.id} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-card-foreground">Order #{order.id.slice(0, 8)}</p>
                    <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <div className="min-w-0">
                        <p className="font-medium text-card-foreground">
                          {customer?.full_name || "Guest customer"}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{customer?.email || "No email available"}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{order.phone || "No phone"}</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>Placed: {formatDateTime(order.created_at)}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>Updated: {formatDateTime(order.updated_at)}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>{getPaymentMethodLabel(order.payment_method)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={statusColors[order.status] || "bg-muted text-muted-foreground"}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(paymentColors[order.payment_status || "pending"] || "bg-muted text-muted-foreground")}
                    >
                      Payment: {paymentLabels[order.payment_status || "pending"] || order.payment_status || "Pending"}
                    </Badge>
                  </div>
                </div>

                <div className="mb-4 grid gap-3 rounded-xl bg-muted/30 p-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                    <p className="font-semibold text-card-foreground">{formatCurrency(order.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Discount</p>
                    <p className="font-semibold text-card-foreground">{formatCurrency(order.discount_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Coupon</p>
                    <p className="font-semibold text-card-foreground">{order.coupon_code || "No coupon"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivery address</p>
                    <p className="font-semibold text-card-foreground">
                      {order.delivery_address || "No address provided"}
                    </p>
                  </div>
                </div>

                <div className="mb-4 grid gap-3 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium text-card-foreground">Order status</p>
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateOrderField(order.id, "status", value)}
                      disabled={updatingKey === `status:${order.id}`}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusLabels[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-card-foreground">Payment status</p>
                    <Select
                      value={order.payment_status || "pending"}
                      onValueChange={(value) => updateOrderField(order.id, "payment_status", value)}
                      disabled={updatingKey === `payment_status:${order.id}`}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentStatuses.map((paymentStatus) => (
                          <SelectItem key={paymentStatus} value={paymentStatus}>
                            {paymentLabels[paymentStatus]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value={`details-${order.id}`}>
                    <AccordionTrigger>View order items and status history</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-6 pt-2 lg:grid-cols-2">
                        <div>
                          <p className="mb-3 font-medium text-card-foreground">Order items</p>
                          <div className="space-y-2">
                            {order.order_items.length === 0 ? (
                              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                                No items found for this order.
                              </div>
                            ) : (
                              order.order_items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                                >
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="h-14 w-14 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
                                      <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-card-foreground">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Qty {item.quantity} x {formatCurrency(item.price)}
                                    </p>
                                  </div>
                                  <span className="text-sm font-semibold text-card-foreground">
                                    {formatCurrency(item.price * item.quantity)}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="mb-3 font-medium text-card-foreground">Status history</p>
                          <div className="space-y-3">
                            {history.length === 0 ? (
                              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                                No status history yet.
                              </div>
                            ) : (
                              history.map((entry, index) => (
                                <div key={entry.id} className="flex gap-3">
                                  <div className="flex flex-col items-center">
                                    <div className="mt-1 h-3 w-3 rounded-full bg-primary" />
                                    {index < history.length - 1 && <div className="mt-1 h-full w-px bg-border" />}
                                  </div>
                                  <div className="pb-2">
                                    <p className="font-medium text-card-foreground">
                                      {statusLabels[entry.status] || entry.status}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDateTime(entry.changed_at)}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrderManager;
