export const APP_SESSION_STORAGE_KEY = "pos_auth_session";

export interface StoredAppSession {
  email: string;
  accessToken?: string;
  refreshToken?: string;
  avatarUrl?: string;
  fullName?: string;
  expiresAt: number;
}

export function storeAppSession(payload: StoredAppSession): void {
  localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(payload));
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
}
