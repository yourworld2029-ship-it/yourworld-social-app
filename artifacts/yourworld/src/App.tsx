import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

// TanStack Start owns the route tree, route context and error boundaries. The
// old artifact shell used a temporary wouter route, which meant the imported
// YourWorld routes were never mounted in the Vite client entry.
const router = getRouter();

function App() {
  return <RouterProvider router={router} />;
}

export default App;
