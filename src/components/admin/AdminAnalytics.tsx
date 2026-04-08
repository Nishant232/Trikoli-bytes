import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Download, IndianRupee, ShoppingBag, TrendingUp, Users2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderRow {
  id: string;
  user_id: string | null;
  total_amount: number;
  created_at: string | null;
  status: string;
}

interface OrderItemRow {
  id: string;
  menu_item_id: string;
  name: string;
  order_id: string;
  quantity: number;
}

interface MenuItemRow {
  id: string;
  category: string;
}

interface CustomerRecord {
  user_id: string;
  email: string | null;
  full_name: string | null;
}

interface DailyData {
  date: string;
  orders: number;
  revenue: number;
}

interface RankingItem {
  label: string;
  value: number;
  sublabel?: string;
}

const formatCurrency = (value: number) => `Rs. ${value.toLocaleString("en-IN")}`;

const formatDateLabel = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { month: "short", day: "numeric" });

const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
};

const AdminAnalytics = () => {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [topCategories, setTopCategories] = useState<RankingItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<RankingItem[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    if (!startDate || !endDate) {
      toast({ title: "Choose both dates", variant: "destructive" });
      return;
    }

    if (startDate > endDate) {
      toast({ title: "Start date must be before end date", variant: "destructive" });
      return;
    }

    setLoading(true);

    const startIso = `${startDate}T00:00:00`;
    const endIso = `${endDate}T23:59:59`;

    try {
      const [
        { data: orders, error: ordersError },
        { data: orderItems, error: itemsError },
        { data: menuItems, error: menuError },
        { data: customers, error: customersError },
      ] = await Promise.all([
        supabase
          .from("orders")
          .select("id, user_id, total_amount, created_at, status")
          .gte("created_at", startIso)
          .lte("created_at", endIso)
          .order("created_at", { ascending: true }),
        supabase.from("order_items").select("id, order_id, menu_item_id, name, quantity"),
        supabase.from("menu_items").select("id, category"),
        supabase.rpc("admin_list_order_customers"),
      ]);

      if (ordersError) throw ordersError;
      if (itemsError) throw itemsError;
      if (menuError) throw menuError;
      if (customersError) throw customersError;

      const orderRows = (orders as OrderRow[]) || [];
      const nonCancelledOrders = orderRows.filter((order) => order.status !== "cancelled");
      const orderIdsInRange = new Set(orderRows.map((order) => order.id));
      const itemRows = ((orderItems as OrderItemRow[]) || []).filter((item) => orderIdsInRange.has(item.order_id));
      const menuById = Object.fromEntries(((menuItems as MenuItemRow[]) || []).map((item) => [item.id, item.category]));
      const customerById = Object.fromEntries(
        ((customers as CustomerRecord[]) || []).map((customer) => [customer.user_id, customer]),
      );

      setTotalOrders(orderRows.length);
      const revenue = nonCancelledOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      setTotalRevenue(revenue);
      setAverageOrderValue(nonCancelledOrders.length ? Math.round(revenue / nonCancelledOrders.length) : 0);

      const dayMap: Record<string, { orders: number; revenue: number }> = {};
      const cursor = new Date(`${startDate}T00:00:00`);
      const lastDay = new Date(`${endDate}T00:00:00`);
      while (cursor <= lastDay) {
        const key = cursor.toISOString().split("T")[0];
        dayMap[key] = { orders: 0, revenue: 0 };
        cursor.setDate(cursor.getDate() + 1);
      }

      orderRows.forEach((order) => {
        const key = (order.created_at || "").split("T")[0];
        if (!dayMap[key]) return;

        dayMap[key].orders += 1;
        if (order.status !== "cancelled") {
          dayMap[key].revenue += order.total_amount || 0;
        }
      });

      setDailyData(
        Object.entries(dayMap).map(([date, values]) => ({
          date: formatDateLabel(date),
          orders: values.orders,
          revenue: values.revenue,
        })),
      );

      const categoryCounts: Record<string, number> = {};
      itemRows.forEach((item) => {
        const category = menuById[item.menu_item_id] || "Uncategorized";
        categoryCounts[category] = (categoryCounts[category] || 0) + item.quantity;
      });

      setTopCategories(
        Object.entries(categoryCounts)
          .sort(([, left], [, right]) => right - left)
          .slice(0, 5)
          .map(([label, value]) => ({ label, value })),
      );

      const customerTotals: Record<string, { label: string; value: number; sublabel?: string }> = {};
      nonCancelledOrders.forEach((order) => {
        if (!order.user_id) return;
        const customer = customerById[order.user_id];
        const label = customer?.full_name || customer?.email || order.user_id.slice(0, 8);
        const sublabel = customer?.email || undefined;

        if (!customerTotals[order.user_id]) {
          customerTotals[order.user_id] = { label, value: 0, sublabel };
        }

        customerTotals[order.user_id].value += order.total_amount || 0;
      });

      setTopCustomers(
        Object.values(customerTotals)
          .sort((left, right) => right.value - left.value)
          .slice(0, 5),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load analytics.";
      toast({ title: "Analytics load failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate, toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportReport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Start Date", startDate],
      ["End Date", endDate],
      ["Total Orders", String(totalOrders)],
      ["Revenue Excluding Cancelled", String(totalRevenue)],
      ["Average Order Value", String(averageOrderValue)],
      [""],
      ["Daily Breakdown"],
      ["Date", "Orders", "Revenue"],
      ...dailyData.map((day) => [day.date, String(day.orders), String(day.revenue)]),
      [""],
      ["Top Categories"],
      ["Category", "Quantity Sold"],
      ...topCategories.map((entry) => [entry.label, String(entry.value)]),
      [""],
      ["Top Customers"],
      ["Customer", "Revenue", "Email"],
      ...topCustomers.map((entry) => [entry.label, String(entry.value), entry.sublabel || ""]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell = "") => `"${String(cell).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-report-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const chartConfig = {
    orders: { label: "Orders", color: "hsl(var(--primary))" },
    revenue: { label: "Revenue", color: "hsl(var(--accent))" },
  };

  if (loading) {
    return <p className="py-12 text-center text-muted-foreground">Loading analytics...</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="font-heading text-lg font-semibold text-card-foreground">Analytics Filters</h3>
            <p className="text-sm text-muted-foreground">
              Revenue excludes cancelled orders so the totals reflect actual completed business.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={fetchAnalytics}>
              Apply Range
            </Button>
            <Button variant="outline" onClick={exportReport}>
              <Download className="mr-1 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="mb-1 text-sm font-medium text-card-foreground">Start date</p>
            <Input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-card-foreground">End date</p>
            <Input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Top category</p>
            <p className="mt-1 font-semibold text-card-foreground">{topCategories[0]?.label || "-"}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Top customer</p>
            <p className="mt-1 font-semibold text-card-foreground">{topCustomers[0]?.label || "-"}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Orders in range</p>
              <p className="text-xl font-bold text-card-foreground">{totalOrders}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <IndianRupee className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-xl font-bold text-card-foreground">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg order</p>
              <p className="text-xl font-bold text-card-foreground">{formatCurrency(averageOrderValue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Top customer spend</p>
              <p className="text-xl font-bold text-card-foreground">
                {topCustomers[0] ? formatCurrency(topCustomers[0].value) : "-"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-4 font-heading font-semibold text-card-foreground">Orders by Day</h3>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>

      <Card className="p-4">
        <h3 className="mb-4 font-heading font-semibold text-card-foreground">Revenue by Day</h3>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-4 font-heading font-semibold text-card-foreground">Top Categories</h3>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No category sales in this date range.</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map((entry, index) => (
                <div key={entry.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-sm font-bold text-primary">#{index + 1}</span>
                    <span className="text-sm text-card-foreground">{entry.label}</span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{entry.value} sold</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="mb-4 font-heading font-semibold text-card-foreground">Top Customers</h3>
          {topCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customer revenue in this date range.</p>
          ) : (
            <div className="space-y-3">
              {topCustomers.map((entry, index) => (
                <div key={`${entry.label}-${index}`} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-sm font-bold text-primary">#{index + 1}</span>
                      <span className="text-sm text-card-foreground">{entry.label}</span>
                    </div>
                    {entry.sublabel && <p className="pl-9 text-xs text-muted-foreground">{entry.sublabel}</p>}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
