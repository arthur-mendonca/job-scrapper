export function compactWhitespace(input: string | null | undefined): string {
  return (input ?? '').replace(/\s+/g, ' ').trim();
}

export function truncate(input: string | null | undefined, maxLength: number): string {
  const text = compactWhitespace(input);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

export function normalizeKey(input: string): string {
  return compactWhitespace(input)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .trim();
}

export function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
