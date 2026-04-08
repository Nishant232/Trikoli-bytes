import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type DashboardRole = "super_admin" | "admin" | "staff" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: string[];
  dashboardRole: DashboardRole;
  isDashboardUser: boolean;
  authNotice: "session_expired" | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  refreshRoles: (userId?: string | null) => Promise<void>;
  clearAuthNotice: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [dashboardRole, setDashboardRole] = useState<DashboardRole>(null);
  const [authNotice, setAuthNotice] = useState<"session_expired" | null>(null);
  const [loading, setLoading] = useState(true);
  const hasInitializedRef = useRef(false);
  const manualSignOutRef = useRef(false);

  const refreshRoles = useCallback(async (userId?: string | null) => {
    if (!userId) {
      setRoles([]);
      setDashboardRole(null);
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const nextRoles = (data || []).map((row: { role: string }) => row.role);
    const nextDashboardRole: DashboardRole = nextRoles.includes("super_admin")
      ? "super_admin"
      : nextRoles.includes("admin")
        ? "admin"
        : nextRoles.includes("staff")
          ? "staff"
          : null;

    setRoles(nextRoles);
    setDashboardRole(nextDashboardRole);
  }, []);

  const applySession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user) {
      await refreshRoles(nextSession.user.id);
    } else {
      setRoles([]);
      setDashboardRole(null);
    }

    setLoading(false);
  }, [refreshRoles]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT" && hasInitializedRef.current && !manualSignOutRef.current) {
        setAuthNotice("session_expired");
      }

      if (event === "SIGNED_OUT") {
        manualSignOutRef.current = false;
      }

      void applySession(nextSession);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session).finally(() => {
        hasInitializedRef.current = true;
      });
    });

    return () => subscription.unsubscribe();
  }, [applySession]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    setAuthNotice(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });

    return { error: error as Error | null };
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=recovery`,
    });

    return { error: error as Error | null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error as Error | null };
  };

  const clearAuthNotice = () => {
    setAuthNotice(null);
  };

  const signOut = async () => {
    manualSignOutRef.current = true;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        dashboardRole,
        isDashboardUser: Boolean(dashboardRole),
        authNotice,
        loading,
        signUp,
        signIn,
        resendVerificationEmail,
        requestPasswordReset,
        updatePassword,
        refreshRoles,
        clearAuthNotice,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
