export interface ParsedUrl {
  pathname: string;
  search: string;
  hash: string;
}

/**
 * Parse a URL into its components
 */
export function parseUrl(url: string): ParsedUrl {
  const fullUrl = url.startsWith('/') ? `http://localhost${url}` : url;

  try {
    const parsed = new URL(fullUrl);
    return {
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
    };
  } catch {
    return {
      pathname: url.split('?')[0].split('#')[0],
      search: '',
      hash: '',
    };
  }
}
