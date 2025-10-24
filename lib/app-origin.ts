/**
 * Constructs the application origin URL from environment variables.
 * Supports flexible format with or without http protocol prefix.
 */
export function getAppOrigin(): string {
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN;
  const subdomain = process.env.NEXT_PUBLIC_APP_ORIGIN_DEFAULT || 'app';

  if (!origin) {
    // Fallback for development/testing
    return 'https://app.whisperrnote.space';
  }

  // Remove protocol if present
  let cleanOrigin = origin.replace(/^https?:\/\//, '');

  // Construct the full URL
  const fullUrl = `${subdomain}.${cleanOrigin}`;

  // Ensure protocol
  if (fullUrl.startsWith('http://') || fullUrl.startsWith('https://')) {
    return fullUrl;
  }

  return `https://${fullUrl}`;
}
