# JobTrackr — AI-Powered Career Operating System

JobTrackr is a production-grade full-stack SaaS platform for managing job applications with AI-powered resume parsing, job matching, interview prep, and analytics.

![Next.js](https://img.shields.io/badge/Next.js-15+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Live Demo

Deploy to Vercel and connect your Neon database to get a live URL. See [Deployment Guide](#deployment).

## Features

- **Application Tracking** — CRUD with 7-stage pipeline (Applied → Offer/Rejected)
- **Kanban Board** — Drag-and-drop status updates with optimistic UI
- **Resume Parsing Pipeline** — PDF upload → pdf-parse → Gemini AI extraction → structured profile
- **AI Match Engine** — Score resume vs job description with skill gap analysis
- **AI Tools** — Interview prep, message generator (streaming)
- **Analytics Dashboard** — Funnel, conversion rates, monthly trends (Recharts)
- **Activity Feed** — Real-time timeline of career events
- **Public Profile** — Shareable `/u/username` page with opt-in visibility
- **Chrome Extension** — Import LinkedIn jobs in one click (Manifest V3)
- **Background Jobs** — Upstash QStash for async resume parsing & email
- **Redis Caching** — Cache Aside pattern for analytics & AI results

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15+, React 19, TypeScript, Tailwind CSS, Shadcn UI |
| State | TanStack Query, React Hook Form, Zod |
| Backend | Next.js API Routes, Service/Repository/DTO layers |
| Database | PostgreSQL (Neon), Prisma ORM |
| Auth | NextAuth v5 (Credentials + Google OAuth) |
| AI | Google Gemini 1.5 Flash |
| Files | UploadThing |
| Cache | Upstash Redis |
| Queue | Upstash QStash |
| Email | Resend |
| Charts | Recharts |
| Tests | Vitest (24+ tests) |
| Deploy | Vercel |

## Architecture

```
Browser / Chrome Extension
        ↓
Next.js API Routes (DTO validation)
        ↓
Service Layer (business logic)
        ↓
Repository Layer (Prisma queries)
        ↓
PostgreSQL (Neon)

Heavy ops → QStash Queue → Worker webhooks → Gemini / Resend
Hot reads → Upstash Redis (Cache Aside)
```

## Database Schema (10 Models)

- `User`, `Account`, `Session`, `VerificationToken`
- `Application`, `Interview`
- `Resume`, `ResumeProfile`
- `AIMessage`, `ActivityLog`, `UsageMetrics`

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database ([Neon](https://neon.tech) free tier)
- API keys: Gemini, UploadThing, Resend (optional: Upstash, Google OAuth)

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/jobtrackr.git
cd jobtrackr
npm install
cp .env.example .env
# Fill in DATABASE_URL and other env vars
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

See [`.env.example`](.env.example) for all required variables.

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/applications` | List/create applications |
| GET/PUT/DELETE | `/api/applications/[id]` | Single application CRUD |
| PATCH | `/api/applications/[id]/status` | Update status (Kanban) |
| GET/POST | `/api/resumes` | List/upload resumes |
| POST | `/api/ai/match-score` | AI match analysis |
| POST | `/api/ai/interview-prep` | Generate interview questions |
| POST | `/api/ai/generate-message` | Stream message generation |
| GET | `/api/analytics` | Dashboard stats |
| GET | `/api/analytics?full=true` | Full analytics |
| GET | `/api/activity` | Activity feed |
| GET | `/api/public/[username]` | Public profile |
| GET/PATCH | `/api/metrics` | Usage metrics & settings |

**Chrome Extension Auth:** `Authorization: Bearer {apiKey}` header on POST `/api/applications`

## Chrome Extension

```bash
cd chrome-extension
npm install
npm run build
```

Load `chrome-extension/dist` in Chrome → Extensions → Developer mode → Load unpacked.

1. Copy your API key from Settings in JobTrackr
2. Open a LinkedIn job page
3. Click extension → Import Job

## Deployment

### Vercel + Neon

1. Push repo to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set all environment variables from `.env.example`
4. Build command: `prisma generate && prisma db push && next build`
5. Deploy

### Database Migrations

```bash
npx prisma migrate deploy  # production
npx prisma db push         # development
```

## Testing

```bash
npm test              # Run 24+ unit tests
npm run test:coverage # With coverage
npm run build         # Production build
```

## Resume Bullet Points

1. **Built** a production-grade AI-powered career platform (Next.js, TypeScript, PostgreSQL) featuring resume parsing via pdf-parse + Gemini, async job processing via Upstash QStash, Redis caching, and a Manifest V3 Chrome extension for LinkedIn job import

2. **Designed** a layered service/repository architecture with DTO validation, structured logging (Pino), rate limiting, and Sentry-ready error monitoring serving AI features at 10 req/min per user

3. **Implemented** a job match engine using Gemini 1.5 Flash that scores resume profiles against job descriptions, identifies skill gaps, and surfaces recommendations — cached via Upstash Redis Cache Aside pattern

4. **Shipped** end-to-end product: Kanban board (DnD + optimistic updates), analytics dashboard (Recharts), AI message generator, public profiles, Google OAuth — deployed to Vercel with automated Prisma migrations

## Project Structure

```
src/
├── app/           # Next.js App Router pages & API routes
├── components/    # UI components (shadcn-style)
├── services/      # Business logic
├── repositories/  # Prisma data access
├── dto/           # Zod validation schemas
├── lib/           # Auth, Redis, Queue, Gemini, etc.
└── types/         # Shared TypeScript types
chrome-extension/  # LinkedIn import extension
tests/             # Vitest unit tests
prisma/            # Database schema
```

## License

MIT
