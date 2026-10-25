import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 15 * 60_000,
      refetchOnWindowFocus: true,
      retry: (count, error) =>
        count < 1 && (!error.status || error.status >= 500),
    },
    // Audit creation is an expensive POST and must never be retried automatically.
    mutations: { retry: false },
  },
});
