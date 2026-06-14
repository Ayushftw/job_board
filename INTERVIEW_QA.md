# JobTrackr — Interview Q&A

## System Design

### Q: Why QStash instead of BullMQ?

**A:** BullMQ requires a persistent Redis connection and a long-running worker process — incompatible with Vercel's serverless model. QStash is an HTTP-based durable queue: the API enqueues a signed message, QStash delivers it via webhook to a serverless route, and retries automatically with exponential backoff. Same distributed systems concepts (at-least-once delivery, retry, dead-letter), zero infrastructure overhead.

### Q: Explain the Cache Aside pattern.

**A:** On read, check Redis first. On cache miss, fetch from PostgreSQL, populate Redis with a TTL, return data. On write, invalidate the cache. Implemented as `cacheAside(key, ttl, fetchFn)` in `src/lib/redis.ts`. Analytics and AI match scores use this pattern.

### Q: Why a service/repository layer in Next.js?

**A:** Route handlers are transport — they parse input and return output. Business logic in handlers can't be unit-tested without mocking HTTP. Services are testable pure functions. Repositories isolate the ORM — swapping Prisma for Drizzle only changes repositories. This scales to teams of 10+ engineers.

### Q: How does the resume parsing pipeline work?

**A:** Upload → UploadThing CDN → save Resume (parseStatus: PENDING) → enqueue QStash job → worker fetches PDF → pdf-parse extracts text → Gemini structured extraction → save ResumeProfile → update parseStatus: DONE. Client polls every 3s until complete.

### Q: How does the Chrome Extension authenticate?

**A:** User copies API key from JobTrackr Settings (stored in DB). Extension saves in `chrome.storage.local`. Every import sends `Authorization: Bearer {key}`. The applications API accepts both NextAuth sessions and API key auth via `getAuthUserId()`.

## Technical Deep Dives

### Q: How do you handle rate limiting on AI routes?

**A:** `@upstash/ratelimit` sliding window — 10 requests/minute per userId on all `/api/ai/*` routes. Returns 429 when exceeded. Gracefully degrades when Redis is unavailable (allows requests).

### Q: What's your database schema design rationale?

**A:** 10 models with clear ownership boundaries. User owns Applications, Resumes, ActivityLogs. ResumeProfile is 1:1 with Resume (parsed data separated from file metadata). UsageMetrics tracks instrumentation for resume bullet points. ActivityLog uses JSON metadata for flexible event payloads.

### Q: How does the Kanban board handle optimistic updates?

**A:** TanStack Query mutation on drag-drop PATCH. On success, invalidates kanban and dashboard queries. Uses `@hello-pangea/dnd` for drag-and-drop with React 18+ compatibility.

### Q: How would you scale this to 100K users?

**A:** 
1. Move QStash workers to dedicated service
2. Add read replicas for analytics queries
3. Partition ActivityLog by userId + date
4. CDN cache public profiles
5. Rate limit per tier (free vs paid)
6. Consider Prisma Accelerate for connection pooling

## Product & Engineering

### Q: What makes this different from a tutorial project?

**A:** Layered architecture, async job processing, Redis caching, Chrome extension, AI pipeline with fallback logic, structured logging, security headers, 24+ tests, production deployment config — not just CRUD with a UI.

### Q: What trade-offs did you make?

**A:** QStash over BullMQ (serverless compatibility). Gemini over OpenAI (free tier). Cache Aside over Write-Through (simpler invalidation). JWT sessions over database sessions (performance). Direct fetch fallback when QStash unavailable (local dev UX).

### Q: What would you add next?

**A:** Email notifications for interview reminders, referral tracking module, team/agency multi-user RBAC, mobile PWA, webhook integrations (Greenhouse, Lever), and paid tier with higher AI limits.

## Behavioral

### Q: Tell me about a challenging technical problem you solved.

**A:** Building the resume parsing pipeline required coordinating file upload, async processing, AI extraction with fallback when Gemini fails, and a polling UI — all while keeping the upload response instant. Solved with QStash job queue + parseStatus state machine + client-side refetchInterval.

### Q: How do you ensure code quality?

**A:** TypeScript strict mode, Zod validation at every API boundary, service layer unit tests, production build verification, layered architecture preventing business logic in routes, and consistent error handling via `withApiHandler`.
