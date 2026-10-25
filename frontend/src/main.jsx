import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/app/query-client";
import App from "@/app/App";
import AppErrorBoundary from '@/app/AppErrorBoundary';
import "@/styles/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary><QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider></AppErrorBoundary>
  </StrictMode>,
);
