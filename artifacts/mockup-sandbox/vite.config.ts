import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { cartographer } from "@replit/vite-plugin-cartographer";
import { mockupPreviewPlugin } from "./mockupPreviewPlugin";

export default defineConfig(({ command }) => {
  const rawPort = process.env.PORT;
  const port = rawPort ? Number(rawPort) : 5173;
  if (command === "serve" && !rawPort) {
    throw new Error("PORT environment variable is required while serving the preview sandbox.");
  }
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }
  const basePath = process.env.BASE_PATH ?? "/mockup-sandbox/";

  return {
  base: basePath,
  // The preview sandbox intentionally combines plugins from different Vite
  // release lines; the runtime accepts them, but their duplicated Vite type
  // declarations are not assignable to one another during workspace checks.
  plugins: [
    mockupPreviewPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          cartographer({
            root: path.resolve(import.meta.dirname, ".."),
          }),
        ]
      : []),
  ] as any,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
  };
});
