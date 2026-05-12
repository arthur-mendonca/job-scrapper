import { describe, expect, it } from 'vitest';
import { canonicalizeUrl } from './url.js';

describe('canonicalizeUrl', () => {
  it('removes tracking parameters and hash fragments', () => {
    expect(canonicalizeUrl('https://Example.com/jobs/123/?utm_source=x&foo=bar#section')).toBe(
      'https://example.com/jobs/123?foo=bar'
    );
  });

  it('resolves relative URLs against a base URL', () => {
    expect(canonicalizeUrl('/jobs/123?ref=feed', 'https://example.com/careers')).toBe(
      'https://example.com/jobs/123'
    );
  });
});
