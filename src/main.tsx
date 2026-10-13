import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { prefetchForRoute } from '@/content/loaders';
import '@/styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

prefetchForRoute(window.location.hash);

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
