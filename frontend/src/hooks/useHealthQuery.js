import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

export function useHealthQuery() {
  return useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) =>
      apiRequest("/health", {
        signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
      }),
    retry: false,
    networkMode: "always",
    refetchInterval: 60_000,
  });
}
