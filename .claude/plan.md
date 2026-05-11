# Nirapod: Complete Project Redevelopment Strategy

---

## Context

Nirapod is a Bangladesh-focused civic engagement platform where citizens report local issues (crime, fire, infrastructure failures, animal welfare) to relevant authorities (police, fire service, city corporation, animal welfare). Authorities respond, update status, and communicate transparently with the public.

The product concept is sound and functional. The technical implementation has critical, systemic flaws — hardcoded credentials, no JWT auth, no database normalization, CORS wildcards, no tests, and no deployment infrastructure — making it impossible to safely run in production or scale. This is a full greenfield rebuild preserving all existing features while fixing every architectural deficiency.

---

## 1. Current System Summary

### What Exists

**Stack:** Spring Boot 3.2.5 (Java 17) backend + React 18.2 SPA frontend + standalone Node.js WebSocket server (3 processes)

**Database:** 3 tables — `usr_user`, `usr_complain`, `notifications`

**Features:**
- Multi-role auth: citizen, police, fire, city, animal welfare, admin
- Complaint CRUD with photos, GPS location, urgency, district/area
- Authority-filtered feeds (each role sees its category)
- Complaint status lifecycle (Unsolved → In Progress → Solved)
- Social: follow, comments (comma-separated text in DB), report inappropriate posts
- OTP 2FA via email, Google OAuth login
- Real-time live chat (Node.js WebSocket)
- Notification polling (30s interval)
- Admin dashboard: manage complaints, users, reports
- Complaint tracking by ID (public)
- User profile with identity document uploads
- Leaflet maps for complaint location

### Critical Technical Debt

| Area | Problem |
|---|---|
| Security | CSRF disabled, CORS `*`, admin password hardcoded in source (`admin123`), all Spring endpoints are public, auth via `localStorage` only — no JWT |
| Database | Comments, tags, photos, follows stored as comma-separated strings in TEXT columns — not normalized |
| OTP | Stored in Java in-memory `HashMap` — lost on every server restart |
| Files | Uploaded to local filesystem — fails on container restart, no cloud storage |
| Architecture | Two duplicate entity classes (`Complaint.java` + `CreateComplain.java`) for one table; many stub endpoints returning empty arrays |
| Frontend | `Home.js` is 1000+ lines handling feed, filters, comments, photo upload, follow, report simultaneously |
| Testing | Zero tests — no unit, no integration, no E2E |
| DevOps | No Docker, no CI/CD, no environment management, no migration system (`db_creation.sh` raw SQL script) |
| Performance | N+1 queries in ComplaintController (fetches user for every complaint in a loop), no caching, no indexes |
| Scalability | Node.js WS server is a single-process, no-auth, localhost-only broadcast — cannot scale |

---

## 2. Recommended Technology Stack

### Backend — Keep Spring Boot, Upgrade Practices

Spring Boot is the right choice for this domain (RBAC, document workflows, multipart uploads, audit logging). The migration risk of switching to Node or Python outweighs any benefit. What changes is _how_ Spring Boot is used.

| Component | Choice | Rationale |
|---|---|---|
| Framework | Spring Boot 4.0.x (Java 21) | Current stable (Apr 2026, Spring Framework 7, Jakarta EE 11); virtual threads for WebSocket scale. Note: Spring Boot has no LTS designation — every minor gets 12 months OSS support, new minor every 6 months. 3.5.x is the final 3.x line (OSS ends Jun 30, 2026) and only a fallback if a dependency blocks the Spring Framework 7 jump |
| Build | Maven multi-module (`nirapod-api`, `nirapod-core`) | Clean domain/web separation |
| Security | Spring Security 7 + JWT (JJWT 0.12.x) | Replaces the current no-auth setup; bundled with Spring Boot 4 |
| ORM | Spring Data JPA + Hibernate 7 | Retained, with proper entity modeling |
| Migrations | Flyway | Replaces `db_creation.sh`; version-controlled schema |
| OTP storage | Redis (5-minute TTL) | Replaces in-memory HashMap |
| Caching | Spring Cache + Redis (Lettuce) | Feed, profile, unread count caches |
| Real-time | Spring WebSocket + STOMP over SockJS | Replaces standalone Node.js ws server |
| File storage | Cloudinary Java SDK (MinIO for local dev) | Replaces local filesystem; free 25GB on Cloudinary |
| Rate limiting | Bucket4j + Redis backend | No equivalent currently |
| Email | Spring Mail + Thymeleaf HTML templates | Replaces plain-text SimpleMailMessage |
| API docs | springdoc-openapi (OpenAPI 3) | Currently none |

### Frontend — Migrate to Next.js 16 (App Router)

The React SPA has no SSR, no code splitting, and God-component architecture. Next.js App Router provides React Server Components (faster complaint feed initial load), built-in image optimization (critical for complaint photos), and file-based routing. Next.js 16 (current as of 2026) ships Turbopack as the default bundler, React 19.2 with the React Compiler 1.0 stable, and a new routing/navigation overhaul with layout deduplication and incremental prefetching.

| Component | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router, RSC, React 19.2, Turbopack default) | SSR for feed, image optimization, file routing, React Compiler |
| Auth | Auth.js v5 (formerly NextAuth.js) | JWT sessions, Google OAuth, middleware route guard — replaces localStorage |
| State: server | TanStack Query v5 | Replaces useState+useEffect+axios pattern; auto-caching, optimistic updates |
| State: UI | Zustand | Lightweight local UI state (filter panels, modals) |
| Styling | Tailwind CSS 4.x (CSS-native config via `@theme`) + shadcn/ui | Accessible component primitives; v4 is 5x faster compile, OKLCH colors, no `tailwind.config.js`. Note: requires Safari 16.4+, Chrome 111+, Firefox 128+ — drop v3 if older-browser support is needed |
| Forms | React Hook Form + Zod | Schema validation replacing current ad-hoc validation |
| Real-time | @stomp/stompjs + sockjs-client | Connects to Spring STOMP broker |
| Maps | react-leaflet | Wrapper over current Leaflet — familiar |
| Animations | Framer Motion (retained) | |
| HTTP | Axios (retained) + JWT interceptor + silent refresh | |

### Infrastructure (Free Tier Only)

| Component | Dev | Production (Free Tier) |
|---|---|---|
| Database | PostgreSQL 16 (Docker) | Supabase (free: 500MB PostgreSQL) or Neon (free: 0.5GB serverless PostgreSQL) |
| Cache/OTP | Redis 7 (Docker) | Upstash Redis (free: 10k commands/day, 256MB) |
| File storage | MinIO (Docker, S3-compatible) | Cloudinary (free: 25GB storage, 25GB bandwidth/month) |
| Deployment | Docker Compose | Render.com (free: Spring Boot as web service, sleeps after 15min inactivity) |
| Frontend hosting | `next dev` | Vercel (free tier: unlimited Next.js deploys) |
| CI/CD | — | GitHub Actions (free: 2000 min/month on public repos) |
| Monitoring | — | Sentry (free: 5k errors/month) + Spring Actuator `/actuator/health` |

**Free-tier tradeoffs to document:**
- Render free tier sleeps after 15 minutes of inactivity (cold start ~30s) — acceptable for a showcase project
- Upstash Redis 10k commands/day is sufficient for OTP + rate limiting at hobby scale; bump to paid ($0.20/100k commands) if needed
- Cloudinary free replaces S3 presigned URL flow: upload goes through Spring backend to Cloudinary API instead of direct-to-S3 (simpler for free tier)
- Supabase/Neon free PostgreSQL has connection limits (20–100 pooled) — use HikariCP `maximumPoolSize=5` on free tier

---

## 3. Proposed System Architecture

```
Browser (Next.js 16)
    |
    |── HTTPS ──▶ Next.js API Routes (BFF: JWT validation, request forwarding)
    |                  └── forwards to Spring Boot REST /api/v1/**
    |
    |── WSS ────▶ Spring Boot WebSocket (STOMP/SockJS)
    |                  ├── /user/queue/notifications  (per-user push)
    |                  └── /topic/livechat             (public broadcast)
    |
    |── CDN ────▶ Cloudinary CDN (complaint photos via secure_url)
    |              (signed Cloudinary URLs for sensitive user documents)

Spring Boot 4.0 (:8080) — hosted free on Render.com
    ├── Spring Security (JWT filter, method-level @PreAuthorize)
    ├── REST /api/v1/**  ──▶ Supabase / Neon PostgreSQL 16
    ├── Spring Cache     ──▶ Upstash Redis
    ├── Spring Mail      ──▶ Gmail SMTP
    ├── WebSocket/STOMP  ──▶ Upstash Redis pub/sub (enables multi-instance WS fan-out)
    └── Cloudinary SDK   ──▶ Cloudinary (free 25GB)

Next.js 16 — hosted free on Vercel
```

### Authentication Design

**JWT stateless auth with refresh token rotation:**

1. Login → Spring issues 15-min access token (JWT) + 7-day refresh token (opaque UUID in Redis `HttpOnly` cookie)
2. Access token claims: `{ sub: userId, role: "POLICE", jti: uuid }`
3. Refresh: exchange refresh token for new pair; old refresh token invalidated in Redis
4. Logout: refresh token deleted from Redis; access token `jti` blacklisted in Redis until TTL
5. Auth.js v5 middleware: auto-refreshes access token transparently before expiry
6. Spring Security: `SessionCreationPolicy.STATELESS`, JWT filter, no form login, no HTTP Basic
7. Admin account: seeded via Flyway migration V1 with bcrypt hash — no hardcoded credentials in code

**Roles and scope (not a strict hierarchy — authority roles are parallel scopes, not "higher" than citizens):**
```
ADMIN (full access, all categories)
  └── POLICE | FIRE | CITY | ANIMAL (authority — single category only)
  └── CITIZEN (own complaints + public feed)
```
Authority roles (POLICE etc.) see only their category's complaints. Enforced via `@PreAuthorize` + service-layer category filtering, not the current `X-User-Category` header abuse.

---

## 4. Normalized Database Schema

### Core Tables

```sql
-- Users (replaces usr_user)
users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nid               CHAR(10) UNIQUE NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  phone             VARCHAR(20) UNIQUE NOT NULL,
  password_hash     TEXT,                              -- NULL for OAuth-only users
  name              VARCHAR(255) NOT NULL,
  role              VARCHAR(20) NOT NULL DEFAULT 'CITIZEN',
  status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  present_address   TEXT NOT NULL,
  permanent_address TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
)

-- Identity documents (1:many, replaces 12 document columns in usr_user)
user_documents (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(50) NOT NULL,   -- NID_PHOTO|PASSPORT|DL|UTILITY_BILL|USER_PHOTO|PRIV_ID
  document_number VARCHAR(100),
  file_public_id  TEXT NOT NULL,          -- Cloudinary public_id, NOT a URL
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
)

-- OAuth accounts (Google login)
oauth_accounts (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider    VARCHAR(50) NOT NULL,       -- GOOGLE
  provider_id VARCHAR(255) NOT NULL,
  PRIMARY KEY (provider, provider_id)
)

-- Complaints (replaces usr_complain)
complaints (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id    BIGSERIAL UNIQUE NOT NULL,             -- kept for public tracking
  user_id        UUID NOT NULL REFERENCES users(id),
  category       VARCHAR(20) NOT NULL,                  -- POLICE|FIRE|CITY|ANIMAL
  urgency        VARCHAR(10) NOT NULL,                  -- LOW|MEDIUM|HIGH
  status         VARCHAR(20) NOT NULL DEFAULT 'UNSOLVED',
  title          VARCHAR(500) NOT NULL,                 -- NEW: short title (absent currently)
  details        TEXT NOT NULL,
  district       VARCHAR(100) NOT NULL,
  area           VARCHAR(100) NOT NULL,
  location_lat   DECIMAL(10,8),
  location_lng   DECIMAL(11,8),
  location_text  TEXT,
  is_public      BOOLEAN NOT NULL DEFAULT TRUE,
  authority_note TEXT,                                  -- replaces text "Update" field
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ
)

-- Complaint photos (replaces comma-separated Photos + upload_photos)
complaint_photos (
  id             UUID PRIMARY KEY,
  complaint_id   UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  file_public_id TEXT NOT NULL,                         -- Cloudinary public_id
  uploaded_by    UUID NOT NULL REFERENCES users(id),
  is_evidence    BOOLEAN NOT NULL DEFAULT FALSE,        -- true = uploaded by authority
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
)

-- Tags (replaces comma-separated Tags column)
complaint_tags (
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  tag          VARCHAR(100) NOT NULL,
  PRIMARY KEY (complaint_id, tag)
)

-- Follows (replaces comma-separated Follow column)
complaint_follows (
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, complaint_id)
)

-- Comments (proper table, replaces comma-separated Comment column)
comments (
  id           UUID PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
)

-- Reports (replaces comma-separated Report column)
complaint_reports (
  id           UUID PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  reporter_id  UUID NOT NULL REFERENCES users(id),
  reason       VARCHAR(100) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(complaint_id, reporter_id)
)

-- Notifications (replaces current 4-column notifications table)
notifications (
  id           UUID PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(50) NOT NULL,   -- STATUS_UPDATE|NEW_COMMENT|FOLLOWER|LOGIN_ALERT
  title        VARCHAR(255) NOT NULL,
  message      TEXT NOT NULL,
  complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
)

-- Audit log (new)
audit_log (
  id          UUID PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  ip_address  INET,
  user_agent  TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
)

-- Chat message persistence (new — replaces ephemeral WS messages)
chat_messages (
  id         UUID PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
```

### Critical Indexes

```sql
CREATE INDEX idx_complaints_category_status   ON complaints(category, status, created_at DESC);
CREATE INDEX idx_complaints_user_id           ON complaints(user_id);
CREATE INDEX idx_complaints_district          ON complaints(district);
CREATE INDEX idx_complaint_follows_user       ON complaint_follows(user_id);
CREATE INDEX idx_notifications_user_unread    ON notifications(user_id, is_read) WHERE NOT is_read;
CREATE INDEX idx_audit_log_user               ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_time          ON audit_log USING brin (created_at);
CREATE INDEX idx_users_nid                    ON users(nid);
CREATE INDEX idx_users_email                  ON users(email);
```

---

## 5. Phased Development Roadmap

### Phase 1 — Foundation & Auth (Weeks 1–4)

**Backend:**
- Spring Boot multi-module Maven project (`nirapod-api`, `nirapod-core`)
- Flyway migrations V1–V5: `users`, `user_documents`, `oauth_accounts`, `audit_log`, admin seed
- JWT: `JwtService`, `JwtAuthenticationFilter`, `SecurityConfig` (stateless, CORS whitelist)
- Redis integration: OTP (5-min TTL), refresh token store, JWT blacklist
- Auth endpoints: `POST /api/v1/auth/signup`, `login`, `refresh`, `logout`, `send-otp`, `verify-otp`, `forgot-password`
- Google OAuth: Spring OAuth2 resource server verifying Google ID tokens
- Cloudinary upload endpoint: `POST /api/v1/files/upload` (Spring receives multipart → Cloudinary SDK → returns `public_id`)
- Rate limiting: Bucket4j on all auth endpoints (5 login attempts/15min/IP)
- `AuditService` with `@Async` for all auth events
- OpenAPI 3 spec via springdoc

**Frontend:**
- Next.js 16 App Router initialization (Turbopack default)
- Auth.js v5: credentials provider + Google provider
- Middleware route guard in `middleware.ts`
- `app/(auth)/login/page.tsx` — multi-step (credentials → OTP), Google OAuth button
- `app/(auth)/signup/page.tsx` — 6-step wizard with document uploads via Spring → Cloudinary
- Axios instance with JWT interceptor + silent refresh
- Zustand auth store
- Tailwind + shadcn/ui setup

**DevOps:**
- `docker-compose.yml`: PostgreSQL 16, Redis 7, MinIO, Spring Boot, Next.js
- GitHub Actions: lint + type-check + unit tests on every PR

**Deliverable:** Secure registration and login with JWT, OTP, Google OAuth. Admin seeded from migration.

---

### Phase 2 — Core Complaint Features (Weeks 5–8)

**Backend:**
- Flyway V6–V10: `complaints`, `complaint_photos`, `complaint_tags`, `complaint_follows`, `complaint_status_history`
- `ComplaintEntity` with proper JPA (no duplicate Complaint.java/CreateComplain.java)
- `ComplaintService` with `@Transactional`, JOIN FETCH (eliminates current N+1 loop)
- Endpoints: `POST`, `GET` (paginated + filtered), `GET /{id}`, `PUT /{id}/status` (authority/admin only), `PUT /{id}/note`, `DELETE` (admin only), `GET /user/{userId}`
- Bean Validation on all `ComplaintCreateRequest` DTOs
- Apache Tika file type validation on photo upload
- Redis: `@Cacheable("complaints")` on feed, `@CacheEvict` on create/update
- Role-based category enforcement: `@PreAuthorize("hasRole('POLICE') and #request.category == 'POLICE'")`

**Frontend:**
- `app/(main)/home/page.tsx` — Server Component with RSC for initial feed
- `ComplaintCard.tsx` — extracted from the 1000-line `Home.js` (no more God component)
- `ComplaintFeed.tsx` — infinite scroll with TanStack Query + Intersection Observer
- `ComplaintFilters.tsx` — URL-synced filter panel (`useSearchParams`)
- `app/(main)/create-complaint/page.tsx` — multi-step form (React Hook Form + Zod)
- `app/(main)/complaint/[id]/page.tsx` — detail page with Leaflet map, photo gallery
- `app/(main)/tracker/page.tsx` — tracking ID search (public, no auth required)
- Error boundaries at page level; Suspense + loading skeletons throughout

**Deliverable:** Citizens submit complaints with photos + GPS. Authorities see filtered feeds. Status updates, tracking by ID work.

---

### Phase 3 — Social Features & Notifications (Weeks 9–12)

**Backend:**
- Flyway V11–V13: `comments`, `complaint_reports`, `notifications` (expanded)
- `CommentService`, `FollowService`, `ReportService`, `NotificationService`
- Comment endpoints: `POST /api/v1/complaints/{id}/comments`, `GET` (paginated), `PUT` (own), `DELETE` (own or admin)
- Follow endpoints: `POST /DELETE /api/v1/complaints/{id}/follow`, `GET /api/v1/users/{id}/followed-complaints`
- Report endpoint: `POST /api/v1/complaints/{id}/report` (reason required)
- Notification endpoints: `GET /api/v1/notifications` (paginated), `PUT /read-all`, `GET /unread-count` (Redis counter)
- `NotificationService.notifyFollowers(complaintId, event)` — called on every status change + new comment

**Frontend:**
- `CommentSection.tsx` — optimistic add with TanStack Query mutation
- `FollowButton.tsx` — optimistic toggle
- `ReportModal.tsx` — reason selection dialog (shadcn Dialog)
- `app/(main)/notifications/page.tsx` — notification list, mark all read
- Navbar: unread badge (polling 30s; replaced by WebSocket in Phase 4)
- `app/(main)/profile/page.tsx` — edit profile, document viewer, change password
- `app/(admin)/reports/page.tsx` — admin report review

**Deliverable:** Full social engagement. Followers notified on status changes. Admin reviews reported content.

---

### Phase 4 — Real-time Features (Weeks 13–16)

**Backend:**
- `spring-boot-starter-websocket` + STOMP + SockJS
- `WebSocketMessageBrokerConfigurer` with Redis pub/sub broker (enables multi-instance fan-out)
- `ChannelInterceptor` — validates JWT in STOMP CONNECT frame
- `NotificationWebSocketService` — pushes to `/user/queue/notifications` on every notification write
- `ChatController` — `@MessageMapping("/chat.send")` → broadcast to `/topic/livechat`, persists to `chat_messages`
- `GET /api/v1/chat/history?limit=50` — load last N messages on page open

**Frontend:**
- `useWebSocket.ts` hook — STOMP connection lifecycle, reconnect with exponential backoff
- `useNotifications.ts` — subscribes to `/user/queue/notifications`, updates TanStack Query cache
- Navbar unread badge: WebSocket-driven (removes 30s polling)
- `app/(main)/livechat/page.tsx` — rebuilt with message history, connection status, scroll behavior
- Online presence indicator via `/topic/presence` subscriptions

**Deliverable:** Sub-1-second notification delivery. Live chat with persistence. No polling anywhere.

---

### Phase 5 — Admin & Advanced Features (Weeks 17–20)

**Backend:**
- Admin endpoints: `GET /api/v1/admin/users` (filterable), `PUT /approve`, `PUT /suspend`, `POST` (create authority user)
- `GET /api/v1/admin/stats` — complaint counts by status/category, user counts
- `GET /api/v1/admin/analytics?from=&to=&groupBy=district` — aggregate for map overlay
- `GET /api/v1/admin/audit?userId=&action=&page=` — paginated audit log
- `InvestigateService` — search by NID, passport, driving license → profile + complaint history
- User verification workflow: PENDING → ACTIVE (admin approves) — blocks platform access until approved
- `@Scheduled` weekly stats email via Spring Mail

**Frontend:**
- `app/(admin)/` route group with admin layout
- `app/(admin)/dashboard/page.tsx` — stats cards + complaint trend charts (Recharts)
- `app/(admin)/users/page.tsx` — user table, approve/suspend, document photo viewer
- `app/(admin)/analytics/page.tsx` — complaint map overlay (Leaflet choropleth by district)
- `app/(admin)/audit/page.tsx` — audit log with filters
- `app/(admin)/investigate/page.tsx` — NID/passport/DL search
- `app/(privileged)/` — authority queue UI with status update + evidence upload

**Deliverable:** Admin has full visibility and control. Authority users have purpose-built queues. Verification workflow blocks unverified users.

---

### Phase 6 — Testing, Performance & Deployment (Weeks 21–24)

**Testing:**

*Backend:*
- JUnit 5 + Mockito unit tests for all Service classes (80% coverage via JaCoCo, enforced in Maven)
- `@SpringBootTest` + Testcontainers (PostgreSQL + Redis) for all Controller integration tests
- ArchUnit: enforce no direct repository calls from controllers
- RestAssured for API contract tests

*Frontend:*
- Vitest + React Testing Library for all `components/` files
- MSW (Mock Service Worker) for API fixtures in tests
- Playwright E2E: login flow, complaint submission, status update → WS notification, live chat, admin actions

**CI/CD (GitHub Actions):**
```
PR → [lint, typecheck, unit tests]
   ↓ merge to main
[integration tests (Testcontainers)]
   ↓
[E2E tests (Playwright, Docker Compose stack)]
   ↓
[Docker build → push to GitHub Container Registry]
   ↓
[Deploy to staging → smoke tests]
   ↓
[Manual approval]
   ↓
[Deploy to production → health check]
```

**Performance hardening:**
- `EXPLAIN ANALYZE` audit on all complaint feed queries
- Composite index `(category, status, created_at DESC)` — single index scan for authority feed
- Redis `@Cacheable`: feed (2-min TTL), profile (10-min), unread count (counter, increment/decrement on write)
- Next.js `<Image>` for WebP conversion + lazy loading of complaint photos
- `React.lazy` + `Suspense` for Leaflet map and photo gallery
- HikariCP: `maximumPoolSize=5` on free tier (Supabase/Neon connection limits); raise to 20 if self-hosting

**Deployment (all free tier):**
- `docker-compose.yml` for local dev (PostgreSQL, Redis, MinIO, Spring Boot, Next.js)
- **Spring Boot** → Render.com free web service (Docker deploy; note: sleeps after 15min inactivity — acceptable for showcase)
- **Next.js** → Vercel free tier (git push auto-deploy, unlimited bandwidth for hobby)
- **PostgreSQL** → Supabase free tier (500MB, connection pooler via PgBouncer included) or Neon (branching, serverless)
- **Redis** → Upstash free tier (10k commands/day — OTP + rate limiting + pub/sub for WS)
- **Files** → Cloudinary free tier (25GB storage, 25GB bandwidth/month)
- **Secrets:** GitHub Environments secrets → injected at deploy time; never committed
- **Health:** Spring Actuator `/actuator/health`, Next.js `/api/health` (Render uses these for zero-downtime redeploys)
- **Monitoring:** Sentry free tier (5k errors/month, both Spring and Next.js)
- **HikariCP:** `maximumPoolSize=5` on Render free tier (respects Supabase connection limit)

**Deliverable:** Production-ready, tested, containerized, monitored, deployed.

---

## 6. Security Hardening Plan

| Area | Current | New |
|---|---|---|
| Auth storage | `localStorage` NID | `HttpOnly` cookie (refresh token) + in-memory access token |
| CORS | `*` wildcard | Explicit allow-list: production domains + `localhost:3000` (dev only) |
| CSRF | Disabled | Disabled for stateless JWT API endpoints (no cookie session); `SameSite=Strict` on refresh cookie + double-submit token on the `/auth/refresh` endpoint to defend that one cookie-bearing path |
| Admin credentials | Hardcoded in `AuthService.java` | Flyway V1 seed migration with bcrypt hash; env-var for initial password |
| All endpoints public | Yes (SecurityConfig has no rules) | Method-level `@PreAuthorize` + JWT filter; public endpoints explicitly listed |
| OTP storage | In-memory HashMap | Redis with 5-minute TTL, cleared on first use |
| Input validation | Ad-hoc null checks | Bean Validation annotations on all DTOs; `@ControllerAdvice` error handler |
| File type validation | None | Apache Tika MIME detection; allowed: `image/jpeg`, `image/png`, `image/webp` only |
| File size | Spring multipart config only | Enforced by Spring multipart + Cloudinary upload preset max_file_size |
| Rate limiting | None | Bucket4j: 5 login/15min/IP, 5 OTP/hour/email (+ 1/min throttle), 200 API req/min/user |
| SQL injection | JPA parameterized (safe) | Retained; no raw JDBC queries |
| XSS | None | OWASP HTML Sanitizer on complaint `details` field |
| Audit logging | None | `audit_log` table: all auth events, status changes, admin actions |

---

## 7. UI/UX Improvement Plan

### Frontend Design Constraints (Non-Negotiable)

These rules apply to every component, page, and visual element. CI lints + PR review enforce them — if a PR breaks any, it is rejected.

**Visual style — simple, calm, content-first:**
- **No gradients anywhere.** No `bg-gradient-*`, no CSS `linear-gradient()` / `radial-gradient()`, no gradient borders, no gradient text. Status, urgency, and category are conveyed through solid colors, weight, and outlined badges only. Enforce via an ESLint rule that flags `gradient` in className strings and a Stylelint rule that flags `*-gradient(` in CSS.
- **No decorative shadows or glow.** Elevation comes from a small, fixed shadow scale (`shadow-sm`, `shadow-md`) used only on cards, modals, and popovers. No glow, no neon, no colored shadows.
- **Solid colors only**, sourced from the design tokens defined in Tailwind's `@theme` block. No ad-hoc hex codes in JSX. Light/dark mode supported via CSS variables, not class-based conditionals.
- **Single accent color** for primary CTAs; semantic colors (red/amber/green/blue) reserved for status meaning, never for decoration.
- **Generous whitespace.** Minimum 16px padding on cards, minimum 24px section spacing on mobile. No dense, busy layouts.
- **Maximum 2 typefaces** — one sans-serif for everything, optionally one monospace for tracking IDs and timestamps. No display/decorative fonts.
- **Iconography:** Lucide icons only (already bundled with shadcn/ui). Consistent stroke width. No emoji as functional UI.

**Intuitive — discoverable without instructions:**
- Every action has a text label. Icon-only buttons must include `aria-label` and a visible tooltip on hover/focus.
- Destructive actions (delete, suspend, report) are always confirmed via a modal dialog with the action restated in the confirm button (e.g., "Delete complaint" not "Confirm").
- Form errors render inline directly below the field, in red, with a clear correction instruction — never just "Invalid input."
- Loading, empty, and error states are designed explicitly for every list, feed, and detail view — never a blank screen.
- Navigation depth ≤ 3 levels from home. Breadcrumbs on every page deeper than 2 levels.
- Primary actions are always in the same place on a given page across visits (no shifting layouts).

**Smooth — motion serves the user, never decorates:**
- All transitions use `transition-colors`, `transition-opacity`, `transition-transform` only — no `transition-all`.
- Standard duration: 150ms for hover/focus, 200ms for state changes, 250ms for modal/drawer entry. Easing: `ease-out` for enter, `ease-in` for exit.
- Respect `prefers-reduced-motion: reduce` — disable all non-essential motion, keep functional ones (modal entry) at duration 0.
- No infinite/looping animations except a single subtle loading spinner.
- Skeleton loaders (not spinners) for any list or card content that takes >200ms to fetch. Framer Motion already in stack — use sparingly, only for shared-element transitions and modal entry.
- Optimistic UI for all mutations (comment add, follow toggle, status update) — UI updates instantly; rollback on server error with a toast.

**Optimized for all displays:**
- **Mobile-first.** Every page designed at 360px width first, then scaled up. Breakpoints: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`, `2xl:1536px`.
- **Touch targets ≥ 44×44 px** (WCAG 2.5.5). No interactive elements smaller than this — including icon buttons, checkboxes, and link text.
- **No horizontal scroll** at any viewport ≥ 320px. Enforce via a Cypress/Playwright test that loads each page at 320px and asserts `document.body.scrollWidth === document.body.clientWidth`.
- **Bottom navigation** on `< 640px` for primary navigation (Home, Notifications, Create, Profile); top navbar on `≥ 640px`.
- **Photo galleries** use swipe gestures on touch devices, arrow keys on desktop, pinch-to-zoom on mobile.
- **Map (Leaflet)** falls back to a static photo + GPS coordinates if WebGL/canvas fails or the user has data-saver enabled.
- **High-DPI photos** served via Next.js `<Image>` `srcSet` — 1x, 2x, 3x variants; AVIF preferred, WebP fallback, JPEG last.
- **Print stylesheet** for complaint detail pages so printed copies look clean (no navbars, no buttons).
- **RTL not required** (Bangla/English are LTR), but use Tailwind v4 logical properties (`ps-*`, `pe-*`, `inline-s-*`) anyway — costs nothing and future-proofs.

**Very fast — hard performance budgets:**
- **Largest Contentful Paint (LCP) ≤ 2.0s** on a 4G connection, measured via Lighthouse CI in GitHub Actions on every PR.
- **Interaction to Next Paint (INP) ≤ 200ms.** Heavy work (image processing, large list filtering) runs in a Web Worker.
- **Cumulative Layout Shift (CLS) ≤ 0.05.** Every image has explicit `width`/`height`; every async-loaded card has a fixed-height skeleton.
- **Time to First Byte (TTFB) ≤ 600ms** for SSR pages (note: Render free tier cold start breaks this — document as known tradeoff).
- **JavaScript bundle ≤ 180KB gzipped** for the feed route, ≤ 250KB for any single route. Enforce via `@next/bundle-analyzer` in CI; fail build on regression.
- **No client-side fetching of data already known at request time** — use React Server Components for the initial feed; TanStack Query only for client-mutable / paginated data.
- **Aggressive caching:** Next.js `<Image>` with `priority` on above-fold; `fetch` with `next: { revalidate: 60 }` for the feed; service worker (via Next.js PWA plugin) for offline-first navigation between cached pages.
- **Code-splitting:** Leaflet, photo gallery, chart libraries (Recharts), and the admin route group are all dynamically imported.
- **No third-party scripts on critical pages.** Analytics (if any) loads after `load` event; no font flashes — preload critical fonts, use `font-display: swap`.
- **Database queries:** every endpoint backing a page has a measured p95 ≤ 100ms (excluding cold-start). Slow query log threshold = 50ms in production.

**Verification gates in CI (no merge without all green):**
- Lighthouse CI: performance ≥ 90, accessibility ≥ 95, best-practices ≥ 95
- axe-core a11y scan on every page (Playwright)
- Bundle size check (fails on >5% regression)
- ESLint rule: no `gradient`, no inline `style={{}}` for layout, no `transition-all`
- Stylelint rule: no `*-gradient(`, no `!important`

---

### Component Architecture (replacing God components)

```
components/
  ui/               ← shadcn/ui primitives (Button, Dialog, Badge, Input, etc.)
  complaint/
    ComplaintCard.tsx      ← pure display (extracted from Home.js)
    ComplaintFeed.tsx      ← infinite scroll
    ComplaintFilters.tsx   ← URL-synced filter panel
    ComplaintMap.tsx       ← Leaflet (lazy loaded)
    PhotoGallery.tsx       ← viewer with keyboard nav
    StatusBadge.tsx
    CommentSection.tsx     ← optimistic updates
    FollowButton.tsx       ← optimistic toggle
    ReportModal.tsx
  auth/
    LoginForm.tsx
    OtpForm.tsx
    SignupWizard.tsx
    DocumentUpload.tsx     ← Cloudinary upload via Spring endpoint
  layout/
    Navbar.tsx             ← Server Component
    NotificationBell.tsx   ← Client Component (WS subscription)
```

### Specific Improvements (in addition to the constraints above)

- **No more `window.alert()` or `window.confirm()`** — replace with shadcn Dialog and React Hot Toast (already in frontend)
- **Error boundaries** at every route; `app/**/error.tsx` files for Next.js error UI
- **Loading skeletons** via `app/**/loading.tsx` (Suspense-based)
- **Accessibility:** `aria-label` on all interactive elements, `<label>` on every form field (currently many inputs are `placeholder`-only), focus trap in modals (shadcn Dialog provides this), `aria-live` for status change announcements, WCAG AA color contrast audit on urgency color indicators (and recheck after the no-gradient palette is finalized)
- **Mobile:** Touch-friendly file input (styled, not native-ugly); see Frontend Design Constraints above for bottom nav and gesture rules
- **Consistent environment URLs:** Remove all hardcoded `localhost:8081`, `localhost:8080` — use environment variables throughout

---

## 8. Development Standards

### Folder Structure

**Backend (`nirapod-api/`):**
```
src/main/java/com/nirapod/
  config/         SecurityConfig, WebSocketConfig, RedisConfig, CloudinaryConfig
  controller/     AuthController, ComplaintController, NotificationController, ChatController, UserController, AdminController, FileController
  service/        AuthService, ComplaintService, NotificationService, FileService, AuditService
  repository/     UserRepository, ComplaintRepository, NotificationRepository
  security/       JwtService, JwtAuthenticationFilter, RateLimitFilter
  exception/      GlobalExceptionHandler, ErrorResponse
  dto/
    auth/         LoginRequest, TokenResponse, SignupRequest
    complaint/    ComplaintCreateRequest, ComplaintResponse, ComplaintFilterRequest
src/main/resources/
  db/migration/   V1__create_users.sql, V2__create_user_documents.sql, …
  application.yml (profiles: dev, prod)
```

**Frontend:**
```
app/
  (auth)/login/, (auth)/signup/
  (main)/home/, complaint/[id]/, create-complaint/, profile/, notifications/, livechat/, tracker/
  (admin)/dashboard/, users/[id]/, analytics/, audit/, investigate/
  api/auth/[...nextauth]/
components/ui/, complaint/, auth/, layout/, admin/
hooks/         useComplaints.ts, useWebSocket.ts, useNotifications.ts
lib/           axios.ts, validations.ts (Zod schemas), utils.ts
types/         complaint.ts, user.ts, notification.ts
store/         uiStore.ts (Zustand)
```

### Naming Conventions

- **Backend:** PascalCase classes, camelCase methods/variables, SCREAMING_SNAKE for constants, snake_case DB columns, kebab-case REST paths (`/api/v1/complaint-reports`)
- **Frontend:** PascalCase component files, `use` prefix hooks, `Store` suffix Zustand stores, no separate `.css` files (Tailwind only, except Leaflet overrides)
- **Commits:** Conventional Commits format: `feat(complaint): add urgency filter`, `fix(auth): correct OTP expiry race condition`
- **Branches:** `feature/`, `fix/`, `chore/`, `refactor/` prefixes
- **API versioning:** URL prefix `/api/v1/`; standardized error shape `{ code, message, timestamp }`

### PR Process

- 1 approving review + all CI checks green before merge
- PRs under 400 lines changed (large features split: migration → service → controller → frontend)
- Checklist: no hardcoded secrets, new endpoints have tests, schema changes are Flyway migrations (never `ddl-auto=update`), no `@CrossOrigin("*")`, no `localStorage` for auth, no TypeScript `any`, no `console.log` in production code, no `gradient` / `transition-all` / `!important` in styles, Lighthouse CI thresholds green

---

## 9. Data Migration from Current System

The rebuild is greenfield. Existing data migration runs between Phase 2 and Phase 3:

1. Export `usr_user` CSV → Spring Batch job maps columns to new `users` + `user_documents` schema
2. Export `usr_complain` CSV → split comma-separated columns:
   - `Tags` → `complaint_tags` rows
   - `Follow` → `complaint_follows` rows
   - `Comment` (NID:text pairs) → `comments` rows
   - `Report` (NID list) → `complaint_reports` rows
   - `Photos` + `upload_photos` → `complaint_photos` rows
3. Migrate existing filesystem files to Cloudinary via bulk upload script; store returned `public_id` values
4. Validate with row count assertions and spot checks
5. **Estimated time:** 5–7 engineering days + 2 validation days. The comma-separated `Comment` field (NID:text pairs) is the highest-risk: free-form text may contain commas/colons that break naive parsing, so build the parser against a representative sample of production data first and add round-trip validation (parse → re-serialize → diff) before the bulk run.

---

## 10. Team Responsibilities & Estimates

| Role | Responsibilities |
|---|---|
| **Backend Dev (1–2)** | Spring Boot, Flyway, JWT, WebSocket, Upstash Redis, Cloudinary, tests |
| **Frontend Dev (1–2)** | Next.js, Auth.js, TanStack Query, components, Playwright |
| **DevOps / Infra (0.5)** | Docker Compose, GitHub Actions, Render.com + Vercel + Supabase setup, Sentry |
| **UI/UX Designer (0.5)** | Accessibility audit, mobile design, design system |

**Timeline:**

| Phase | Weeks | Key Deliverable |
|---|---|---|
| 1 — Foundation & Auth | 1–4 | Secure registration + login (JWT, OTP, Google OAuth) |
| 2 — Complaint Core | 5–8 | Full complaint CRUD, normalized schema, no N+1 queries |
| 3 — Social & Notifications | 9–12 | Comments, follows, reports, notification fan-out |
| 4 — Real-time | 13–16 | WebSocket push notifications, persistent live chat |
| 5 — Admin & Advanced | 17–20 | Admin dashboard, verification workflow, analytics |
| 6 — Testing & Deployment | 21–24 | CI/CD, production deployment, monitoring |

**Total: 24 weeks (6 months) with a 3–4 developer team.**
With 2 developers: ~36 weeks. With 5+ developers: ~18 weeks by parallelizing backend/frontend tracks.

---

## 11. Critical Files to Replace

| File | Problem | New Implementation |
|---|---|---|
| `backend/src/.../config/SecurityConfig.java` | Allows all traffic, no JWT | Rebuilt: JWT filter, CORS whitelist, method security |
| `backend/src/.../service/AuthService.java` | Hardcoded `admin123`, in-memory OTP | Redis OTP, admin from DB seed, no hardcoded credentials |
| `backend/src/.../service/OtpService.java` | In-memory HashMap | Redis with 5-min TTL |
| `backend/src/.../controller/ComplaintController.java` | N+1 queries (user fetch in loop) | JOIN FETCH in `ComplaintService`, single query |
| `backend/src/.../model/Complaint.java` + `CreateComplain.java` | Duplicate entities for same table | Single `ComplaintEntity` |
| `db_creation.sh` | Schema in a bash script, comma-separated columns | Flyway migrations V1–V13 |
| `frontend/src/pages/Home.js` | 1000+ line God component | `ComplaintFeed`, `ComplaintCard`, `ComplaintFilters`, `CommentSection`, `PhotoGallery` |
| `frontend/src/pages/LiveChat.js` | Hardcoded `ws://localhost:8081` | `app/(main)/livechat/page.tsx` with STOMP/SockJS, env-var URL |
| All `frontend/src/pages/*.css` files (20 of them) | Mixed CSS+Tailwind approach, `.broken` files in repo | Tailwind only; shadcn/ui for component styles |

---

## 12. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Data migration loses follow/comment data (comma-separated parsing) | Medium | Write migration with comprehensive assertions; keep old DB live for 30-day rollback window |
| WebSocket multi-instance fan-out fails under load | Low | Test Redis pub/sub broker with multi-instance Docker Compose in Phase 4; load test with k6 |
| Next.js App Router learning curve delays frontend | Medium | Phase 1 budget 1 extra week; defer RSC optimization to Phase 6 if needed |
| Cloudinary SDK unfamiliar to dev team | Low | MinIO + Cloudinary SDK both available in local Docker Compose; document upload flow in ADR |
| Flyway migration conflicts if schema diverges | Low | `ddl-auto=validate` in production; migrations run in CI before every deploy |
| Admin approval workflow blocks early pilot users | Medium | Seed script for initial authority accounts; admin can bulk-approve in the dashboard |
