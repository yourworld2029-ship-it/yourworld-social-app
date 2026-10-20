import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { hasAdminConsoleAccess } from "@/lib/admin-access-policy";

type AccessStatus = "checking" | "allowed" | "denied" | "error";

type AccessResult = {
  userId: string | null;
  status: AccessStatus;
  message?: string;
};

export function useAdminAccess() {
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<AccessResult>({
    userId: null,
    status: "checking",
  });

  useEffect(() => {
    let active = true;

    if (authLoading) return () => {
      active = false;
    };

    if (!user) {
      setResult({
        userId: null,
        status: "denied",
        message: "Sign in to continue.",
      });
      return () => {
        active = false;
      };
    }

    setResult({ userId: user.id, status: "checking" });

    if (hasAdminConsoleAccess(user.email, null)) {
      setResult({ userId: user.id, status: "allowed" });
      return () => {
        active = false;
      };
    }

    void supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setResult({
            userId: user.id,
            status: "error",
            message: "Could not verify admin access. Please refresh and try again.",
          });
          return;
        }
        setResult({
          userId: user.id,
          status: hasAdminConsoleAccess(user.email, data?.role) ? "allowed" : "denied",
          message: data?.role === "admin" ? undefined : "This account does not have the admin role.",
        });
      });

    return () => {
      active = false;
    };
  }, [authLoading, user?.email, user?.id]);

  if (authLoading) {
    return { status: "checking" as const, message: undefined };
  }
  if (!user) {
    return { status: "denied" as const, message: "Sign in to continue." };
  }
  if (result.userId !== user.id) {
    return { status: "checking" as const, message: undefined };
  }
  return { status: result.status, message: result.message };
}
