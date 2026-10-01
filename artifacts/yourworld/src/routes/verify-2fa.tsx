import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearAuthReturnTo, getAuthReturnTo } from "@/lib/auth-intents";

type VerifySearch = {
  email?: string;
  redirect?: string;
};

export const Route = createFileRoute("/verify-2fa")({
  validateSearch: (search: Record<string, unknown>): VerifySearch => ({
    email: typeof search.email === "string" ? search.email : undefined,
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: VerifyTwoFactorPage,
});

function VerifyTwoFactorPage() {
  const { email, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error("Your 2FA verification session is missing an email address");
      void navigate({ to: "/auth", search: { redirect }, replace: true });
    }
  }, [email, navigate, redirect]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const resend = async () => {
    if (!email || loading || cooldown > 0) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Could not resend your 2FA code");
      return;
    }
    setCooldown(60);
    toast.success("A new 2FA code was sent");
  };

  const verify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || loading) return;
    const token = otp.replace(/\D/g, "");
    if (token.length !== 6) {
      toast.error("Enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    setLoading(false);
    if (error || !data.session) {
      toast.error("That 2FA code is invalid or expired");
      return;
    }

    toast.success("Two-factor verification complete");
    const destination = getAuthReturnTo(redirect);
    clearAuthReturnTo();
    await navigate({ to: destination as never, replace: true });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-slate-100 shadow-2xl backdrop-blur-xl">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 shadow-lg shadow-pink-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Verify your identity</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter the 6-digit code sent to <span className="text-slate-200">{email}</span>
          </p>
        </div>

        <form onSubmit={verify} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              aria-label="6-digit 2FA code"
              className="h-12 border-slate-800 bg-slate-950/50 pl-10 text-center font-mono text-xl tracking-[0.4em] text-slate-100 placeholder:text-slate-500"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="h-11 w-full bg-gradient-to-r from-pink-500 to-purple-600 font-medium text-white shadow-lg shadow-pink-500/25"
          >
            {loading ? "Verifying..." : "Verify & Sign In"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              void navigate({ to: "/auth", search: { redirect }, replace: true })
            }
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
          >
            <Lock className="h-3.5 w-3.5" />
            Use another account
          </button>
          <button
            type="button"
            onClick={() => void resend()}
            disabled={loading || cooldown > 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-pink-300 disabled:text-slate-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
}