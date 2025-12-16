export const APP_SESSION_STORAGE_KEY = "pos_auth_session";
export const APP_ACCESS_TOKEN_STORAGE_KEY = "pos_access_token";
export const APP_REFRESH_TOKEN_STORAGE_KEY = "pos_refresh_token";

export interface StoredAppSession {
  email: string;
  accessToken?: string;
  refreshToken?: string;
  avatarUrl?: string;
  fullName?: string;
  supabaseId?: string;
  profileCreatedAt?: string;
  cartCreated?: boolean;
  expiresAt: number;
}

export function storeAppSession(payload: StoredAppSession): void {
  localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(payload));

  if (payload.accessToken) {
    localStorage.setItem(APP_ACCESS_TOKEN_STORAGE_KEY, payload.accessToken);
  } else {
    localStorage.removeItem(APP_ACCESS_TOKEN_STORAGE_KEY);
  }

  if (payload.refreshToken) {
    localStorage.setItem(APP_REFRESH_TOKEN_STORAGE_KEY, payload.refreshToken);
  } else {
    localStorage.removeItem(APP_REFRESH_TOKEN_STORAGE_KEY);
  }
}

export function getStoredAppSession(): StoredAppSession | null {
  const raw = localStorage.getItem(APP_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAppSession;
    if (typeof parsed.email !== "string" || typeof parsed.expiresAt !== "number") {
      localStorage.removeItem(APP_SESSION_STORAGE_KEY);
      return null;
    }

    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(APP_SESSION_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch (error) {
    localStorage.removeItem(APP_SESSION_STORAGE_KEY);
    return null;
  }
}

export function clearAppSession(): void {
  localStorage.removeItem(APP_SESSION_STORAGE_KEY);
  localStorage.removeItem(APP_ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(APP_REFRESH_TOKEN_STORAGE_KEY);
}
