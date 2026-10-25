import { ApiError, apiRequest } from "@/lib/api-client";

export async function createAudit(input, { signal } = {}) {
  const response = await apiRequest("/audits", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
  if (!response.data || !(response.data.id || response.data._id))
    throw new ApiError("The API returned an audit without an ID.");
  return response.data;
}

export async function listAudits({ page = 1, limit = 10, signal } = {}) {
  const response = await apiRequest(
    `/audits?${new URLSearchParams({ page, limit })}`,
    { signal },
  );
  if (!Array.isArray(response.data?.audits) || !response.data.pagination)
    throw new ApiError("The API returned an invalid audit list.");
  return response.data;
}

export async function getAudit(id, { signal } = {}) {
  const response = await apiRequest(`/audits/${encodeURIComponent(id)}`, {
    signal,
  });
  if (!response.data || !(response.data.id || response.data._id))
    throw new ApiError("The API returned an invalid audit record.");
  return response.data;
}

export async function deleteAudit(id) {
  return apiRequest(`/audits/${encodeURIComponent(id)}`, { method: "DELETE" });
}
