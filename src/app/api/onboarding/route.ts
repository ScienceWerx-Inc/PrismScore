import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { inviteExpiry, newInviteToken } from '@/lib/auth/invites';
import { hashPassword, passwordProblem } from '@/lib/auth/password';
import { attachSession, handleAuthError, normalizeEmail } from '@/lib/auth/server';
import { sendVerificationEmailQuietly } from '@/lib/auth/verifyEmail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      industry,
      sizeBand,
      country,
      adminEmail,
      adminRole,
      alsoTakesClevel,
      executives = [],
      password,
    } = body;

    if (!companyName || !adminEmail) {
      return NextResponse.json(
        { error: 'Company name and work email are required.' },
        { status: 400 }
      );
    }

    // Name is optional at sign-up; fall back to the email's local part
    const adminName: string =
      (typeof body.adminName === 'string' && body.adminName.trim()) || String(adminEmail).split('@')[0];

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return NextResponse.json(
        { error: 'Invalid admin email address.' },
        { status: 400 }
      );
    }

    const pwProblem = passwordProblem(password);
    if (pwProblem) {
      return NextResponse.json({ error: pwProblem }, { status: 400 });
    }

    const normalizedAdmin = normalizeEmail(adminEmail)!;
    const existing = await prisma.user.findUnique({ where: { email: normalizedAdmin } });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.', signIn: true },
        { status: 409 }
      );
    }
    if (!Array.isArray(executives) || executives.length > 25) {
      return NextResponse.json({ error: 'Invite at most 25 executives at a time.' }, { status: 400 });
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
    const passwordHash = await hashPassword(password);
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
      omit: { sessionVersion: false },
      data: {
        email: normalizedAdmin,
        name: adminName,
        role: 'ADMIN',
        passwordHash,
        lastSignInAt: new Date(),
        companyId: company.id,
        execRoleTitle: adminRole || 'CEO',
        alsoTakesClevel: Boolean(alsoTakesClevel),
      },
    });

    // 3. Create Invitations for entered executives
    for (const exec of executives) {
      if (exec.email && exec.name) {
        const token = newInviteToken();
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
            expiresAt: inviteExpiry(),
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

    // Sign-up never proves the address is theirs; ask them to confirm it.
    await sendVerificationEmailQuietly(adminUser, request.url);

    return attachSession(
      NextResponse.json({
        success: true,
        companyId: company.id,
        userId: adminUser.id,
        submissionId: submission.id,
      }),
      adminUser,
    );
  } catch (error) {
    return handleAuthError(error, 'Onboarding error');
  }
}

