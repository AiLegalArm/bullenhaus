// ============================================================================
// Centralized auth state — production version
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

const KEYS = {
  role:         "aura_role",
  token:        "accessToken",
  refreshToken: "aura_refresh",
  user:         "aura_user",
} as const;

export const authStorage = {
  getRole:         (): string | null => localStorage.getItem(KEYS.role),
  setRole:         (r: string)       => localStorage.setItem(KEYS.role, r),

  getToken:        (): string | null => localStorage.getItem(KEYS.token),
  setToken:        (t: string)       => localStorage.setItem(KEYS.token, t),

  getRefreshToken: (): string | null => localStorage.getItem(KEYS.refreshToken),
  setRefreshToken: (t: string)       => localStorage.setItem(KEYS.refreshToken, t),

  getUser: (): AuthUser | null => {
    try { return JSON.parse(localStorage.getItem(KEYS.user) || "null"); }
    catch { return null; }
  },
  setUser: (u: AuthUser) => localStorage.setItem(KEYS.user, JSON.stringify(u)),

  clear: () => Object.values(KEYS).forEach(k => localStorage.removeItem(k)),
};

// ── Real API login ───────────────────────────────────────────────────────────
export async function apiLogin(email: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/v1/auth/login", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Login failed");
  }

  const data = await res.json();
  // data: { accessToken, refreshToken, user: { id, email, firstName, lastName, roles[] } }

  authStorage.setToken(data.accessToken);
  authStorage.setRefreshToken(data.refreshToken);
  authStorage.setUser(data.user);

  // Derive single UI role from the roles array
  // Priority: ADMIN > DIRECTOR > MANAGER > AGENT
  const roleMap: Record<string, string> = {
    ADMIN:    "admin",
    DIRECTOR: "director",
    MANAGER:  "manager",
    AGENT:    "agent",
  };
  const priority = ["ADMIN", "DIRECTOR", "MANAGER", "AGENT"];
  const topRole  = priority.find(r => data.user.roles.includes(r)) || data.user.roles[0];
  const uiRole   = roleMap[topRole] || "agent";

  authStorage.setRole(uiRole);
  return data.user;
}

// ── Token refresh ────────────────────────────────────────────────────────────
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch("/api/v1/auth/refresh", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const { accessToken } = await res.json();
    authStorage.setToken(accessToken);
    return accessToken;
  } catch {
    return null;
  }
}

// ── Authenticated fetch (auto-refresh on 401) ────────────────────────────────
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authStorage.getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(url, { ...options, headers: { ...headers, Authorization: `Bearer ${newToken}` } });
    }
  }

  return res;
}

// ── Logout ───────────────────────────────────────────────────────────────────
export async function apiLogout(): Promise<void> {
  const refreshToken = authStorage.getRefreshToken();
  if (refreshToken) {
    await fetch("/api/v1/auth/logout", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }
  authStorage.clear();
}
