export type JwtClaims = Record<string, unknown> | null;

function base64UrlDecode(input: string): string {
  const padded = input.padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof atob === "function") {
    return atob(base64);
  }

  const globalBuffer = (globalThis as { Buffer?: { from(data: string, encoding: string): { toString(encoding: string): string } } }).Buffer;
  if (globalBuffer) {
    return globalBuffer.from(base64, "base64").toString("binary");
  }

  throw new Error("No base64 decoder available");
}

export function decodeJwtClaims(token: string | undefined | null): JwtClaims {
  if (!token) {
    return null;
  }

  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }

  try {
    const payloadSegment = segments[1];
    const decoded = base64UrlDecode(payloadSegment);
    const jsonString = Array.from(decoded)
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("");
    const normalized = decodeURIComponent(jsonString);
    return JSON.parse(normalized) as Record<string, unknown>;
  } catch (error) {
    console.warn("Failed to decode JWT payload:", error);
    return null;
  }
}
