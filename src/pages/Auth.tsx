import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, MailCheck, KeyRound } from "lucide-react";
import logoLight from "@/assets/logo-light.png";

type AuthMode = "login" | "signup" | "reset" | "recovery";

const getInitialMode = (searchParams: URLSearchParams) => {
  const mode = searchParams.get("mode");
  if (mode === "reset" || mode === "recovery") return mode;
  return "login";
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    user,
    loading: authLoading,
    signIn,
    signUp,
    resendVerificationEmail,
    requestPasswordReset,
    updatePassword,
    authNotice,
    clearAuthNotice,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(() => getInitialMode(searchParams));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSignupEmail, setLastSignupEmail] = useState("");
  const [lastResetEmail, setLastResetEmail] = useState("");

  const from = useMemo(() => {
    const state = location.state as { from?: string; reason?: string } | null;
    return state?.from || "/";
  }, [location.state]);

  useEffect(() => {
    setMode(getInitialMode(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const recoveryFromHash = window.location.hash.includes("type=recovery");
    if (recoveryFromHash) {
      setMode("recovery");
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && mode !== "recovery") {
      navigate(from, { replace: true });
    }
  }, [authLoading, from, mode, navigate, user]);

  useEffect(() => {
    const state = location.state as { reason?: string } | null;
    if (state?.reason === "auth-required") {
      toast({
        title: "Please sign in",
        description: "You need an account session to continue.",
      });
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location, navigate, toast]);

  useEffect(() => {
    if (authNotice === "session_expired") {
      toast({
        title: "Session expired",
        description: "Please sign in again to continue.",
        variant: "destructive",
      });
      clearAuthNotice();
    }
  }, [authNotice, clearAuthNotice, toast]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Signed in successfully" });
        navigate(from, { replace: true });
      }
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      if (!fullName.trim()) {
        toast({ title: "Name required", description: "Please enter your full name.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        setLastSignupEmail(email);
        toast({
          title: "Account created",
          description: "Check your inbox and verify your email before signing in.",
        });
        setMode("login");
      }
      setLoading(false);
      return;
    }

    if (mode === "reset") {
      const { error } = await requestPasswordReset(email);
      if (error) {
        toast({ title: "Reset email failed", description: error.message, variant: "destructive" });
      } else {
        setLastResetEmail(email);
        toast({
          title: "Reset email sent",
          description: "Open the email link to choose a new password.",
        });
      }
      setLoading(false);
      return;
    }

    const { error } = await updatePassword(password);
    if (error) {
      toast({ title: "Password update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "You can now sign in with the new password." });
      window.history.replaceState({}, document.title, "/auth");
      setMode("login");
      setPassword("");
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    const targetEmail = lastSignupEmail || email;
    if (!targetEmail) {
      toast({ title: "Enter your email first", variant: "destructive" });
      return;
    }

    const { error } = await resendVerificationEmail(targetEmail);
    if (error) {
      toast({ title: "Unable to resend email", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Verification email sent", description: `Sent to ${targetEmail}.` });
    }
  };

  const title =
    mode === "signup"
      ? "Create Account"
      : mode === "reset"
        ? "Reset Password"
        : mode === "recovery"
          ? "Choose New Password"
          : "Welcome Back";

  const subtitle =
    mode === "signup"
      ? "Create your account and verify your email before ordering."
      : mode === "reset"
        ? "We will send you a secure password reset email."
        : mode === "recovery"
          ? "Set a new password to finish your recovery flow."
          : "Sign in to view orders and continue checkout.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate("/")} className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to menu
        </button>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="mb-6 text-center">
            <img src={logoLight} alt="Triloki Bytes" className="mx-auto h-14 w-auto mb-3" />
            <h1 className="mt-2 font-heading text-2xl font-bold text-card-foreground">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-sm font-medium text-card-foreground">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="John Doe"
                  className="mt-1"
                  maxLength={100}
                />
              </div>
            )}

            {mode !== "recovery" && (
              <div>
                <label className="text-sm font-medium text-card-foreground">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="mt-1"
                  required
                  maxLength={255}
                />
              </div>
            )}

            {mode !== "reset" && (
              <div>
                <label className="text-sm font-medium text-card-foreground">
                  {mode === "recovery" ? "New Password" : "Password"}
                </label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    maxLength={72}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "signup"
                  ? "Create Account"
                  : mode === "reset"
                    ? "Send Reset Email"
                    : mode === "recovery"
                      ? "Update Password"
                      : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-sm">
            {mode === "login" && (
              <>
                <p className="text-center text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <button onClick={() => switchMode("signup")} className="font-medium text-primary hover:underline">
                    Sign up
                  </button>
                </p>
                <p className="text-center text-muted-foreground">
                  Forgot your password?{" "}
                  <button onClick={() => switchMode("reset")} className="font-medium text-primary hover:underline">
                    Reset it
                  </button>
                </p>
              </>
            )}

            {mode === "signup" && (
              <p className="text-center text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => switchMode("login")} className="font-medium text-primary hover:underline">
                  Sign in
                </button>
              </p>
            )}

            {(mode === "reset" || mode === "recovery") && (
              <p className="text-center text-muted-foreground">
                Back to{" "}
                <button onClick={() => switchMode("login")} className="font-medium text-primary hover:underline">
                  sign in
                </button>
              </p>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <MailCheck className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-card-foreground">Email verification</p>
                <p className="mt-1">
                  After sign-up, open the verification email, confirm the account, then return here to sign in.
                </p>
                <button onClick={handleResendVerification} className="mt-2 font-medium text-primary hover:underline">
                  Resend verification email
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2">
              <KeyRound className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-card-foreground">Testing checklist</p>
                <p className="mt-1">Test sign-up, verify the email, request a reset link, and complete a password change once before launch.</p>
              </div>
            </div>
            {lastResetEmail && (
              <p className="mt-3 text-xs text-muted-foreground">Latest reset email sent to {lastResetEmail}.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
