const baseUrl = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(
  /\/$/,
  "",
);

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      "Cannot reach the API. Check that the backend is running and the API URL is correct.",
    );
  }
  const body = await response.text();
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new ApiError(
      "The API returned an unexpected response. Check the backend connection.",
      response.status,
    );
  }
  if (!payload || typeof payload !== "object") {
    throw new ApiError(
      "The API returned an invalid response.",
      response.status,
    );
  }
  if (!response.ok || payload.success === false) {
    throw new ApiError(
      payload.message ||
        `Request failed (HTTP ${response.status}). Please try again.`,
      response.status,
    );
  }
  return payload;
}
