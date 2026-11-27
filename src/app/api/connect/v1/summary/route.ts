import { handleProviderRequest } from '@/lib/connect/provider';
import { prismSummary } from '@/lib/connect/prismscore';

export const dynamic = 'force-dynamic';

/** ScienceWerx Connect v1: a display-ready card about one verified PrismScore user. */
export async function GET(request: Request) {
  return handleProviderRequest(request, 'summary', prismSummary);
}
