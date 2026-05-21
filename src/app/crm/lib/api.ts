// Centralized API client — wraps apiFetch with React Query compatible interface
import { apiFetch, authStorage } from "./auth";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) { authStorage.clear(); window.location.reload(); throw new ApiError(401, "Session expired"); }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.message || "Request failed");
  return body as T;
}

export const api = {
  get: <T>(url: string) => apiFetch(url).then(r => handleResponse<T>(r)),
  post: <T>(url: string, data?: any) => apiFetch(url, { method: "POST", body: JSON.stringify(data) }).then(r => handleResponse<T>(r)),
  patch: <T>(url: string, data?: any) => apiFetch(url, { method: "PATCH", body: JSON.stringify(data) }).then(r => handleResponse<T>(r)),
  delete: <T>(url: string) => apiFetch(url, { method: "DELETE" }).then(r => handleResponse<T>(r)),
};
