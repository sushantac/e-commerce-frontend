import { clearTokens, getTokens, setTokens } from "./auth";
import type { AccessTokenResponse } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly timestamp?: string;
  readonly path?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    extra?: { timestamp?: string; path?: string }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.timestamp = extra?.timestamp;
    this.path = extra?.path;
  }
}

interface ErrorEnvelope {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
}

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: QueryParams;
  allowRefresh?: boolean;
}

// Unauthenticated endpoints: a 401 here never merits a token refresh.
const NO_REFRESH_PATHS = new Set(["/auth/login", "/auth/register", "/auth/refresh"]);

function buildQueryString(params?: QueryParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    search.append(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function parseError(response: Response): Promise<ApiError> {
  let envelope: ErrorEnvelope = {};
  try {
    envelope = (await response.json()) as ErrorEnvelope;
  } catch {
    envelope = {};
  }
  const status = envelope.status ?? response.status;
  const code = envelope.error ?? response.statusText ?? "Error";
  const message = envelope.message ?? `Request failed with status ${response.status}`;
  return new ApiError(status, code, message, {
    timestamp: envelope.timestamp,
    path: envelope.path,
  });
}

async function refreshSession(): Promise<boolean> {
  const { refreshToken } = getTokens();
  if (!refreshToken) {
    return false;
  }
  let response: Response;
  try {
    response = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return false;
  }
  if (!response.ok) {
    return false;
  }
  let data: AccessTokenResponse;
  try {
    data = (await response.json()) as AccessTokenResponse;
  } catch {
    return false;
  }
  setTokens({
    accessToken: data.accessToken,
    refreshToken,
  });
  return true;
}

function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const tokens = getTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (tokens.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}${buildQueryString(options.params)}`, {
      method: options.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new ApiError(
      0,
      "NetworkError",
      error instanceof Error ? error.message : "Network request failed"
    );
  }

  const canRefresh = options.allowRefresh !== false && !NO_REFRESH_PATHS.has(path);
  if (response.status === 401 && canRefresh) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(path, { ...options, allowRefresh: false });
    }
    clearTokens();
    redirectToLogin();
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return undefined as T;
  }
}

export const api = {
  get: <T>(path: string, params?: QueryParams) =>
    request<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export default api;