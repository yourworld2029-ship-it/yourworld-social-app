import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isNativePlatform } from "@/lib/native-privacy";
import { rememberAuthReturnTo } from "@/lib/auth-intents";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (!isNativePlatform()) return { user: null };

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      rememberAuthReturnTo(location.href);
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
