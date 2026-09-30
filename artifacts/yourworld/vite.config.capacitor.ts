import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { normalizeSupabaseProjectUrl } from "./src/integrations/supabase/url.ts";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const configuredSupabaseUrl = process.env.SUPABASE_URL ?? "";
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
const currentDeploymentUrl = "https://your-world-social-app--yourworld2029.replit.app";

if (!configuredSupabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be configured in Replit Secrets.",
  );
}

export default defineConfig({
  base: "./",
  publicDir: false,
  plugins: [
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
      spa: {
        enabled: true,
        maskPath: "/",
        prerender: { outputPath: "/index" },
      },
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    react(),
  ],
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      normalizeSupabaseProjectUrl(configuredSupabaseUrl),
    ),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
    "import.meta.env.VITE_APP_URL": JSON.stringify(
      process.env.REPLIT_APP_URL ?? currentDeploymentUrl,
    ),
  },
  resolve: { tsconfigPaths: true },
  build: {
    outDir: path.join(projectRoot, ".output", "capacitor-build"),
    emptyOutDir: true,
    minify: "terser",
    terserOptions: {
      compress: {
        pure_funcs: ["console.log"],
      },
    },
  },
  environments: {
    client: {
      build: {
        outDir: path.join(projectRoot, ".output", "capacitor"),
        emptyOutDir: true,
      },
    },
    server: {
      build: {
        outDir: path.join(projectRoot, ".output", "capacitor-server"),
        emptyOutDir: true,
      },
    },
  },
});