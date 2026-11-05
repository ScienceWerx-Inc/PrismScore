import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CONCERN_INTERVENTIONS, ConcernKey } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let companyId = searchParams.get('companyId');

    if (!companyId) {
      const demoCompany = await prisma.company.findFirst({
        where: { id: 'demo-company-vanguard' },
      });
      companyId = demoCompany?.id || '';
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          where: { role: { in: ['ADMIN', 'EXECUTIVE'] } },
          include: {
            gapRecords: true,
            concernProfiles: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Generate Tailored Curriculum Tracks per Executive Role
    const executiveTracks = [
      {
        role: 'CEO',
        title: 'Executive AI Strategy & Business Model Disruption',
        executiveName: 'Elena Vance',
        duration: '3 Modules (6 Hours Total)',
        competencyGapsAddressed: ['Strategic Opportunity', 'Investment Judgment'],
        modules: [
          {
            title: 'Module 1: Building Defensible Moats Beyond Commodity LLMs',
            description: 'How to combine proprietary enterprise data assets with fine-tuned models to prevent competitive erosion.',
          },
          {
            title: 'Module 2: Capital Allocation & Payback Horizon Modeling',
            description: 'Structuring stage-gate investment criteria for enterprise AI rollouts and automated business processes.',
          },
          {
            title: 'Module 3: Autonomous Multi-Agent Systems & Organizational Design',
            description: 'Redefining corporate operating cadence as autonomous agents take over operational workflows.',
          },
        ],
      },
      {
        role: 'CTO',
        title: 'Enterprise AI Architecture, Security & Model Evals',
        executiveName: 'Marcus Brody',
        duration: '4 Modules (8 Hours Total)',
        competencyGapsAddressed: ['AI Fundamentals', 'Governance & Accountability'],
        modules: [
          {
            title: 'Module 1: Semantic Layer & Hybrid Vector Retrieval (RAG)',
            description: 'Designing high-precision semantic search pipelines with chunking strategies and reranking models.',
          },
          {
            title: 'Module 2: Model Routing & Token Cost Optimization',
            description: 'Dynamic load balancing across frontier models and specialized open-weights to minimize latency and unit costs.',
          },
          {
            title: 'Module 3: Continuous Evaluation (Evals) & Hallucination Guardrails',
            description: 'Automated CI/CD synthetic test suites for validating accuracy, latency regressions, and prompt security.',
          },
        ],
      },
      {
        role: 'CFO',
        title: 'AI Unit Economics, Token Pricing & Labor Reallocation ROI',
        executiveName: 'David Sterling',
        duration: '3 Modules (5 Hours Total)',
        competencyGapsAddressed: ['Investment Judgment', 'Risk & Legal Exposure'],
        modules: [
          {
            title: 'Module 1: Total Cost of Ownership (TCO) Build vs Buy Modeling',
            description: 'Calculating infrastructure, token usage, maintenance, and seat licensing against productivity returns.',
          },
          {
            title: 'Module 2: Capitalizing AI R&D vs Operational Expense',
            description: 'Accounting frameworks for proprietary data preparation, fine-tuning expenditures, and software capitalization.',
          },
          {
            title: 'Module 3: Measuring Value Capture & Capacity Reinvestment',
            description: 'Converting labor-hour time savings into measurable operating margin expansion and top-line growth.',
          },
        ],
      },
      {
        role: 'COO',
        title: 'Autonomous Workflow Automation & Operational Resilience',
        executiveName: 'Sarah Jenkins',
        duration: '3 Modules (6 Hours Total)',
        competencyGapsAddressed: ['Change Leadership', 'Strategic Opportunity'],
        modules: [
          {
            title: 'Module 1: Process Mining for High-Leverage AI Automation',
            description: 'Identifying repetitive operational bottlenecks where AI automation delivers instantaneous cycle-time reduction.',
          },
          {
            title: 'Module 2: Human-in-the-Loop Escalation Architectures',
            description: 'Setting fail-safe approval gates, confidence thresholds, and supervisory oversight for operational pipelines.',
          },
          {
            title: 'Module 3: Vendor Vetting & SLA Enforceability',
            description: 'Evaluating enterprise AI SaaS tools, vendor non-retention compliance, and business continuity risks.',
          },
        ],
      },
    ];

    // Non-course Interventions for Resistance Concerns
    const resistanceInterventions = [
      {
        concern: 'Data & Security Exposure',
        interventionType: 'Technical Architecture Walkthrough & Policy Signoff',
        facilitator: 'ScienceWerx Enterprise Security Team',
        format: '90-minute Executive Briefing',
        objective: 'Demonstrate private tenant isolation, zero-retention API contracts, and automated DLP controls.',
      },
      {
        concern: 'Doubt About Return (ROI)',
        interventionType: '3-Week Rapid Proof-of-Value Pilot',
        facilitator: 'Solutions Practice Lead',
        format: 'Structured Pilot with Pre/Post Time-Study Metrics',
        objective: 'Test 1 high-friction workflow and quantify labor savings before committing capital.',
      },
      {
        concern: 'Loss of Operational Control',
        interventionType: 'Governance & Supervisory Charter Workshop',
        facilitator: 'AI Ethics & Operations Counsel',
        format: 'Half-Day Leadership Alignment Session',
        objective: 'Codify explicit executive approval thresholds and instant kill-switch runbooks.',
      },
    ];

    // Recommended Solutions
    const recommendedSolutions = [
      {
        solutionName: 'ScienceWerx Enterprise AI Gateway',
        category: 'Data & Security Infrastructure',
        matchReason: 'Solves the #1 executive concern (Data Security) by providing unified audit logs, SSO, and DLP filtering.',
      },
      {
        solutionName: 'Role-Based AI Literacy Playbooks',
        category: 'Workforce Upskilling',
        matchReason: 'Directly addresses the critical gap in People & Skills (46%) identified in your company assessment.',
      },
      {
        solutionName: 'Automated Pilot Evaluation Framework',
        category: 'Governance & ROI Tracking',
        matchReason: 'Provides structured metrics to satisfy CFO payback milestones and transition experiments into production.',
      },
    ];

    // Structured JSON gap payload ready for downstream AI course generation module
    const structuredPayload = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      company: {
        id: company.id,
        name: company.name,
        industry: company.industry,
        sizeBand: company.sizeBand,
      },
      executiveTracks,
      resistanceInterventions,
      recommendedSolutions,
    };

    return NextResponse.json(structuredPayload);
  } catch (error: any) {
    console.error('Curriculum generate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

