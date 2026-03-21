const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;

/**
 * Extract all URLs from a text string.
 */
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches || [];
}

/**
 * Check if a message contains any URLs.
 */
export function hasUrls(text: string): boolean {
  return URL_REGEX.test(text);
}
