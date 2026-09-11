import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { normalizeSupabaseProjectUrl } from "./src/integrations/supabase/url.ts";

const devPort = Number(process.env.DEV_PORT ?? process.env.PORT) || 5173;
const CURRENT_REPLIT_DEPLOYMENT_URL =
  "https://your-world-social-app--yourworld2029.replit.app";

export default defineConfig(({ command }) => {
  const configuredSupabaseUrl = process.env.SUPABASE_URL ?? "";
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
  const appUrl = process.env.REPLIT_APP_URL ?? CURRENT_REPLIT_DEPLOYMENT_URL;

  if (!configuredSupabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be configured in Replit Secrets.",
    );
  }
  const supabaseUrl = normalizeSupabaseProjectUrl(configuredSupabaseUrl);

  return {
    plugins: [
      tailwindcss(),
      tanstackStart({
        server: { entry: "server" },
        importProtection: {
          behavior: "error",
          client: {
            files: ["**/server/**"],
            specifiers: ["server-only"],
          },
        },
      }),
      ...(command === "build" ? [nitro({ defaultPreset: "node-server" })] : []),
      react(),
    ],
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
      "import.meta.env.VITE_APP_URL": JSON.stringify(appUrl),
    },
    server: {
      host: true,
      allowedHosts: true,
      port: devPort,
      strictPort: true,
    },
    resolve: {
      tsconfigPaths: true,
    },
    build: {
      chunkSizeWarningLimit: 650,
    },
  };
});
