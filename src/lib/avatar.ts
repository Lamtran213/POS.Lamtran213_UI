const DEFAULT_AVATAR_BACKGROUND = "4338CA";
const DEFAULT_AVATAR_COLOR = "FFFFFF";
const DEFAULT_AVATAR_FALLBACK = "POS";

export function buildDefaultAvatar(label: string | undefined | null): string {
  const safeLabel = typeof label === "string" && label.trim().length > 0 ? label.trim() : DEFAULT_AVATAR_FALLBACK;
  const encodedLabel = encodeURIComponent(safeLabel);

  return `https://ui-avatars.com/api/?name=${encodedLabel}&background=${DEFAULT_AVATAR_BACKGROUND}&color=${DEFAULT_AVATAR_COLOR}&bold=true`;
}
