const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const AUTH_TOKEN_KEY = "autogen_access_token";
export const REFRESH_TOKEN_KEY = "autogen_refresh_token";

function getAccessToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearSessionTokens() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function saveSessionTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

async function parseJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    const detail = payload?.detail || "Request failed.";
    throw new Error(detail);
  }
  return payload as T;
}
