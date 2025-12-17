import { decodeJwtClaims } from "./jwt";
import type { StoredAppSession } from "./appSession";

export type AppRole = "User" | "Manager";

export const ROLE_CLAIM_URI = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function normalizeRole(value: unknown): AppRole | undefined {
  if (typeof value === "string") {
    if (value === "Manager") {
      return "Manager";
    }
    if (value === "User") {
      return "User";
    }
    return undefined;
  }

  if (Array.isArray(value) && value.length > 0) {
    return normalizeRole(value[0]);
  }

  return undefined;
}

export function extractRoleFromClaims(claims: Record<string, unknown> | null | undefined): AppRole | undefined {
  if (!claims) {
    return undefined;
  }

  return normalizeRole(claims[ROLE_CLAIM_URI] ?? claims.role ?? claims["roles"]);
}

export function extractRoleFromToken(token: string | undefined | null): AppRole | undefined {
  if (!token) {
    return undefined;
  }

  const claims = decodeJwtClaims(token);
  if (!claims || typeof claims !== "object") {
    return undefined;
  }

  return extractRoleFromClaims(claims as Record<string, unknown>);
}

export function extractRoleFromSession(session: StoredAppSession | null): AppRole | undefined {
  if (!session) {
    return undefined;
  }

  return session.role ?? extractRoleFromToken(session.accessToken);
}
