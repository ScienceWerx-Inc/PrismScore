import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      industry,
      sizeBand,
      country,
      adminName,
      adminEmail,
      adminRole,
      alsoTakesClevel,
      executives = [],
    } = body;

    if (!companyName || !adminEmail || !adminName) {
      return NextResponse.json(
        { error: 'Company name, admin name, and email are required.' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return NextResponse.json(
        { error: 'Invalid admin email address.' },
        { status: 400 }
      );
    }

    // Check for duplicate executive emails
    const seenEmails = new Set<string>([adminEmail.toLowerCase()]);
    for (const exec of executives) {
      if (exec.email) {
        const lower = exec.email.toLowerCase().trim();
        if (!emailRegex.test(lower)) {
          return NextResponse.json(
            { error: `Invalid email address format: ${exec.email}` },
            { status: 400 }
          );
        }
        if (seenEmails.has(lower)) {
          return NextResponse.json(
            { error: `Duplicate email address detected within company: ${exec.email}` },
            { status: 400 }
          );
        }
        seenEmails.add(lower);
      }
    }

    // 1. Create Company
    const company = await prisma.company.create({
      data: {
        name: companyName,
        industry: industry || 'Technology',
        sizeBand: sizeBand || '11-50 employees',
        country: country || 'United States',
        planStatus: 'FREE',
        paymentStatus: 'UNPAID',
        minExecutiveThreshold: 3,
      },
    });

    // 2. Create Admin User
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail.toLowerCase().trim(),
        name: adminName,
        role: 'ADMIN',
        companyId: company.id,
        execRoleTitle: adminRole || 'CEO',
        alsoTakesClevel: Boolean(alsoTakesClevel),
      },
    });

    // 3. Create Invitations for entered executives
    for (const exec of executives) {
      if (exec.email && exec.name) {
        const token = crypto.randomBytes(24).toString('hex');
        await prisma.invitation.create({
          data: {
            companyId: company.id,
            name: exec.name,
            email: exec.email.toLowerCase().trim(),
            role: 'EXECUTIVE',
            execRole: exec.role || 'OTHER',
            token,
            status: 'PENDING',
            invitedBy: adminName,
          },
        });
      }
    }

    // 4. Create empty Submission for the Company Assessment
    const submission = await prisma.submission.create({
      data: {
        userId: adminUser.id,
        companyId: company.id,
        assessmentTypeId: 'COMPANY',
        status: 'IN_PROGRESS',
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        actor: adminName,
        action: 'COMPANY_CREATED',
        entity: `Company:${company.id}`,
        details: `Created workspace for ${companyName} with ${executives.length} invited executives`,
      },
    });

    return NextResponse.json({
      success: true,
      companyId: company.id,
      userId: adminUser.id,
      submissionId: submission.id,
    });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize company assessment.' },
      { status: 500 }
    );
  }
}

