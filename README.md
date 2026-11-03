# PrismScore: AI Literacy Assessment Platform

Owner: ScienceWerx  
Product Name: PrismScore (Prism AI)  
Reference Model: iStartup Score (istartupscore.com)  

---

## Overview

PrismScore is an enterprise software platform designed to evaluate how well small and medium-sized enterprises (SMEs) understand, govern, and deploy artificial intelligence.

Modeled after the transparency and methodology of iStartup Score, PrismScore pairs a self-serve diagnostic with a published scoring formula, an instant free score, an in-depth executive deliverable, and plain disclosures regarding self-reported limits.

Beyond surface-level ratings, the platform diagnoses organizational blind spots:
1. Company AI Maturity across five weighted operational dimensions.
2. C-Level Alignment and Competency across six strategic domains.
3. Leadership Resistance Types (identifying conditions and hesitations, not judging individuals).
4. Frontline vs. Leadership Perception Gaps through an anonymous 360 staff diagnostic.
5. Tailored Executive Action Plans feeding downstream AI course generators and solution evaluators.

---

## Core Principles

- Published Scoring Formula: All scoring weights, dimension formulas, and readiness boundaries are completely transparent and published on the platform.
- Scenario-Based Evaluation: Avoids vague 1-to-5 self-assessments. All questions present concrete, recognizable business situations with calibrated point values.
- Psychologically Safe Diagnostics: Evaluates organizational readiness and friction points. It is not an employee performance audit or certification.
- Role-Based Confidentiality: Individual executive responses are restricted to the respondent and company administrator. Aggregated team heatmaps unlock only after reaching minimum completion thresholds.
- Ground-Truth Verification: Frontline staff 360 surveys reveal discrepancies between executive assumptions and operational reality.

---

## Published Scoring Methodology

### The Five Dimensions and Weights

The Company Assessment consists of 25 situation-based questions (5 questions per dimension). Each question offers four distinct situational options scored from 0 to 3 points, resulting in a maximum of 15 points per dimension.

| Dimension | Weight | Operational Scope |
| :--- | :--- | :--- |
| Strategy and Leadership | 25% | Direction, ownership, investment intent, leadership alignment |
| Use and Value | 20% | Active operational use, tracked ROI, pilot-to-production ratio |
| Data and Technology | 20% | Data structure, software tooling, API integration, shadow AI |
| Governance and Risk | 20% | Acceptable use policies, IP protection, vendor security, incident plans |
| People and Skills | 15% | Formal training, prompt engineering competency, adoption culture |

### Mathematical Formula

Each dimension result is converted to a percentage:
`Dimension % = (Points Earned / 15) * 100`

The composite PrismScore (0 to 500 scale) is calculated using the published weighted formula:
`Score = 5 * (Strategy * 0.25 + Use * 0.20 + Data * 0.20 + Governance * 0.20 + People * 0.15)`

### Readiness Bands

| Band Name | Score Range | Description |
| :--- | :--- | :--- |
| Unaware | 0 to 200 | AI is absent from the leadership agenda. High shadow AI risk and legal exposure. |
| Exploring | 201 to 300 | Ad-hoc experimentation exists without unified ROI tracking or enterprise governance. |
| Established | 301 to 400 | Defined executive sponsors, sanctioned enterprise tools, and documented risk policies. |
| AI-led | 401 to 500 | Multi-agent workflows, continuous model evals, proprietary data moats, and high-leverage culture. |

---

## Product Architecture and Implementation Phases

### Phase 0: Foundations and Relational Architecture
- Next.js 14 App Router, TypeScript, Tailwind CSS, and SQLite powered by Prisma ORM.
- Normalized data model supporting multi-tenant company workspaces, user roles, tokenized invitations, question banks, submissions, responses, gap records, concern profiles, payments, and audit logs.
- Seed data loader containing complete question banks for company, C-level, and 360 assessments, plus a preloaded test workspace (Vanguard Systems).

### Phase 1: Company Assessment and Paid Executive Report
- Landing page with hero, four-step workflow, published formula explanation, readiness band breakdowns, free vs. paid feature matrix, sample report teaser, and FAQ accordion.
- Dynamic onboarding wizard: Headcount field dynamically generates C-level invitee rows while preserving previously entered data. Includes email validation, duplicate prevention, and "add later" bypass.
- Assessment wizard: 25 situation questions with real-time progress indicators, dimensional weighting display, auto-save per answer, jump navigator, and demo auto-fill utility.
- Results deliverable: Free score card (score out of 500 and readiness band) and paid full report ($149) unlocking dimensional breakdowns, strengths, critical gaps, prioritized actions with estimated score impact, full response audit log, and print/PDF export.

### Phase 2: C-Level Assessment and Leadership Dashboard
- Tokenized individual invitation links for executives (CEO, CTO, CFO, COO, CMO, CHRO, etc.) with reminder and revocation controls.
- Three-Layer Confidential Executive Diagnostic:
  - Layer 1 (Knowledge): Decision scenarios mapping answers to competency levels (Unaware, Aware, Practicing, Proficient, Leading) with role-specific blocks (e.g., CTO on architecture and security, CFO on unit economics and token costs, CHRO on workforce impact).
  - Layer 2 (Awareness): Tests perception of actual internal adoption and policy compliance against ground truth.
  - Layer 3 (Resistance): Forced trade-offs mapping to eight concern types (Risk and Liability, Loss of Control, ROI Doubt, Job Impact, Data Security, Ethics, Lack of Time, Past Bad Experience).
- Executive Dashboard:
  - Invitee status tracking (Invited, Started, Completed).
  - Minimum Completion Threshold Rule: Heatmaps remain locked until at least 3 executives complete their assessment (includes an interactive toggle to verify locked vs. unlocked states).
  - C-Level Competency Alignment Heatmap across six core domains.
  - Leadership Resistance Map paired with non-course interventions (workshops, proofs-of-value, briefings).
  - Individual Executive Gap Profiles (Target Level minus Current Level, gap size, and priority).

### Phase 3: 360 Staff Diagnostic and Anonymity Thresholds
- Staff and manager survey launched from the company workspace via individual invite or CSV bulk upload.
- Anonymity Threshold Rule: Results are displayed only for departments or groups with at least 5 respondents. Groups with fewer than 5 respondents are merged into an aggregated departmental cohort to preserve psychological safety.
- Ground-truth comparison view contrasting frontline realities with C-level executive assumptions.

### Phase 4: Tailored Course Engine and Solution Recommendations
- Structured gap profile consumer generating personalized learning tracks for each executive role (CEO, CTO, CFO, COO).
- Non-course intervention roadmap targeting identified resistance concerns.
- Objective solution matching recommending ScienceWerx and enterprise platforms based on specific organizational deficiencies.
- One-click structured JSON export for consumption by downstream AI course-generation modules.

---

## Technology Stack

- Framework: Next.js 14.2 (App Router, Server Actions, Route Handlers)
- Language: TypeScript 5.6 (Strict Type Safety)
- Styling: Tailwind CSS 3.4
- Database: SQLite with Prisma ORM 5.22
- Unit Testing: Vitest 2.1
- Icons: Lucide React
- Visual Effects: Canvas Confetti

---

## Project Structure

```
├── prisma/
│   ├── schema.prisma               # Complete relational data model
│   └── seed.ts                     # Database seed loader with Vanguard demo data
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── assessment/
│   │   │   │   ├── clevel/         # C-level question retrieval and submission
│   │   │   │   └── company/        # Company questions, auto-save, and server scoring
│   │   │   ├── curriculum/         # Downstream course payload generation
│   │   │   ├── dashboard/          # Dashboard metrics, heatmaps, and resistance data
│   │   │   ├── invitations/        # Invitee dispatch, reminder, and revocation
│   │   │   ├── onboarding/         # Company creation and dynamic row persistence
│   │   │   ├── payment/            # Simulated report checkout and unlock
│   │   │   ├── report/             # Report data and response audit retrieval
│   │   │   └── three-sixty/        # Staff bulk invite and anonymous aggregation
│   │   ├── assessment/
│   │   │   ├── clevel/[token]/     # 3-Layer executive diagnostic interface
│   │   │   └── company/            # 25-Question company assessment wizard
│   │   ├── dashboard/
│   │   │   ├── curriculum/         # Tailored courses, interventions, JSON export
│   │   │   ├── three-sixty/        # Staff 360 management and blindspot comparisons
│   │   │   └── page.tsx            # Executive dashboard, alignment heatmap, radar
│   │   ├── onboarding/             # Company setup and C-level headcount rows
│   │   ├── report/
│   │   │   └── company/[id]/       # Score certificate, paid report, and print/PDF
│   │   ├── globals.css             # Base styles and print media rules
│   │   ├── layout.tsx              # Global header, navigation, and footer
│   │   └── page.tsx                # Public landing page modeled on iStartup Score
│   └── lib/
│       ├── __tests__/
│       │   └── scoring.test.ts     # Automated unit tests for scoring formulas
│       ├── db.ts                   # Singleton Prisma client instance
│       ├── scoring.ts              # Pure scoring, gap, and readiness band algorithms
│       └── seed-data.ts            # Full question bank definitions and dimensions
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Local Setup and Installation

### Prerequisites

- Node.js 18.18 or higher (Node.js 20 LTS recommended)
- npm 9 or higher

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd AI_Assessement
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Initialize the SQLite database and generate the Prisma client:
   ```bash
   npx prisma db push
   ```

4. Seed the database with question banks and the demo workspace:
   ```bash
   npx tsx prisma/seed.ts
   ```

5. Start the local development server:
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## Verification and Testing

### Automated Unit Tests

Run the test suite to verify scoring accuracy, readiness band mappings, boundary conditions, and executive gap calculations:

```bash
npm run test
```

### Production Build

Verify the production build and type checking:

```bash
npm run build
```

---

## Key URLs and Testing Routes

- Public Landing Page: http://localhost:3000
- Company Onboarding: http://localhost:3000/onboarding
- Company Assessment: http://localhost:3000/assessment/company
- Sample Company Report: http://localhost:3000/report/company/demo-sub-company-1
- Executive Dashboard: http://localhost:3000/dashboard
- Executive Diagnostic (Marcus Brody, CTO): http://localhost:3000/assessment/clevel/invite-token-amara-chro
- Staff 360 Diagnostic: http://localhost:3000/dashboard/three-sixty
- Tailored Curriculum and Action Engine: http://localhost:3000/dashboard/curriculum

---

## Privacy and Ethics Framework

- Non-Certification Notice: Results are self-reported diagnostics for organizational planning, not certified compliance audits.
- Psychological Safety: Resistance is framed as operational conditions and prerequisites for adoption, never as a negative judgment on individuals.
- Anonymity Threshold: Any staff group with fewer than 5 respondents is hidden or merged into an aggregated category.
- Minimum Executive Quorum: Executive team heatmaps remain hidden until at least 3 leaders submit responses.

---

## Copyright and Attribution

Designed for ScienceWerx.  
Methodological inspiration: iStartup Score (istartupscore.com).

