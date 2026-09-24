export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_BASE = `${API_URL}/api/v1`;

const REFRESH_KEY = "nebula_refresh_token";

export const tokenStore = {
  getRefresh: () =>
    typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null,
  setRefresh: (token: string) => localStorage.setItem(REFRESH_KEY, token),
  clearRefresh: () => localStorage.removeItem(REFRESH_KEY),
};

export interface ApiError {
  status: number;
  detail: string;
}

function parseDetail(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "detail" in data) {
    const d = (data as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d) && d[0]?.msg) return d[0].msg as string;
  }
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // ignore
    }
    const error: ApiError = {
      status: res.status,
      detail: parseDetail(data, res.statusText),
    };
    throw error;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
