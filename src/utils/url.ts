const trackingParams = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'gclid',
  'fbclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'ref',
  'source'
]);

export function canonicalizeUrl(url: string, baseUrl?: string): string {
  try {
    const parsed = new URL(url, baseUrl);
    parsed.hash = '';
    for (const key of [...parsed.searchParams.keys()]) {
      if (trackingParams.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.pathname !== '/') {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

export function sameDomain(left: string, right: string): boolean {
  const leftDomain = domainFromUrl(left);
  const rightDomain = domainFromUrl(right);
  return Boolean(leftDomain && rightDomain && leftDomain === rightDomain);
}
