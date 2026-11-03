import { PrismaClient } from '@prisma/client';
import {
  COMPANY_DIMENSIONS,
  COMPANY_QUESTIONS,
  CLEVEL_DIMENSIONS,
  CLEVEL_QUESTIONS,
  THREE_SIXTY_QUESTIONS,
} from '../src/lib/seed-data';
import { calculateCompanyScore, computeExecutiveGap } from '../src/lib/scoring';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with question banks and initial data...');

  // 1. Assessment Types
  await prisma.assessmentType.upsert({
    where: { id: 'COMPANY' },
    update: {},
    create: {
      id: 'COMPANY',
      name: 'Company Assessment',
      description: 'Self-serve assessment of 25 questions scored out of 500 across 5 weighted dimensions.',
      version: '1.0',
    },
  });

  await prisma.assessmentType.upsert({
    where: { id: 'CLEVEL' },
    update: {},
    create: {
      id: 'CLEVEL',
      name: 'C-Level Executive Assessment',
      description: '3-layer executive assessment measuring Knowledge, Awareness accuracy, and Resistance concern profiles.',
      version: '1.0',
    },
  });

  await prisma.assessmentType.upsert({
    where: { id: 'THREE_SIXTY' },
    update: {},
    create: {
      id: 'THREE_SIXTY',
      name: '360 Staff Assessment',
      description: 'Staff & manager assessment measuring operational reality and ground-level AI adoption.',
      version: '1.0',
    },
  });

  // 2. Company Dimensions
  for (const dim of COMPANY_DIMENSIONS) {
    await prisma.dimension.upsert({
      where: { id: dim.id },
      update: {
        name: dim.name,
        weight: dim.weight,
        domain: dim.domain,
        description: dim.description,
        order: dim.order,
      },
      create: {
        id: dim.id,
        assessmentTypeId: 'COMPANY',
        name: dim.name,
        weight: dim.weight,
        domain: dim.domain,
        description: dim.description,
        order: dim.order,
      },
    });
  }

  // 3. C-Level Dimensions
  for (const dim of CLEVEL_DIMENSIONS) {
    await prisma.dimension.upsert({
      where: { id: dim.id },
      update: {
        name: dim.name,
        weight: dim.weight,
        domain: dim.domain,
        description: dim.description,
        order: dim.order,
      },
      create: {
        id: dim.id,
        assessmentTypeId: 'CLEVEL',
        name: dim.name,
        weight: dim.weight,
        domain: dim.domain,
        description: dim.description,
        order: dim.order,
      },
    });
  }

  // 4. Company Questions & Options
  for (const q of COMPANY_QUESTIONS) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        text: q.text,
        order: q.order,
        roleFilter: q.roleFilter || 'ALL',
      },
      create: {
        id: q.id,
        assessmentTypeId: q.assessmentTypeId,
        dimensionId: q.dimensionId,
        layer: q.layer || null,
        text: q.text,
        scenarioContext: q.scenarioContext || null,
        order: q.order,
        roleFilter: q.roleFilter || 'ALL',
      },
    });

    for (const opt of q.options) {
      await prisma.option.upsert({
        where: { id: opt.id },
        update: {
          text: opt.text,
          points: opt.points ?? 0,
          order: opt.order,
        },
        create: {
          id: opt.id,
          questionId: q.id,
          text: opt.text,
          points: opt.points ?? 0,
          order: opt.order,
        },
      });
    }
  }

  // 5. C-Level Questions & Options
  for (const q of CLEVEL_QUESTIONS) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        text: q.text,
        order: q.order,
        roleFilter: q.roleFilter || 'ALL',
      },
      create: {
        id: q.id,
        assessmentTypeId: q.assessmentTypeId,
        dimensionId: q.dimensionId,
        layer: q.layer || null,
        text: q.text,
        scenarioContext: q.scenarioContext || null,
        order: q.order,
        roleFilter: q.roleFilter || 'ALL',
      },
    });

    for (const opt of q.options) {
      await prisma.option.upsert({
        where: { id: opt.id },
        update: {
          text: opt.text,
          points: opt.points ?? 0,
          mappedLevel: opt.mappedLevel || null,
          concernType: opt.concernType || null,
          order: opt.order,
        },
        create: {
          id: opt.id,
          questionId: q.id,
          text: opt.text,
          points: opt.points ?? 0,
          mappedLevel: opt.mappedLevel || null,
          concernType: opt.concernType || null,
          order: opt.order,
        },
      });
    }
  }

  // 6. 360 Questions & Options
  for (const q of THREE_SIXTY_QUESTIONS) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        text: q.text,
        order: q.order,
      },
      create: {
        id: q.id,
        assessmentTypeId: q.assessmentTypeId,
        dimensionId: q.dimensionId,
        text: q.text,
        order: q.order,
        roleFilter: 'ALL',
      },
    });

    for (const opt of q.options) {
      await prisma.option.upsert({
        where: { id: opt.id },
        update: {
          text: opt.text,
          points: opt.points ?? 0,
          order: opt.order,
        },
        create: {
          id: opt.id,
          questionId: q.id,
          text: opt.text,
          points: opt.points ?? 0,
          order: opt.order,
        },
      });
    }
  }

  // 7. Seed Demo Company: "Vanguard Systems"
  const company = await prisma.company.upsert({
    where: { id: 'demo-company-vanguard' },
    update: {},
    create: {
      id: 'demo-company-vanguard',
      name: 'Vanguard Systems, Inc.',
      industry: 'Software & Technology',
      sizeBand: '51-200 employees',
      country: 'United States',
      planStatus: 'PAID',
      paymentStatus: 'PAID',
      minExecutiveThreshold: 3,
    },
  });

  // Admin User: Elena Vance (CEO)
  const adminUser = await prisma.user.upsert({
    where: { email: 'elena.vance@vanguard-demo.com' },
    update: {},
    create: {
      id: 'demo-user-elena',
      email: 'elena.vance@vanguard-demo.com',
      name: 'Elena Vance',
      role: 'ADMIN',
      execRoleTitle: 'CEO',
      alsoTakesClevel: true,
      companyId: company.id,
    },
  });

  // Create Completed Company Assessment Submission
  const scoringData = calculateCompanyScore({
    STRATEGY: 12, // 80%
    USE_VALUE: 10, // 66.7%
    DATA_TECH: 8,  // 53.3%
    GOVERNANCE: 11, // 73.3%
    PEOPLE: 7,   // 46.7%
  });

  const companySub = await prisma.submission.upsert({
    where: { id: 'demo-sub-company-1' },
    update: {},
    create: {
      id: 'demo-sub-company-1',
      userId: adminUser.id,
      companyId: company.id,
      assessmentTypeId: 'COMPANY',
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  await prisma.result.upsert({
    where: { submissionId: companySub.id },
    update: {},
    create: {
      submissionId: companySub.id,
      totalScore: scoringData.totalScore,
      band: scoringData.band,
      perDimensionPercentages: JSON.stringify(scoringData.dimensionPercentages),
      strengths: JSON.stringify(scoringData.strengths),
      gaps: JSON.stringify(scoringData.criticalGaps),
      priorityActions: JSON.stringify(scoringData.priorityActions),
    },
  });

  // Seed C-Level Executives
  const execs = [
    {
      id: 'demo-user-marcus',
      name: 'Marcus Brody',
      email: 'marcus.brody@vanguard-demo.com',
      role: 'EXECUTIVE',
      execRoleTitle: 'CTO',
      completed: true,
      concerns: ['DATA_SECURITY', 'RISK_LIABILITY'],
      levels: {
        'AI Fundamentals': 'PROFICIENT',
        'Strategic Opportunity': 'PROFICIENT',
        'Risk & Legal Exposure': 'LEADING',
        'Investment Judgment': 'PRACTICING',
        'Governance & Accountability': 'LEADING',
        'Change Leadership': 'AWARE',
      },
    },
    {
      id: 'demo-user-david',
      name: 'David Sterling',
      email: 'david.sterling@vanguard-demo.com',
      role: 'EXECUTIVE',
      execRoleTitle: 'CFO',
      completed: true,
      concerns: ['DOUBT_ABOUT_RETURN', 'LOSS_OF_CONTROL'],
      levels: {
        'AI Fundamentals': 'AWARE',
        'Strategic Opportunity': 'PRACTICING',
        'Risk & Legal Exposure': 'PROFICIENT',
        'Investment Judgment': 'PROFICIENT',
        'Governance & Accountability': 'PRACTICING',
        'Change Leadership': 'AWARE',
      },
    },
    {
      id: 'demo-user-sarah',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@vanguard-demo.com',
      role: 'EXECUTIVE',
      execRoleTitle: 'COO',
      completed: true,
      concerns: ['LACK_OF_TIME', 'PAST_BAD_EXP'],
      levels: {
        'AI Fundamentals': 'PRACTICING',
        'Strategic Opportunity': 'PROFICIENT',
        'Risk & Legal Exposure': 'PRACTICING',
        'Investment Judgment': 'PRACTICING',
        'Governance & Accountability': 'PROFICIENT',
        'Change Leadership': 'LEADING',
      },
    },
  ];

  for (const exec of execs) {
    const user = await prisma.user.upsert({
      where: { email: exec.email },
      update: {},
      create: {
        id: exec.id,
        email: exec.email,
        name: exec.name,
        role: exec.role,
        execRoleTitle: exec.execRoleTitle,
        companyId: company.id,
      },
    });

    // Create completed submission
    await prisma.submission.upsert({
      where: { id: `demo-sub-${exec.id}` },
      update: {},
      create: {
        id: `demo-sub-${exec.id}`,
        userId: user.id,
        companyId: company.id,
        assessmentTypeId: 'CLEVEL',
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Compute gaps
    for (const [comp, current] of Object.entries(exec.levels)) {
      const target = 'LEADING';
      const gapCalc = computeExecutiveGap(comp, current as any, target);

      await prisma.gapRecord.create({
        data: {
          userId: user.id,
          dimensionId: 'AI_FUNDAMENTALS', // linked to dimension
          currentLevel: gapCalc.currentLevel,
          targetLevel: gapCalc.targetLevel,
          gap: gapCalc.gap,
          priority: gapCalc.priority,
        },
      });
    }

    // Add concern profiles
    for (const c of exec.concerns) {
      await prisma.concernProfile.create({
        data: {
          userId: user.id,
          concernType: c,
          strength: 0.85,
        },
      });
    }
  }

  // Pending Invite (Amara Patel - CHRO)
  await prisma.invitation.upsert({
    where: { token: 'invite-token-amara-chro' },
    update: {},
    create: {
      id: 'demo-inv-amara',
      companyId: company.id,
      name: 'Amara Patel',
      email: 'amara.patel@vanguard-demo.com',
      role: 'EXECUTIVE',
      execRole: 'CHRO',
      token: 'invite-token-amara-chro',
      status: 'SENT',
      invitedBy: 'Elena Vance',
    },
  });

  // Seed 360 respondents (8 staff respondents across Engineering & Operations)
  const departments = ['Engineering', 'Engineering', 'Engineering', 'Operations', 'Operations', 'Operations', 'Operations', 'Operations'];
  for (let i = 0; i < departments.length; i++) {
    const dept = departments[i];
    const staffUser = await prisma.user.upsert({
      where: { email: `staff.${i + 1}@vanguard-demo.com` },
      update: {},
      create: {
        email: `staff.${i + 1}@vanguard-demo.com`,
        name: `Team Member ${i + 1}`,
        role: 'STAFF',
        department: dept,
        companyId: company.id,
      },
    });

    await prisma.submission.upsert({
      where: { id: `demo-sub-staff-${i + 1}` },
      update: {},
      create: {
        id: `demo-sub-staff-${i + 1}`,
        userId: staffUser.id,
        companyId: company.id,
        assessmentTypeId: 'THREE_SIXTY',
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

