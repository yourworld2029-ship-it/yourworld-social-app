import { createRoot, hydrateRoot } from 'react-dom/client';

import App from './App';

// The imported Start app's styles are the source of truth. Keep the client
// entry on the same stylesheet that the root route advertises during SSR.
import './styles.css';

const rootElement = document.getElementById('root')!;
const renderOptions = {
  onCaughtError: (
    error: unknown,
    errorInfo: { componentStack?: string | null },
  ) => {
    console.error(error, errorInfo.componentStack);
  },
};
const app = <App />;

// Vite serves the app as a static document in the browser-only path, while
// TanStack Start can provide an SSR shell when the Start server is present.
// Hydrate when markup exists and fall back to a regular client mount otherwise.
if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app, renderOptions);
} else {
  createRoot(rootElement, renderOptions).render(app);
}
