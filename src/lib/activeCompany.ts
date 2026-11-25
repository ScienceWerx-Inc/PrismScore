/**
 * The company a dashboard page asks the API for. Signed-in users always get
 * their own company from the server; the only id a page passes on is the one in
 * the URL, which the server honours just for the public demo workspace.
 */
export function getActiveCompanyId(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('companyId') || '';
}

/** Appends ?companyId= to an API or page path when there is one. */
export function withCompany(path: string, companyId: string): string {
  if (!companyId) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}companyId=${encodeURIComponent(companyId)}`;
}
