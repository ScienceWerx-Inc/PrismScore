import { handleProviderRequest } from '@/lib/connect/provider';
import { prismCertificates } from '@/lib/connect/prismscore';

export const dynamic = 'force-dynamic';

/** ScienceWerx Connect v1: one verified Prism School user's certificates. */
export async function GET(request: Request) {
  return handleProviderRequest(request, 'certificates', prismCertificates);
}
