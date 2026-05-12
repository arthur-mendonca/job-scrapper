export interface FetchOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
}

const defaultHeaders = {
  'user-agent': 'job-intelligence-pipeline/0.1 (+personal research; respectful rate limits)',
  accept: 'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
};

export async function fetchText(url: string, options: FetchOptions = {}): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);

  try {
    const response = await fetch(url, {
      headers: { ...defaultHeaders, ...options.headers },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchJson<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
  const text = await fetchText(url, {
    ...options,
    headers: { accept: 'application/json', ...options.headers }
  });
  return JSON.parse(text) as T;
}
