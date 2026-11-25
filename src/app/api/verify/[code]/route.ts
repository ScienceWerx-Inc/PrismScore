import { NextResponse } from 'next/server';
import { handleAuthError } from '@/lib/auth/server';
import { verifyCertificate } from '@/lib/courses/progress';

export const dynamic = 'force-dynamic';

/** Public: anyone holding a certificate code can check it. */
export async function GET(_request: Request, { params }: { params: { code: string } }) {
  try {
    const result = await verifyCertificate(params.code.trim().toUpperCase());
    if (!result) return NextResponse.json({ status: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    return handleAuthError(error, 'Certificate verify error');
  }
}
