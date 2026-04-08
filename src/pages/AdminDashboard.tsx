import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, LogOut, UtensilsCrossed, ShoppingBag, Tag, Users, BarChart3 } from "lucide-react";
import AdminMenuManager from "@/components/admin/AdminMenuManager";
import AdminOrderManager from "@/components/admin/AdminOrderManager";
import AdminCouponManager from "@/components/admin/AdminCouponManager";
import AdminUserManager from "@/components/admin/AdminUserManager";
import AdminAnalytics from "@/components/admin/AdminAnalytics";

type UserRole = "super_admin" | "admin" | "staff";

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Manager",
  staff: "Staff",
};

const roleDescriptions: Record<UserRole, string> = {
  super_admin: "Full control over analytics, menu, coupons, orders, and staff access.",
  admin: "Manages menu, coupons, and daily order operations.",
  staff: "Handles incoming orders and delivery status updates only.",
};

const roleCapabilities: Record<UserRole, string[]> = {
  super_admin: ["Analytics", "Menu management", "Coupon management", "Order operations", "Staff access"],
  admin: ["Menu management", "Coupon management", "Order operations"],
  staff: ["Order operations"],
};

const AdminDashboard = () => {
  const { user, signOut, loading: authLoading, dashboardRole } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !dashboardRole) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setUserRole(dashboardRole);
    setChecking(false);
  }, [authLoading, dashboardRole, navigate, user]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!userRole) return null;

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const defaultTab =
    userRole === "staff" ? "orders" : userRole === "super_admin" ? "analytics" : "menu";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-heading text-lg font-bold text-card-foreground">
                Triloki Bytes Operations Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                {user?.email} · {roleLabels[userRole]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              View Site
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">{roleLabels[userRole]} Access</p>
              <h2 className="mt-1 font-heading text-2xl font-bold text-card-foreground">
                {userRole === "super_admin"
                  ? "Platform control center"
                  : userRole === "admin"
                    ? "Daily management workspace"
                    : "Order handling workspace"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {roleDescriptions[userRole]}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-card-foreground">Visible sections</p>
              <p className="mt-1">{roleCapabilities[userRole].join(" · ")}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList
            className={`grid w-full max-w-2xl ${
              userRole === "super_admin"
                ? "grid-cols-5"
                : userRole === "staff"
                  ? "grid-cols-1"
                  : "grid-cols-3"
            }`}
          >
            {userRole === "super_admin" && (
              <TabsTrigger value="analytics" className="flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4" /> Analytics
              </TabsTrigger>
            )}
            {userRole !== "staff" && (
              <TabsTrigger value="menu" className="flex items-center gap-1.5">
                <UtensilsCrossed className="h-4 w-4" /> Menu
              </TabsTrigger>
            )}
            <TabsTrigger value="orders" className="flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4" /> Orders
            </TabsTrigger>
            {userRole !== "staff" && (
              <TabsTrigger value="coupons" className="flex items-center gap-1.5">
                <Tag className="h-4 w-4" /> Coupons
              </TabsTrigger>
            )}
            {userRole === "super_admin" && (
              <TabsTrigger value="users" className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Staff Access
              </TabsTrigger>
            )}
          </TabsList>

          {userRole === "super_admin" && (
            <TabsContent value="analytics" className="mt-6">
              <AdminAnalytics />
            </TabsContent>
          )}

          {userRole !== "staff" && (
            <TabsContent value="menu" className="mt-6">
              <AdminMenuManager userRole={userRole} />
            </TabsContent>
          )}

          <TabsContent value="orders" className="mt-6">
            <AdminOrderManager />
          </TabsContent>

          {userRole !== "staff" && (
            <TabsContent value="coupons" className="mt-6">
              <AdminCouponManager userRole={userRole} />
            </TabsContent>
          )}

          {userRole === "super_admin" && (
            <TabsContent value="users" className="mt-6">
              <AdminUserManager />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
