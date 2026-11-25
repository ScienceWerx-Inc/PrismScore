import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { companyAccess, handleAuthError } from '@/lib/auth/server';
import { ASSESSMENT } from '@/lib/product';

export async function POST(request: Request) {
  try {
    // Payments are still simulated. Only the company's own admin can unlock it,
    // and the price comes from the server, not the request.
    const { companyId, user } = await companyAccess(null, { roles: ['ADMIN'] });
    const amount = ASSESSMENT.fullReportPrice;

    // 1. Record simulated payment
    const payment = await prisma.payment.create({
      data: {
        companyId,
        amount: Number(amount),
        currency: 'USD',
        providerReference: `sim_${Date.now()}`,
        status: 'COMPLETED',
      },
    });

    // 2. Update company plan status to PAID
    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        planStatus: 'PAID',
        paymentStatus: 'PAID',
      },
    });

    // 3. Audit Log
    await prisma.auditLog.create({
      data: {
        actor: user!.email,
        action: 'PAYMENT_RECEIVED',
        entity: `Company:${companyId}`,
        details: `Unlocked Full Executive Report for $${amount}`,
      },
    });

    return NextResponse.json({ success: true, planStatus: company.planStatus, paymentId: payment.id });
  } catch (error) {
    return handleAuthError(error, 'Payment checkout error');
  }
}

