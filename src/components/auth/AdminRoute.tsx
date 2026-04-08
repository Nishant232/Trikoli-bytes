import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, dashboardRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Checking dashboard access...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ reason: "auth-required", from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (!dashboardRole) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ reason: "unauthorized", from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children;
};

export default AdminRoute;
