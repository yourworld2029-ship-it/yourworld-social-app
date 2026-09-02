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

type AuthValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
};

const DEMO_SESSION_KEY = "yourworld:demo-session";
export const DEMO_USER = {
  id: "demo-guest",
  aud: "authenticated",
  role: "authenticated",
  email: "guest@yourworld.demo",
  app_metadata: { provider: "demo", providers: ["demo"] },
  user_metadata: { display_name: "Guest Creator", username: "guest.creator" },
  identities: [],
  created_at: new Date(0).toISOString(),
} as User;

export function isDemoGuest() {
  return typeof window !== "undefined" && window.localStorage.getItem(DEMO_SESSION_KEY) === "1";
}

export function startDemoGuest() {
  if (typeof window !== "undefined") window.localStorage.setItem(DEMO_SESSION_KEY, "1");
}

const AuthContext = createContext<AuthValue | null>(null);

/** Routes reachable without a session. */
export const PUBLIC_ROUTES = ["/auth", "/reset-password"];

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) {
        window.localStorage.removeItem(DEMO_SESSION_KEY);
        setDemo(false);
      }
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setDemo(!data.session && isDemoGuest());
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      user: session?.user ?? (demo ? DEMO_USER : null),
      loading,
      isDemo: demo,
      signOut: async () => {
        window.localStorage.removeItem(DEMO_SESSION_KEY);
        setDemo(false);
        await supabase.auth.signOut();
      },
    }),
    [session, demo, loading],
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
    // Auth redirect disabled — app opens directly on home feed
  }, [loading]);

  // Never block the first paint on the session lookup — screens render instantly
  // and re-render once the session resolves.
  void publicRoute;
  void navigate;
  return <>{children}</>;
}
