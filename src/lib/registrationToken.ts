const STORAGE_KEY = "pos_registration_token";

export interface StoredRegistrationToken {
  email: string;
  registrationToken: string;
  expiresAt: number;
}

export function rememberRegistrationToken(payload: StoredRegistrationToken): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function getStoredRegistrationToken(): StoredRegistrationToken | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredRegistrationToken;
    if (typeof parsed.expiresAt !== "number" || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearRegistrationToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}
