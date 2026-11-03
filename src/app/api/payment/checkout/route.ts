import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { companyId, amount = 149 } = await request.json();

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

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
        actor: 'Billing System',
        action: 'PAYMENT_RECEIVED',
        entity: `Company:${companyId}`,
        details: `Unlocked Full Executive Report for $${amount}`,
      },
    });

    return NextResponse.json({ success: true, company, payment });
  } catch (error: any) {
    console.error('Payment checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

