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
- Next.js 14 App Router, TypeScript, Tailwind CSS, and Postgres powered by Prisma ORM.
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
- Database: Postgres (Prisma Postgres on Vercel) with Prisma ORM 5.22 and versioned migrations
- Auth: email + password (scrypt) with signed, revocable session cookies (`src/lib/auth`)
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
- Postgres 14 or higher running locally

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd AI_Assessement
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`, point `DATABASE_URL` at a local database, then apply the migrations:
   ```bash
   createdb prismscore_dev
   npx prisma migrate dev
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
- Staff 360 Diagnostic: http://localhost:3000/dashboard/three-sixty
- Tailored Curriculum and Action Engine: http://localhost:3000/dashboard/curriculum

## Gap-Closing Courses and Certificates

- After the company assessment (admin) or the C-level diagnostic (executive), each person can build a course at `/learn`. Which gaps it covers is decided by code in `src/lib/courses/plan.ts`: one module per weak area (below 60% for the company; below the role's target level for executives), 2 to 4 modules, each closing with a hands-on workshop and a graded quiz.
- The model only writes the outline, the lessons and the quizzes (`src/lib/courses/ai.ts`, prompts ported from iStartup). Calls go straight to the Gemini API with the ScienceWerx Google AI Studio key in `GOOGLE_GENERATIVE_AI_API_KEY` (`AI_MODEL`, default `gemini-3.5-flash`, the model MoreWerx uses with the same key). The browser drives the build one model call per request, so no function runs long, and a build resumes where it stopped.
- Quizzes: 70% to pass, best of three attempts, answers shown only once the quiz is over. Answer keys never reach the browser before that.
- Completing every lesson and passing every quiz issues a certificate (`PS-XXXXXXXXXX`, valid six months) that anyone can check at `/verify/<code>`.
- Admins see each leader's course status and certificates at `/dashboard/curriculum`, with interventions matched to the concerns leaders reported.
- Token usage per call is recorded in `AiUsage`.

## Authentication and Access

- Company admins create their account in onboarding; invited executives set a password on their invitation link. Sign in at `/sign-in`.
- Sessions are an HttpOnly cookie signed with `AUTH_SECRET`. Every request re-reads the user, so `POST /api/auth/sign-out {"everywhere":true}` (or deleting the user) ends all their sessions at once. Production refuses to sign sessions without `AUTH_SECRET`.
- Every API route derives the company from the session. Anonymous visitors can only read the seeded demo workspace (sample report and sample dashboard); it is read-only, and its invitation link is disabled.
- Invitation links expire after 14 days and work once.
- Password hashes are omitted from every Prisma query by default (`src/lib/db.ts`).
- This is a temporary sign-in until PrismScore moves to Firebase Auth; only `src/lib/auth/server.ts` needs to change.


## Email Verification

- Sign-up never proved that someone owns the address they typed, so accounts carry `emailVerifiedAt`. A verification link (HMAC-signed with `AUTH_SECRET`, single-purpose, bound to the address, valid 24 hours) is emailed after onboarding and after an invited executive sets their password. Signed-in, unverified users see a banner with "Send a new link" (`POST /api/auth/verify-email/send`, at most 3 per user per hour, counted in `EmailVerificationSend`). The link opens `GET /verify-email?token=…`.
- Email goes through MoreWerx's partner email API (`MOREWERX_API_URL`, `MOREWERX_PARTNER_KEY`) from "PrismScore". Without them nothing is sent; logs never include the address or the link, except that outside production the link is printed to the server console for local testing.
- `GET /api/auth/me` includes `emailVerified`.

## ScienceWerx Connect v1

ScienceWerx apps (PrismScore, iStartup, FounderFit, InkKeep, InkGuard) keep their own databases and sign-ins and share display-ready results about the signed-in person only, server to server, matched by verified email. Code is in `src/lib/connect/`.

- Provider: `GET /api/connect/v1/summary` and `GET /api/connect/v1/certificates` with `Authorization: Bearer swc_…` and `X-Connect-Subject: <email>`. Checks, in order: key shape (401), known key by SHA-256 with a constant-time compare (401), scope (403), subject email (400). Only accounts with a verified email (outside the demo workspace) are found; anyone else is `200 {"found":false}`. Responses are `Cache-Control: no-store`; each call is logged with the caller, endpoint, a hash of the subject (never the email), found and status.
  - Summary: for an admin, the company PrismScore (score / 500, band, date of the latest completed company assessment); for an executive, their role and whether the C-level diagnostic is done; plus course progress and certificate count.
  - Certificates: the person's certificates with `VALID` / `EXPIRED` / `REVOKED` and a link to `/verify/<code>` on `APP_URL` (default https://www.prismscore.us).
- Consumer: `GET /api/connect/peers` (signed in, verified email required, otherwise `needsVerification: true`) calls iStartup's summary and certificates in parallel with 4 s timeouts and merges what answered. A peer that is down, slow, unconfigured or refusing is left out; its error never reaches the browser. The "Connected apps" panel on `/learn` and `/dashboard` renders the result and is hidden when there is nothing to show.
- Env: `CONNECT_KEY` (secret, `swc_` + 43 base64url chars), `CONNECT_CALLERS` (`name:sha256hex:scope|scope,…`), `CONNECT_PEERS` (`name=https://base-url,…`), `APP_URL`. See `.env.example`. A peer URL must be https (plain http is accepted only for localhost, for local testing).

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

