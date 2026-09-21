import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  currentUserSessionIsActive,
  registerCurrentUserSession,
} from "@/lib/session-security";

type AuthValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: (scope?: "global" | "local" | "others") => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

/** Routes reachable without a session. */
export const PUBLIC_ROUTES = ["/auth", "/reset-password", "/verify-2fa"];

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    let authEventSeen = false;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!alive) return;
      authEventSeen = true;
      setSession(next);
      setLoading(false);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!alive || authEventSeen) return;
      if (error) {
        console.error("[auth] session bootstrap failed", error);
        setSession(null);
      } else {
        setSession(data.session);
      }
      setLoading(false);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;
    let alive = true;
    const now = new Date().toISOString();
    void supabase
      .from("admin_account_restrictions")
      .select("id")
      .eq("user_id", userId)
      .is("lifted_at", null)
      .lte("starts_at", now)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          console.error("[auth] Could not verify account restriction state", error);
          return;
        }
        if (data) void supabase.auth.signOut();
      });
    return () => {
      alive = false;
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let alive = true;
    let signingOut = false;

    const enforceSession = async (register: boolean) => {
      const result = register
        ? await registerCurrentUserSession()
        : await currentUserSessionIsActive();
      if (!alive || signingOut || result.error || result.active) return;

      signingOut = true;
      await supabase.auth.signOut({ scope: "local" });
      toast.error("Session ended from primary device.");
      await navigate({ to: "/auth", replace: true });
    };

    void enforceSession(true);
    const interval = window.setInterval(() => void enforceSession(false), 15_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void enforceSession(false);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      alive = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [navigate, session]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signOut: async (scope = "global") => {
        const { error } = await supabase.auth.signOut({ scope });
        if (error && scope !== "local") {
          // Account deletion invalidates the remote session before the browser
          // can sign out globally. Always remove the local token in that case.
          const { error: localError } = await supabase.auth.signOut({ scope: "local" });
          if (localError) throw error;
        } else if (error) {
          throw error;
        }
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Blocks every non-public route until a session exists. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const publicRoute = isPublicRoute(pathname);

  useEffect(() => {
    if (loading) return;
    if (!publicRoute && !session) {
      void navigate({ to: "/auth", replace: true });
    }
  }, [loading, navigate, publicRoute, session]);

  if (loading && !publicRoute) return null;
  if (!publicRoute && !session) return null;
  return <>{children}</>;
}
