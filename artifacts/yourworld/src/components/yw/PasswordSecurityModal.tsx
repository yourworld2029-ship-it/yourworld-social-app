import { useEffect, useState } from "react";
import { ArrowLeft, KeyRound, Loader2, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordFlow = "change" | "forgot";
type PasswordStep = "credentials" | "otp";

type PasswordSecurityModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail?: string;
  initialFlow?: PasswordFlow;
  onSuccess?: () => void | Promise<void>;
};

function isInvalidCredentialsError(error: {
  code?: string;
  message?: string;
  status?: number;
}) {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "invalid_credentials" ||
    /invalid login credentials|invalid credentials|email or password/i.test(message) ||
    (error.status === 400 && message.includes("password"))
  );
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function PasswordSecurityModal({
  open,
  onOpenChange,
  initialEmail = "",
  initialFlow = "change",
  onSuccess,
}: PasswordSecurityModalProps) {
  const [flow, setFlow] = useState<PasswordFlow>(initialFlow);
  const [step, setStep] = useState<PasswordStep>("credentials");
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFlow(initialFlow);
    setStep("credentials");
    setEmail(initialEmail);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setOtp("");
    setCooldown(0);
    setBusy(false);
  }, [initialEmail, initialFlow, open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const close = () => {
    if (!busy) onOpenChange(false);
  };

  const sendOtp = async (targetEmail: string) => {
    const normalizedEmail = normalizeEmail(targetEmail);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      toast.error("Enter a valid email address");
      return false;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: false },
    });
    setBusy(false);

    if (error) {
      toast.error(error.message || "Could not send verification code");
      return false;
    }

    setEmail(normalizedEmail);
    setOtp("");
    setStep("otp");
    setCooldown(60);
    toast.success(`Verification code sent to ${normalizedEmail}`);
    return true;
  };

  const handleCredentialsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (flow === "change") {
      if (!currentPassword) {
        toast.error("Enter your current password");
        return;
      }

      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: currentPassword,
      });
      setBusy(false);

      if (error) {
        if (isInvalidCredentialsError(error)) {
          toast.error("Current password is incorrect");
        } else {
          toast.error(error.message || "Could not verify your current password");
        }
        return;
      }
    }

    await sendOtp(normalizedEmail);
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const token = otp.replace(/\D/g, "");
    if (token.length !== 6) {
      toast.error("Enter the 6-digit verification code");
      return;
    }

    setBusy(true);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: normalizeEmail(email),
      token,
      type: "email",
    });
    if (verifyError) {
      setBusy(false);
      toast.error("That verification code is invalid or expired");
      return;
    }
    if (flow === "forgot" && !data.session) {
      setBusy(false);
      toast.error("Verification did not create a recovery session");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setBusy(false);
    if (updateError) {
      toast.error(updateError.message || "Could not update your password");
      return;
    }

    toast.success("Password changed successfully!");
    onOpenChange(false);
    await onSuccess?.();
  };

  const switchToForgot = () => {
    if (busy) return;
    setFlow("forgot");
    setStep("credentials");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setOtp("");
  };

  const switchToChange = () => {
    if (busy) return;
    setFlow("change");
    setStep("credentials");
    setOtp("");
  };

  const goBackToCredentials = () => {
    if (busy) return;
    setStep("credentials");
    setOtp("");
    setCooldown(0);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}>
      <DialogContent className="mx-auto max-w-[calc(100%-2rem)] overflow-hidden rounded-[26px] border border-white/10 bg-[color-mix(in_oklab,var(--card)_88%,#090b18)] p-0 text-foreground shadow-2xl backdrop-blur-3xl sm:max-w-md [&>button]:hidden">
        <DialogTitle className="sr-only">
          {flow === "change" ? "Change password" : "Forgot password"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Securely verify your identity before changing your password.
        </DialogDescription>

        <div className="relative p-6">
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Close password security modal"
            className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-muted-foreground transition-colors hover:bg-white/[0.1] disabled:opacity-50"
          >
            <span className="text-lg leading-none">×</span>
          </button>

          <div className="mb-5 flex items-start gap-3 pr-8">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 ring-1 ring-pink-300/10">
              {step === "otp" ? (
                <ShieldCheck className="h-6 w-6" strokeWidth={1.7} />
              ) : (
                <KeyRound className="h-6 w-6" strokeWidth={1.7} />
              )}
            </span>
            <div>
              <p className="font-ui text-[18px] font-semibold tracking-[-0.02em]">
                {flow === "change" ? "Change password" : "Reset your password"}
              </p>
              <p className="mt-1 font-ui text-[12px] leading-relaxed text-muted-foreground">
                {step === "otp"
                  ? `Enter the 6-digit code sent to ${email}`
                  : flow === "change"
                    ? "Verify your current password, then confirm the change by email."
                    : "We’ll verify your email before letting you choose a new password."}
              </p>
            </div>
          </div>

          {step === "credentials" ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
              {flow === "forgot" ? (
                <label className="block">
                  <span className="mb-1.5 block font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
                    Registered email
                  </span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="h-11 rounded-[13px] border-white/10 bg-white/[0.05] pl-10 text-sm"
                      required
                    />
                  </div>
                </label>
              ) : (
                <label className="block">
                  <span className="mb-1.5 block font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
                    Current password
                  </span>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    className="h-11 rounded-[13px] border-white/10 bg-white/[0.05] text-sm"
                    required
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
                  New password
                </span>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  minLength={6}
                  className="h-11 rounded-[13px] border-white/10 bg-white/[0.05] text-sm"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
                  Confirm new password
                </span>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  minLength={6}
                  className="h-11 rounded-[13px] border-white/10 bg-white/[0.05] text-sm"
                  required
                />
              </label>

              <Button
                type="submit"
                disabled={busy}
                className="mt-2 h-11 w-full rounded-[13px] bg-gradient-to-r from-pink-500 to-purple-600 font-ui text-sm font-semibold shadow-lg shadow-pink-500/15 hover:from-pink-600 hover:to-purple-700"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Verifying…" : "Continue"}
              </Button>

              {flow === "change" ? (
                <button
                  type="button"
                  onClick={switchToForgot}
                  disabled={busy}
                  className="block w-full pt-1 text-center font-ui text-[13px] font-semibold text-pink-300 transition-colors hover:text-pink-200 disabled:opacity-50"
                >
                  Forgot Password?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={switchToChange}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-1.5 pt-1 font-ui text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  I know my current password
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                aria-label="6-digit verification code"
                className="h-14 rounded-[15px] border-white/10 bg-white/[0.05] text-center font-mono text-2xl tracking-[0.45em]"
                autoFocus
                required
              />

              <Button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="h-11 w-full rounded-[13px] bg-gradient-to-r from-pink-500 to-purple-600 font-ui text-sm font-semibold shadow-lg shadow-pink-500/15 hover:from-pink-600 hover:to-purple-700"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Updating password…" : "Verify & change password"}
              </Button>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={goBackToCredentials}
                  disabled={busy}
                  className="flex items-center gap-1.5 font-ui text-[12px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => void sendOtp(email)}
                  disabled={busy || cooldown > 0}
                  className={cn(
                    "flex items-center gap-1.5 font-ui text-[12px] font-semibold transition-colors",
                    cooldown > 0 ? "text-muted-foreground/50" : "text-pink-300 hover:text-pink-200",
                  )}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}