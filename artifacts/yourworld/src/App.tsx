import { RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import { requestStartupRuntimePermissionsOnce } from "./lib/native-privacy";
import { getRouter } from "./router";

// TanStack Start owns the route tree, route context and error boundaries. The
// old artifact shell used a temporary wouter route, which meant the imported
// YourWorld routes were never mounted in the Vite client entry.
const router = getRouter();

function App() {
  useEffect(() => {
    void requestStartupRuntimePermissionsOnce().catch((cause) => {
      console.warn("[privacy-bridge] Startup permission request failed", cause);
    });
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
