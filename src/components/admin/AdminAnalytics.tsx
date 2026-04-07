import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { IndianRupee, ShoppingBag, TrendingUp, Star } from "lucide-react";

interface DailyData {
  date: string;
  orders: number;
  revenue: number;
}

interface PopularItem {
  name: string;
  count: number;
}

const AdminAnalytics = () => {
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total_amount, created_at, status");

      if (orders) {
        setTotalOrders(orders.length);
        setTotalRevenue(orders.reduce((sum, o) => sum + (o.total_amount || 0), 0));

        // Daily aggregation (last 7 days)
        const daily: Record<string, { orders: number; revenue: number }> = {};
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split("T")[0];
          daily[key] = { orders: 0, revenue: 0 };
        }
        orders.forEach((o) => {
          const key = (o.created_at || "").split("T")[0];
          if (daily[key]) {
            daily[key].orders++;
            daily[key].revenue += o.total_amount || 0;
          }
        });
        setDailyData(
          Object.entries(daily).map(([date, v]) => ({
            date: new Date(date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
            orders: v.orders,
            revenue: v.revenue,
          }))
        );
      }

      // Popular items from order_items
      const { data: items } = await supabase
        .from("order_items")
        .select("name, quantity");

      if (items) {
        const counts: Record<string, number> = {};
        items.forEach((i) => {
          counts[i.name] = (counts[i.name] || 0) + i.quantity;
        });
        const sorted = Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
        setPopularItems(sorted);
      }
    } catch (err) {
      console.error("Analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-12">Loading analytics...</p>;
  }

  const chartConfig = {
    orders: { label: "Orders", color: "hsl(var(--primary))" },
    revenue: { label: "Revenue", color: "hsl(var(--accent))" },
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-xl font-bold text-card-foreground">{totalOrders}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold text-card-foreground">₹{totalRevenue.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Order</p>
              <p className="text-xl font-bold text-card-foreground">₹{totalOrders ? Math.round(totalRevenue / totalOrders).toLocaleString("en-IN") : 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Top Item</p>
              <p className="text-sm font-bold text-card-foreground truncate">{popularItems[0]?.name || "—"}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Orders Chart */}
      <Card className="p-4">
        <h3 className="font-heading font-semibold text-card-foreground mb-4">Daily Orders (Last 7 Days)</h3>
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

      {/* Daily Revenue Chart */}
      <Card className="p-4">
        <h3 className="font-heading font-semibold text-card-foreground mb-4">Daily Revenue (Last 7 Days)</h3>
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

      {/* Popular Items */}
      <Card className="p-4">
        <h3 className="font-heading font-semibold text-card-foreground mb-4">Top 5 Popular Items</h3>
        {popularItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No order data yet.</p>
        ) : (
          <div className="space-y-3">
            {popularItems.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary w-6">#{i + 1}</span>
                  <span className="text-sm text-card-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">{item.count} sold</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminAnalytics;
