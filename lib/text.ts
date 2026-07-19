/** Repairs legacy text that was stored after being decoded with the wrong character set. */
export function repairTextEncoding(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replaceAll("\u00e2\u20ac\u2122", "'")
    .replaceAll("\u00c2\u00a3", "£")
    .replaceAll("\u00c2\u00b7", "·")
    .replaceAll("\u00c2\u00a0", " ");
}
