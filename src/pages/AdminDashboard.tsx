import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, LogOut, UtensilsCrossed, ShoppingBag, Tag, Users } from "lucide-react";
import AdminMenuManager from "@/components/admin/AdminMenuManager";
import AdminOrderManager from "@/components/admin/AdminOrderManager";
import AdminCouponManager from "@/components/admin/AdminCouponManager";
import AdminUserManager from "@/components/admin/AdminUserManager";

type UserRole = "super_admin" | "admin" | "staff";

const AdminDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return;
      if (!user) {
        navigate("/admin/login");
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roles = (data || []).map((r: any) => r.role as string);
      const role = roles.includes("super_admin")
        ? "super_admin"
        : roles.includes("admin")
        ? "admin"
        : roles.includes("staff")
        ? "staff"
        : null;

      if (!role) {
        navigate("/admin/login");
        return;
      }
      setUserRole(role);
      setChecking(false);
    };
    checkAdmin();
  }, [user, authLoading, navigate]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!userRole) return null;

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-heading text-lg font-bold text-card-foreground">Triloki Bytes Admin</h1>
              <p className="text-xs text-muted-foreground">{user?.email} · <span className="capitalize">{userRole?.replace("_", " ")}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              View Site
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue={userRole === "staff" ? "orders" : "menu"} className="w-full">
          <TabsList className={`grid w-full max-w-lg ${userRole === "super_admin" ? "grid-cols-4" : userRole === "staff" ? "grid-cols-1" : "grid-cols-3"}`}>
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
                <Users className="h-4 w-4" /> Users
              </TabsTrigger>
            )}
          </TabsList>

          {userRole !== "staff" && (
            <TabsContent value="menu" className="mt-6">
              <AdminMenuManager userRole={userRole!} />
            </TabsContent>
          )}
          <TabsContent value="orders" className="mt-6">
            <AdminOrderManager />
          </TabsContent>
          {userRole !== "staff" && (
            <TabsContent value="coupons" className="mt-6">
              <AdminCouponManager userRole={userRole!} />
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
