/**
 * Browser helpers for the session. The session itself is an HttpOnly cookie the
 * server sets; pages only react to 401s by sending the person to sign in.
 */
export function signInHref(next?: string): string {
  const target = next ?? (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
  return `/sign-in?next=${encodeURIComponent(target)}`;
}

/** Returns true (and navigates away) when the response says the session is missing. */
export function redirectIfSignedOut(res: Response): boolean {
  if (res.status !== 401) return false;
  window.location.assign(signInHref());
  return true;
}

/** Only same-site paths are allowed as post-sign-in destinations. */
export function safeNext(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
}
