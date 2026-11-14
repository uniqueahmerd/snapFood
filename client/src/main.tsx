// import { createRoot } from "react-dom/client";
// import App from "./App.tsx";
// import "./index.css";

// createRoot(document.getElementById("root")!).render(
//     <App />
// );

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { queryClient } from './services/queryClient';

import './i18n/config';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('[snapfood] #root is missing from index.html');
}

/*
 * BrowserRouter wraps App rather than living inside it: `useAuthBootstrap` calls
 * `useNavigate` so the Axios 401 handler can bounce to /login through the router
 * instead of a full page reload, and that hook runs in App itself.
 */
createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
