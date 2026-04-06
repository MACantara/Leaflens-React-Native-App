export function toCaseInsensitiveRegex(keyword: unknown): RegExp | null {
  if (typeof keyword !== 'string') {
    return null;
  }

  const trimmed = keyword.trim();
  if (!trimmed) {
    return null;
  }

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
}

export function toTagArray(tagQuery: unknown): string[] {
  if (!tagQuery) {
    return [];
  }

  const source = Array.isArray(tagQuery) ? tagQuery : [tagQuery];

  return source
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}
