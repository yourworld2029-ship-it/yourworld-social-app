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
import { InteractionGateSheets } from "@/components/yw/InteractionGateSheets";
import {
  clearAuthReturnTo,
  clearPendingAuthAction,
  consumePendingAuthAction,
  getAuthReturnTo,
  rememberAuthReturnTo,
  savePendingAuthAction,
  type AuthActionInput,
  type AuthActionType,
  type PendingAuthAction,
} from "@/lib/auth-intents";
import {
  currentUserSessionIsActive,
  registerCurrentUserSession,
} from "@/lib/session-security";

type AuthValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: (scope?: "global" | "local" | "others") => Promise<void>;
  requestAuthAction: (action: AuthActionInput) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

/** Routes reachable without a session. */
export const PUBLIC_ROUTES = ["/auth", "/reset-password", "/verify-2fa"];

function isGuestBrowsableRoute(pathname: string) {
  if (pathname === "/" || pathname === "/reels") return true;
  if (/^\/watch\/[^/]+\/?$/.test(pathname)) return true;
  if (/^\/(?:u|video)\/[^/]+\/?$/.test(pathname)) return true;
  return pathname !== "/live/create" && /^\/live\/[^/]+\/?$/.test(pathname);
}

export function isPublicRoute(pathname: string) {
  return (
    PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    isGuestBrowsableRoute(pathname)
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const navigate = useNavigate();
  const currentHref = useRouterState({ select: (state) => state.location.href });

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
      requestAuthAction: (action) => {
        if (session?.user) return;
        savePendingAuthAction(action, currentHref);
        setAuthPromptOpen(true);
      },
      signOut: async (scope = "global") => {
        // Supabase removes its own session token. Do not clear app storage here:
        // the offline-download library is stored independently of auth state.
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
    [currentHref, session, loading],
  );

  const continueToAuth = () => {
    const redirect = getAuthReturnTo(currentHref);
    setAuthPromptOpen(false);
    void navigate({
      to: "/auth",
      search: { redirect },
    } as never);
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <InteractionGateSheets
        authOpen={authPromptOpen}
        onCloseAuth={() => {
          setAuthPromptOpen(false);
          clearPendingAuthAction();
          clearAuthReturnTo();
        }}
        onContinueAuth={continueToAuth}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useResumeAuthAction(
  type: AuthActionType,
  targetId: string | null | undefined,
  resume: (action: PendingAuthAction) => void | Promise<void>,
) {
  const { user, loading } = useAuth();
  const currentHref = useRouterState({ select: (state) => state.location.href });

  useEffect(() => {
    if (loading || !user || !targetId) return;
    const pending = consumePendingAuthAction(type, targetId, currentHref);
    if (!pending) return;
    void Promise.resolve(resume(pending)).catch((error: unknown) => {
      console.error("[auth] Could not resume the requested action", error);
      toast.error("That action couldn't be completed. Please try again.");
    });
  }, [currentHref, loading, resume, targetId, type, user]);
}

/** Blocks private routes while allowing public browsing. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname, href } = useRouterState({
    select: (state) => ({
      pathname: state.location.pathname,
      href: state.location.href,
    }),
  });
  const publicRoute = isPublicRoute(pathname);

  useEffect(() => {
    if (loading) return;
    if (!publicRoute && !session) {
      rememberAuthReturnTo(href);
      void navigate({
        to: "/auth",
        search: { redirect: href },
        replace: true,
      } as never);
    }
  }, [href, loading, navigate, publicRoute, session]);

  if (loading && !publicRoute) {
    return (
      <main
        className="min-h-[100dvh] bg-background px-4 pt-8"
        role="status"
        aria-label="Loading your account"
        aria-busy="true"
      >
        <div className="mx-auto max-w-3xl animate-pulse">
          <div className="h-8 w-36 rounded-lg bg-secondary" />
          <div className="mt-8 flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-secondary" />
            <div className="space-y-3">
              <div className="h-4 w-40 rounded bg-secondary" />
              <div className="h-3 w-28 rounded bg-secondary" />
            </div>
          </div>
          <div className="mt-8 h-12 rounded-xl bg-secondary" />
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className="aspect-square rounded-lg bg-secondary" />
            ))}
          </div>
        </div>
      </main>
    );
  }
  if (!publicRoute && !session) return null;
  return <>{children}</>;
}
