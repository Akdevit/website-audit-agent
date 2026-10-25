import {
  keepPreviousData,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createAudit,
  deleteAudit,
  getAudit,
  listAudits,
} from "../api/audits.api";
import { auditKeys } from "../api/audit-keys";

const isRunning = (audit) => ["running", "pending"].includes(audit?.status);

export function useAuditList({ page = 1, limit = 10 } = {}) {
  const creating = useIsMutating({ mutationKey: auditKeys.create() });
  return useQuery({
    queryKey: auditKeys.list(page, limit),
    queryFn: ({ signal }) => listAudits({ page, limit, signal }),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      creating || query.state.data?.audits.some(isRunning) ? 5000 : false,
  });
}

export function useAuditDetail(id) {
  const client = useQueryClient();
  return useQuery({
    queryKey: auditKeys.detail(id),
    queryFn: async ({ signal }) => {
      const transientErrors = client.getQueryData(
        auditKeys.detail(id),
      )?.toolErrors;
      const audit = await getAudit(id, { signal });
      // The create response includes errors that the backend does not persist.
      return transientErrors
        ? { ...audit, toolErrors: transientErrors }
        : audit;
    },
    enabled: !!id,
    refetchInterval: (query) => (isRunning(query.state.data) ? 5000 : false),
  });
}

export function useCreateAudit() {
  const client = useQueryClient();
  return useMutation({
    mutationKey: auditKeys.create(),
    mutationFn: (input) => createAudit(input),
    retry: false,
    onSuccess: (audit) => {
      client.setQueryData(auditKeys.detail(audit.id || audit._id), audit);
      void client.invalidateQueries({
        queryKey: auditKeys.detail(audit.id || audit._id),
        exact: true,
        refetchType: "none",
      });
    },
    // Also refresh failed records, which the backend saves before returning an error.
    onSettled: () => {
      void client.invalidateQueries({ queryKey: auditKeys.lists() });
    },
  });
}

export function useDeleteAudit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteAudit,
    onSuccess: (_, id) => {
      client.removeQueries({ queryKey: auditKeys.detail(id), exact: true });
      void client.invalidateQueries({ queryKey: auditKeys.lists() });
    },
  });
}
