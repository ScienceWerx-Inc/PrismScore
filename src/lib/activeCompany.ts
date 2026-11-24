/**
 * The company whose data a dashboard page should show: an explicit ?companyId=
 * in the URL, otherwise the company this browser onboarded. Empty means "none",
 * and the APIs then show only the seeded demo company.
 */
export function getActiveCompanyId(): string {
  if (typeof window === 'undefined') return '';
  return (
    new URLSearchParams(window.location.search).get('companyId') ||
    localStorage.getItem('activeCompanyId') ||
    ''
  );
}

/** Appends ?companyId= to an API or page path when there is one. */
export function withCompany(path: string, companyId: string): string {
  if (!companyId) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}companyId=${encodeURIComponent(companyId)}`;
}
