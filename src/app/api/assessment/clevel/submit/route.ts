import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  computeExecutiveGap,
  DEFAULT_TARGET_LEVELS_BY_ROLE,
  CompetencyLevel,
  CONCERN_TYPES,
  ConcernKey,
} from '@/lib/scoring';

export async function POST(request: Request) {
  try {
    const { token, responses } = await request.json();

    if (!token || !responses) {
      return NextResponse.json({ error: 'Token and responses are required.' }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { company: true },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
    }

    // 1. Upsert User
    const user = await prisma.user.upsert({
      where: { email: invitation.email },
      update: {
        name: invitation.name || 'Executive',
        role: 'EXECUTIVE',
        execRoleTitle: invitation.execRole || 'OTHER',
        companyId: invitation.companyId,
      },
      create: {
        email: invitation.email,
        name: invitation.name || 'Executive',
        role: 'EXECUTIVE',
        execRoleTitle: invitation.execRole || 'OTHER',
        companyId: invitation.companyId,
      },
    });

    // 2. Create Submission
    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        companyId: invitation.companyId,
        assessmentTypeId: 'CLEVEL',
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // 3. Process Responses
    const optionIds = Object.values(responses) as string[];
    const options = await prisma.option.findMany({
      where: { id: { in: optionIds } },
      include: {
        question: {
          include: { dimension: true },
        },
      },
    });

    const roleTitle = invitation.execRole || 'OTHER';
    const roleTargets = DEFAULT_TARGET_LEVELS_BY_ROLE[roleTitle] || DEFAULT_TARGET_LEVELS_BY_ROLE.OTHER;

    for (const opt of options) {
      // Record individual response
      await prisma.response.create({
        data: {
          submissionId: submission.id,
          questionId: opt.questionId,
          optionId: opt.id,
        },
      });

      // Layer 1 Knowledge: compute gap
      if (opt.question.layer === 'KNOWLEDGE' && opt.mappedLevel) {
        const competencyName = opt.question.dimension.name;
        const currentLevel = opt.mappedLevel as CompetencyLevel;
        const targetLevel = (roleTargets[competencyName] || 'LEADING') as CompetencyLevel;
        const gapCalc = computeExecutiveGap(competencyName, currentLevel, targetLevel);

        await prisma.gapRecord.create({
          data: {
            userId: user.id,
            dimensionId: opt.question.dimensionId,
            currentLevel: gapCalc.currentLevel,
            targetLevel: gapCalc.targetLevel,
            gap: gapCalc.gap,
            priority: gapCalc.priority,
          },
        });
      }

      // Layer 3 Resistance: record concern
      if (opt.question.layer === 'RESISTANCE' && opt.concernType) {
        await prisma.concernProfile.create({
          data: {
            userId: user.id,
            concernType: opt.concernType,
            strength: 0.9,
          },
        });
      }
    }

    // 4. Mark invitation as ACCEPTED
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        actor: user.name,
        action: 'EXECUTIVE_ASSESSMENT_COMPLETED',
        entity: `User:${user.id}`,
        details: `C-Level diagnostic completed by ${user.name} (${roleTitle})`,
      },
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      companyId: invitation.companyId,
    });
  } catch (error: any) {
    console.error('C-Level submission error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

