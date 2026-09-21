import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type TwoFactorSetupModalProps = {
  open: boolean;
  email: string;
  onOpenChange: (open: boolean) => void;
  onEnabled: () => void;
};

export function TwoFactorSetupModal({
  open,
  email,
  onOpenChange,
  onEnabled,
}: TwoFactorSetupModalProps) {
  const [step, setStep] = useState<"confirm" | "otp">("confirm");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("confirm");
    setOtp("");
    setCooldown(0);
    setBusy(false);
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const sendCode = async () => {
    if (busy) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Your account does not have a registered email address");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message || "Could not send the 2FA verification code");
      return;
    }
    setStep("otp");
    setOtp("");
    setCooldown(60);
    toast.success("2FA verification code sent");
  };

  const verifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const token = otp.replace(/\D/g, "");
    if (token.length !== 6) {
      toast.error("Enter the 6-digit verification code");
      return;
    }

    setBusy(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "email",
    });
    if (verifyError) {
      setBusy(false);
      toast.error("That verification code is invalid or expired");
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setBusy(false);
      toast.error("Your session could not be confirmed");
      return;
    }
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ two_factor_enabled: true })
      .eq("id", userData.user.id);
    setBusy(false);
    if (profileError) {
      toast.error(profileError.message || "Could not enable 2FA");
      return;
    }

    onOpenChange(false);
    onEnabled();
    toast.success("Two-factor authentication enabled");
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !busy && onOpenChange(value)}>
      <DialogContent className="mx-auto max-w-[calc(100%-2rem)] overflow-hidden rounded-[26px] border border-white/10 bg-[color-mix(in_oklab,var(--card)_88%,#090b18)] p-0 text-foreground shadow-2xl backdrop-blur-3xl sm:max-w-md [&>button]:hidden">
        <DialogTitle className="sr-only">Enable two-factor authentication</DialogTitle>
        <DialogDescription className="sr-only">
          Confirm your email before enabling two-factor authentication.
        </DialogDescription>
        <div className="relative p-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            aria-label="Close 2FA setup"
            className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-muted-foreground disabled:opacity-50"
          >
            <span className="text-lg leading-none">×</span>
          </button>
          <div className="mb-5 flex items-start gap-3 pr-8">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-green-500/15 text-green-300">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.7} />
            </span>
            <div>
              <h2 className="font-ui text-[18px] font-semibold">Enable 2FA</h2>
              <p className="mt-1 font-ui text-[12px] leading-relaxed text-muted-foreground">
                A 6-digit OTP will be required whenever signing in from a new device.
              </p>
            </div>
          </div>

          {step === "confirm" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.04] p-3.5">
                <Mail className="h-4 w-4 shrink-0 text-pink-300" />
                <p className="min-w-0 truncate font-ui text-[13px] text-muted-foreground">
                  A test code will be sent to <span className="text-foreground">{email}</span>
                </p>
              </div>
              <Button
                type="button"
                onClick={() => void sendCode()}
                disabled={busy}
                className="h-11 w-full rounded-[13px] bg-gradient-to-r from-pink-500 to-purple-600 font-ui text-sm font-semibold"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Sending code…" : "Send test OTP"}
              </Button>
            </div>
          ) : (
            <form onSubmit={verifyCode} className="space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                aria-label="6-digit 2FA verification code"
                autoFocus
                required
                className="h-14 rounded-[15px] border-white/10 bg-white/[0.05] text-center font-mono text-2xl tracking-[0.45em]"
              />
              <Button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="h-11 w-full rounded-[13px] bg-gradient-to-r from-pink-500 to-purple-600 font-ui text-sm font-semibold"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Enabling 2FA…" : "Verify & enable 2FA"}
              </Button>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => !busy && setStep("confirm")}
                  disabled={busy}
                  className="flex items-center gap-1.5 font-ui text-[12px] text-muted-foreground disabled:opacity-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => void sendCode()}
                  disabled={busy || cooldown > 0}
                  className="flex items-center gap-1.5 font-ui text-[12px] font-semibold text-pink-300 disabled:text-muted-foreground/50"
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