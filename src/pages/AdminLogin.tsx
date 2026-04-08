import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Shield, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapEmail, setBootstrapEmail] = useState("");
  const { signIn, user, dashboardRole, authNotice, clearAuthNotice, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user && dashboardRole) {
      navigate("/admin", { replace: true });
    }
  }, [authLoading, dashboardRole, navigate, user]);

  useEffect(() => {
    const state = location.state as { reason?: string } | null;
    if (state?.reason === "unauthorized") {
      toast({
        title: "Dashboard access denied",
        description: "This account does not have staff or admin permissions.",
        variant: "destructive",
      });
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location, navigate, toast]);

  useEffect(() => {
    if (authNotice === "session_expired") {
      toast({
        title: "Admin session expired",
        description: "Please sign in again to continue.",
        variant: "destructive",
      });
      clearAuthNotice();
    }
  }, [authNotice, clearAuthNotice, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setBootstrapAvailable(false);

    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({ title: "Login failed", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const validRoles = (roles || []).map((row: { role: string }) => row.role);
    const hasAccess = validRoles.some((role) => ["super_admin", "admin", "staff"].includes(role));

    if (hasAccess) {
      navigate("/admin");
      setLoading(false);
      return;
    }

    const { data: canBootstrap, error: bootstrapError } = await supabase.rpc("can_bootstrap_first_super_admin");

    if (!bootstrapError && canBootstrap) {
      setBootstrapAvailable(true);
      setBootstrapEmail(user.email || email);
      toast({
        title: "First owner setup available",
        description: "This account can claim the first super admin access.",
      });
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    toast({
      title: "Access denied",
      description: "You do not have operations dashboard access.",
      variant: "destructive",
    });
    setLoading(false);
  };

  const handleBootstrap = async () => {
    setBootstrapLoading(true);

    const { data, error } = await supabase.rpc("bootstrap_first_super_admin");

    if (error || !data) {
      toast({
        title: "Bootstrap failed",
        description: error?.message || "Unable to create the first super admin.",
        variant: "destructive",
      });
      setBootstrapLoading(false);
      return;
    }

    toast({ title: "First owner access granted", description: "You are now the super admin." });
    navigate("/admin");
    setBootstrapLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-card-foreground">Operations Login</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              For super admin, managers, and staff
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-card-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@trilokibytes.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-3 text-center text-sm text-muted-foreground">
            Forgot your password?{" "}
            <button onClick={() => navigate("/auth?mode=reset")} className="font-medium text-primary hover:underline">
              Reset it here
            </button>
          </p>

          {bootstrapAvailable && (
            <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-card-foreground">First owner setup</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No super admin exists yet. Claim first-owner access for {bootstrapEmail}.
                  </p>
                  <Button onClick={handleBootstrap} disabled={bootstrapLoading} className="mt-3">
                    {bootstrapLoading ? "Claiming Access..." : "Claim First Owner Access"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Email verification must be completed before dashboard login.
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            For launch, enable 2FA on admin accounts later if your team needs stronger access control.
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            <a href="/" className="transition-colors hover:text-primary">Back to website</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
