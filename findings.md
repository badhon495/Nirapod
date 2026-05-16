# Nirapod — Complete Project Recreation Blueprint

> Generated: 2026-05-16 | Source: Full static analysis of all source files, migrations, configs, and dependencies

---

## 1. Executive Summary

### Purpose
Nirapod (Bengali: "Safe") is a Bangladesh civic engagement platform enabling citizens to formally report local issues — crime, fires, infrastructure failures, and animal welfare violations — directly to the responsible government authority.

### Business Problem
Bangladesh lacks a structured, transparent channel for citizens to report civic problems and track resolution. Traditional approaches (phone calls, in-person visits) produce no audit trail, no status tracking, and no accountability. Nirapod digitizes this workflow: submission → routing → authority response → resolution, with full public visibility and status history.

### Target Users

| Role | Description |
|------|-------------|
| CITIZEN | Any Bangladeshi citizen; files complaints, tracks progress, follows cases |
| POLICE | Police authority; manages crime category complaints |
| FIRE | Fire Service; manages fire-related complaints |
| CITY | City Corporation; manages infrastructure complaints |
| ANIMAL | Animal Welfare authority; manages animal complaints |
| ADMIN | System administrator; manages all users, data, analytics |

### Primary Workflows
1. Citizen registers → verifies email via OTP → submits complaint with evidence photos
2. Appropriate authority views queue → updates status (UNSOLVED → IN_PROGRESS → SOLVED)
3. Citizens and public track via ID or browse feed → follow cases → leave comments
4. Admin monitors platform via dashboard, analytics, audit log, and weekly email reports

### Architecture Summary
- **Backend:** Spring Boot 3.5 / Java 21 — multi-module Maven (`nirapod-core` + `nirapod-api`), PostgreSQL (Flyway migrations), Redis (OTP/JWT/cache), STOMP WebSockets
- **Frontend:** Next.js 16 / React 19 / TypeScript — App Router, Auth.js (NextAuth v5), TanStack Query, Tailwind CSS v4
- **Infrastructure:** Docker Compose (4 services), Cloudinary CDN, Gmail SMTP, Sentry error tracking
- **Deployment targets:** Docker Compose (self-hosted), Render (render.yaml), Vercel (frontend)

---

## 2. Complete Feature Breakdown

### Feature 1: User Registration & Email Verification

**Purpose:** Onboard citizens with identity verification via NID (National ID).

**User Flow:**
1. POST `/api/v1/auth/signup` with NID, email, phone, password, name, addresses
2. Account created with `status=PENDING`
3. OTP sent to email via Gmail SMTP
4. User submits OTP to `/api/v1/auth/verify-otp`
5. Status upgraded to `ACTIVE`

**Backend Logic:**
- `AuthService.signup()` validates no duplicate email/NID/phone → saves `User` with `BCrypt(12)` password hash → generates 6-digit OTP via `OtpService` → stores OTP in Redis with TTL → sends email via `EmailService`
- `AuthService.verifyOtp()` checks Redis OTP → on match, sets `status=ACTIVE` → deletes OTP from Redis

**Database Tables:** `users`
**APIs:** `POST /api/v1/auth/signup`, `POST /api/v1/auth/verify-otp`, `POST /api/v1/auth/send-otp`
**Dependencies:** Redis (OTP TTL), Gmail SMTP, BCrypt
**Rate Limiting:** 10 signups/hour per IP; 5 OTP sends/hour per IP
**Edge Cases:** Duplicate NID/email/phone → 409; OTP already active prevents re-send; expired OTP rejected
**Missing:** No NID format validation at service layer (only VARCHAR(10) DB constraint); no phone format enforcement

---

### Feature 2: Authentication (Credentials + Google OAuth)

**Purpose:** Secure login with JWT-based session management.

**User Flow (Credentials):**
1. Frontend calls NextAuth `signIn("credentials", {email, password})`
2. NextAuth `authorize()` POSTs to `/api/v1/auth/login`
3. Backend validates credentials → issues JWT access token (15 min) + refresh token (7 days)
4. Refresh token stored in Redis + `HttpOnly` cookie (`refresh_token`, path `/api/v1/auth/refresh`, SameSite=Strict, Secure)
5. Access token stored in NextAuth JWT session

**User Flow (Google):**
1. Frontend calls NextAuth `signIn("google")`
2. Google returns ID token to NextAuth callback
3. NextAuth POSTs `{idToken}` to `/api/v1/auth/google`
4. Backend verifies token via Google API Client → finds or creates `User` + `OAuthAccount` record → issues tokens

**Token Refresh:**
- NextAuth `jwt()` callback checks `accessTokenExpires`
- If expired, POSTs to `/api/v1/auth/refresh` with refresh token in Cookie header
- Backend `RefreshTokenService.consume()` validates in Redis → deletes old → issues new tokens (rotation)

**Logout:**
- Access token JTI blacklisted in Redis with remaining TTL
- Refresh token deleted from Redis
- Cookie cleared (maxAge=0)

**Database Tables:** `users`, `oauth_accounts`
**APIs:** `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/google`
**Security:** BCrypt(12), HttpOnly/Secure cookie, JWT blacklist, refresh token rotation
**Missing:** No multi-device session tracking; no "logout all devices" endpoint

---

### Feature 3: Password Reset

**Purpose:** Allow users to reset forgotten passwords.

**User Flow:**
1. Submit email to `/api/v1/auth/forgot-password/send-otp`
2. OTP sent to email
3. Submit email + OTP + new password to `/api/v1/auth/forgot-password/reset`
4. Password updated with new BCrypt(12) hash

**Rate Limiting:** 3 OTP sends per hour per IP
**Edge Cases:** Non-existent email → 404; invalid/expired OTP → 401

---

### Feature 4: Complaint Submission

**Purpose:** Core workflow — citizen files a civic complaint.

**User Flow:**
1. Authenticated user fills form: title, details, category, urgency, district, area, optional GPS coords, photos, tags, public/private toggle
2. Photos pre-uploaded to Cloudinary via `POST /api/v1/files/upload` (returns `publicId`)
3. `POST /api/v1/complaints` with full payload
4. System assigns sequential `tracking_id` (BIGSERIAL), creates complaint with `status=UNSOLVED`
5. Cache evicted → complaint appears in public feed

**Backend Logic (`ComplaintService.create()`):**
- Validates user is `ACTIVE`
- OWASP HTML sanitizer applied to `details` field (FORMATTING + LINKS policy)
- Tags stored in `complaint_tags` join table
- Photos stored in `complaint_photos` with `uploaded_by` reference
- Audit log entry created
- Redis cache `complaints` evicted via `@CacheEvict`

**Database Tables:** `complaints`, `complaint_photos`, `complaint_tags`
**APIs:** `POST /api/v1/complaints`, `POST /api/v1/files/upload`
**Edge Cases:** PENDING/SUSPENDED users cannot submit; private complaints only visible to owner + matching authority + admin
**Missing:** No complaint rate limiting per user; no duplicate detection

---

### Feature 5: Complaint Feed (Public Browse)

**Purpose:** Citizens browse all public complaints with filtering.

**User Flow:**
```
GET /api/v1/complaints?category=POLICE&status=UNSOLVED&district=Dhaka&page=0&size=20
→ paginated ComplaintSummaryResponse
```

**Authority Feed Override:** POLICE/FIRE/CITY/ANIMAL roles receive ALL complaints for their category (including non-public)

**Caching:** Redis cache key `{category}-{status}-{district}-{pageNumber}`; evicted on any create/update/delete

**Frontend:** `ComplaintFeed` component with infinite scroll via `useInfiniteQuery`, `ComplaintFilters` sidebar

**Missing:** District filter not combinable with category/status (mutually exclusive branches in current code); no full-text search

---

### Feature 6: Complaint Detail & Tracking

**Purpose:** View full complaint with status history, comments, photos.

**User Flows:**
1. **By ID (auth optional):** `GET /api/v1/complaints/{id}` — enforces read access for private complaints
2. **By Tracking ID (public):** `GET /api/v1/complaints/track/{trackingId}` — only public complaints

**Access Rules:**
- Public complaints: everyone
- Private complaints: owner, matching authority role, admin

---

### Feature 7: Complaint Status Management (Authority)

**Purpose:** Authorities update complaint status through lifecycle.

**Status Values:** `UNSOLVED` → `IN_PROGRESS` → `SOLVED` (reversible)

**Access Control:** Authority role must match complaint category (POLICE → POLICE complaints only); ADMIN can update any

**Side Effects:**
- Status history record created in `complaint_status_history`
- Notifications sent to complaint owner + followers via `NotificationService.notifyStatusChange()`
- Redis cache evicted

---

### Feature 8: File Upload (Cloudinary)

**Purpose:** Upload evidence photos for complaints.

**Security:** Apache Tika validates actual MIME type from file bytes (not just Content-Type header); 10MB file limit; 20MB request limit
**Missing:** No virus scanning; no image dimension limits

---

### Feature 9: Comments

**Purpose:** Public discussion threads on complaints.

**User Flow:**
- `POST /api/v1/complaints/{complaintId}/comments` — add (authenticated)
- `GET /api/v1/complaints/{complaintId}/comments` — read (public, no auth)
- `PUT /api/v1/complaints/{complaintId}/comments/{commentId}` — edit own
- `DELETE /api/v1/complaints/{complaintId}/comments/{commentId}` — delete own or admin

**Security Gap:** Comment content not sanitized with OWASP sanitizer (unlike complaint `details`)

---

### Feature 10: Follow / Unfollow Complaints

**Purpose:** Receive updates on complaints without having submitted them.

**Effects:** Followed complaints trigger notifications on status change
**Constraints:** UNIQUE(user_id, complaint_id) prevents duplicate follows

---

### Feature 11: Complaint Reporting

**Purpose:** Flag inappropriate complaints for admin review.

**Flow:** User reports → stored in `complaint_reports` → admin reviews at `/admin/reports` → admin dismisses
**Constraints:** One report per user per complaint (UNIQUE constraint)

---

### Feature 12: Notifications

**Purpose:** Alert users about complaint status changes, new comments, authority notes.

**Delivery Channels:**
1. REST: `GET /api/v1/notifications` — paginated list
2. WebSocket: push to `/user/{userId}/queue/notifications` via STOMP
3. Unread count: `GET /api/v1/notifications/unread-count`
4. Mark read: `PUT /api/v1/notifications/read-all`, `PUT /api/v1/notifications/{id}/read`

---

### Feature 13: Live Chat

**Purpose:** Real-time community messaging (not complaint-specific, global channel).

**Flow:**
1. User opens `/livechat` → frontend connects via STOMP over SockJS to `/ws`
2. JWT validated in `WebSocketChannelInterceptor` on `CONNECT` frame
3. Messages → `/app/chat` → `ChatService` persists → broadcast to `/topic/livechat`
4. History: `GET /api/v1/chat/history` (paginated)

**Missing:** No message moderation/deletion; no per-room scoping

---

### Feature 14: User Presence

**Purpose:** Show online status in live chat.

**Implementation:** `PresenceService` tracks online users in Redis; WebSocket connect/disconnect events update presence set

---

### Feature 15: Admin Dashboard

**Sub-features:**
- **Stats:** totals by status, category, district (top 10)
- **Analytics:** complaint counts by district × category for date range → Recharts bar chart
- **User Management:** list/filter/approve/suspend users; create authority accounts
- **Audit Log:** paginated system activity with user/action filters
- **Investigation:** lookup user by NID or document number
- **Report Management:** review and dismiss flagged complaints

**Access:** All endpoints require `ADMIN` role

---

### Feature 16: Weekly Stats Email

**Purpose:** Automated admin reporting.

**Trigger:** `@Scheduled(cron = "0 0 8 * * MON")` — every Monday 8:00 AM

**Implementation:** Fetches stats → renders Thymeleaf `weekly-stats` template → sends HTML email to `app.admin.email`; silently skips if email not configured

**Risk:** Thymeleaf template `weekly-stats.html` was not found in repository scan — service will throw at runtime if missing

---

### Feature 17: Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/v1/auth/login` | 5 per 15 min per IP |
| `/api/v1/auth/signup` | 10 per hour per IP |
| `/api/v1/auth/send-otp` | 5 per hour per IP |
| `/api/v1/auth/forgot-password/send-otp` | 3 per hour per IP |

**Implementation:** Bucket4j in-process `ConcurrentHashMap`
**Gap:** Complaint creation, comments, file upload have NO rate limiting; in-process state lost on restart; not distributed

---

### Feature 18: Audit Logging

**Logged Actions:** USER_SIGNUP, OTP_VERIFIED, PASSWORD_RESET, COMPLAINT_CREATED, COMPLAINT_STATUS_UPDATED, COMPLAINT_NOTE_UPDATED, COMPLAINT_DELETED, PHOTO_ADDED, USER_APPROVED, USER_SUSPENDED, AUTHORITY_USER_CREATED, REPORT_DISMISSED

**Schema:** `audit_log` with JSONB `details`, IP address, user agent, entity reference
**Index:** BRIN on `created_at` for time-range queries; SET NULL on `user_id` so records survive user deletion

---

## 3. Full System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│   Next.js 16 (App Router, React 19, TypeScript)                 │
│   Auth.js (NextAuth v5) │ TanStack Query │ STOMP/SockJS         │
└───────────────┬──────────────────────────────────────┬──────────┘
                │ HTTP/REST (Axios)                     │ WebSocket
                ▼                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              Spring Boot 3.5 API (port 8080)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Controllers │→ │   Services   │→ │     Repositories      │  │
│  │ (REST/WS)   │  │ (Business)   │  │  (Spring Data JPA)    │  │
│  └─────────────┘  └──────────────┘  └───────────┬───────────┘  │
│  ┌──────────────────────────────────┐           │               │
│  │   Security Filters               │           ▼               │
│  │ JwtAuthFilter │ RateLimitFilter  │  ┌─────────────────────┐  │
│  │ WsChannelInterceptor             │  │ PostgreSQL 16        │  │
│  └──────────────────────────────────┘  │ (14 tables, Flyway) │  │
│  ┌──────────┐   ┌──────────────────┐   └─────────────────────┘  │
│  │  Redis   │   │   Cloudinary CDN │                             │
│  │ OTP/JWT/ │   │  (image storage) │                             │
│  │ cache    │   └──────────────────┘                             │
│  └──────────┘                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Module Structure

```
backend/
├── nirapod-core (JAR — domain library)
│   ├── model/         JPA entities + enums (14 classes, 5 enums)
│   └── repository/    Spring Data JPA interfaces (10 repos)
└── nirapod-api (Spring Boot executable JAR)
    ├── controller/    REST + WebSocket (10 controllers, ~55 endpoints)
    ├── service/       Business logic + scheduled tasks (17 services)
    ├── config/        Spring @Configuration (9 classes)
    ├── security/      JWT filter + rate limiter + WS interceptor
    ├── dto/           Request/Response records (35+ DTOs)
    └── exception/     GlobalExceptionHandler + ApiException
```

**Layer rule enforced by ArchUnit:** `controller` → `service` → `repository`; no reverse dependencies

### Frontend Structure

```
nirapod-web/src/
├── app/              Next.js App Router
│   ├── (admin)/      6 admin pages + view components
│   ├── (auth)/       3 auth pages (login, signup, forgot-password)
│   ├── (main)/       6 main pages (home, complaint/[id], create, profile, notifications, livechat, tracker)
│   ├── (privileged)/ Authority queue
│   └── api/          2 API routes (debug-session, health)
├── auth.ts           NextAuth config
├── middleware.ts     Edge route guards
├── components/       8 complaint + 2 layout + 9 shadcn UI
├── hooks/            6 custom React hooks
├── lib/              Axios config, Zod schemas, utils
└── types/            6 TypeScript type files
```

### Request Lifecycle

```
1. Browser → Next.js middleware (edge): session check → allow/redirect
2. Page server component: calls auth() → renders with session
3. Client component: TanStack Query calls Axios with Bearer token
4. Axios interceptor: attaches Authorization: Bearer {accessToken}
5. Spring Boot: RateLimitFilter → JwtAuthenticationFilter → SecurityFilterChain
6. JwtAuthenticationFilter: validates JWT signature + expiry + Redis blacklist
7. Controller: @PreAuthorize → Service → Repository → PostgreSQL
8. Service: Redis cache read/write
9. Response: DTO → JSON → client
```

### Authentication Flow

```
Credentials Login:
Browser → NextAuth authorize() → POST /api/v1/auth/login
  → BCrypt.matches() → JWT generated (HS256, 15min)
  → Refresh token stored Redis (key: "refresh:{token}", value: userId, TTL 7d)
  → Refresh cookie set (HttpOnly, Secure, SameSite=Strict, path=/api/v1/auth/refresh)
  → TokenResponse returned → NextAuth stores accessToken in encrypted session cookie

Token Refresh:
NextAuth jwt() detects expired token
  → POST /api/v1/auth/refresh (refresh token as Cookie header, server-side)
  → RefreshTokenService.consume() → validates + deletes old Redis entry
  → New access + refresh tokens issued (rotation)

Logout:
  → Access token JTI stored Redis blacklist (TTL = remaining token lifetime)
  → Refresh token deleted from Redis
  → Refresh cookie cleared (maxAge=0)
```

### RBAC Structure

```
CITIZEN:  create complaints, view public complaints, comment, follow, report
POLICE:   CITIZEN + view/update ALL POLICE category complaints
FIRE:     CITIZEN + view/update ALL FIRE category complaints
CITY:     CITIZEN + view/update ALL CITY category complaints
ANIMAL:   CITIZEN + view/update ALL ANIMAL category complaints
ADMIN:    full access + user management + admin endpoints
```

### Caching Strategy

| Cache | Key Pattern | Eviction |
|-------|-------------|----------|
| Complaint feed | `complaints::{category}-{status}-{district}-{page}` | `@CacheEvict` on create/update/delete |
| OTP | `otp:{email}` | On verify/consume; TTL 10 min |
| Refresh tokens | `refresh:{token}` | On consume/revoke; TTL 7 days |
| JWT blacklist | `jwt:blacklist:{jti}` | Auto-expire at token expiry |
| User presence | Redis set | WebSocket disconnect |

### WebSocket Architecture

```
STOMP over SockJS:
  Endpoint: /ws
  JWT validated in WebSocketChannelInterceptor on CONNECT frame

Topics:
  /topic/livechat                    → broadcast chat (subscribe)
  /user/{id}/queue/notifications     → user-specific notifications (subscribe)

Message Destinations:
  /app/chat                          → ChatController.handleMessage() → persists + broadcasts
```

---

## 4. Technology Stack Analysis

### Backend

| Dependency | Version | Purpose | Critical | Alternative |
|-----------|---------|---------|----------|-------------|
| Spring Boot | 3.5.0 | Web framework | Yes | Quarkus |
| Java | 21 LTS | Runtime | Yes | — |
| PostgreSQL | 16 | Primary database | Yes | MySQL |
| Spring Data JPA / Hibernate | Boot-managed | ORM | Yes | jOOQ |
| Flyway | Boot-managed | DB migrations | Yes | Liquibase |
| Spring Security | Boot-managed | Auth framework | Yes | — |
| Spring WebSocket | Boot-managed | STOMP support | Yes | — |
| jjwt | 0.12.6 | JWT | Yes | Nimbus JOSE |
| Spring Data Redis | Boot-managed | Cache/OTP/tokens | Yes | Caffeine (local) |
| Bucket4j | 8.10.1 | Rate limiting | No | Spring Cloud Gateway |
| Cloudinary | 1.38.0 | Image CDN | No | AWS S3 |
| Spring Mail | Boot-managed | Email | No | SendGrid |
| Thymeleaf | 3.1.3 | Email templates | No | FreeMarker |
| OWASP HTML Sanitizer | 20240325.1 | XSS prevention | Yes | jsoup |
| Apache Tika | 2.9.2 | File type detection | Yes | Apache Commons |
| springdoc OpenAPI | 2.8.8 | API docs | No | — |
| Sentry Spring Boot | 8.6.0 | Error tracking | No | Datadog |
| Google API Client | 2.7.0 | OAuth verification | No | Firebase |
| Lombok | Boot-managed | Boilerplate | No | Java records |
| Testcontainers | 1.20.4 | Integration tests | No (test) | — |
| ArchUnit | 1.3.0 | Architecture tests | No (test) | — |
| JaCoCo | 0.8.12 | Code coverage (80% gate) | No | — |

### Frontend

| Package | Version | Purpose | Critical |
|---------|---------|---------|----------|
| Next.js | 16.2.6 | Framework | Yes |
| React | 19.2.4 | UI | Yes |
| next-auth | 5.0.0-beta.31 | Auth (**BETA — risk**) | Yes |
| @tanstack/react-query | 5.100.9 | Server state | Yes |
| axios | 1.16.0 | HTTP client | No |
| react-hook-form | 7.75.0 | Forms | No |
| zod | 4.4.3 | Validation | Yes |
| zustand | 5.0.13 | Client state | No |
| framer-motion | 12.38.0 | Animations | No |
| recharts | 3.8.1 | Admin charts | No |
| leaflet + react-leaflet | 1.9.4 / 5.0.0 | Maps | No |
| @stomp/stompjs + sockjs-client | 7.3.0 / 1.6.1 | WebSocket | Yes |
| @sentry/nextjs | 10.0.0 | Error tracking | No |
| tailwindcss | 4 | Styling | Yes |
| shadcn | 4.7.0 | Component templates | No |

**Version concerns:**
- `next-auth@5.0.0-beta.31` — pre-release; breaking changes possible
- `sockjs-client@1.6.1` — verify this version has no known XSS vulnerabilities

---

## 5. Database Documentation

### Complete Schema

#### `users`
```sql
id                UUID PK DEFAULT gen_random_uuid()
nid               VARCHAR(10) UNIQUE NOT NULL
email             VARCHAR(255) UNIQUE NOT NULL
phone             VARCHAR(20) UNIQUE NOT NULL
password_hash     TEXT NULL                          -- null for OAuth-only accounts
name              VARCHAR(255) NOT NULL
role              VARCHAR(20) NOT NULL DEFAULT 'CITIZEN'
status            VARCHAR(20) NOT NULL DEFAULT 'PENDING'
present_address   TEXT NOT NULL
permanent_address TEXT NOT NULL
created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()

Indexes: idx_users_email, idx_users_nid
```

#### `user_documents`
```sql
id              UUID PK
user_id         UUID FK→users(id) ON DELETE CASCADE
type            VARCHAR(50) NOT NULL
document_number VARCHAR(100) NULL
file_public_id  TEXT NOT NULL                        -- Cloudinary publicId
verified        BOOLEAN DEFAULT FALSE
created_at      TIMESTAMPTZ DEFAULT now()

Index: idx_user_documents_user_id
```

#### `oauth_accounts`
```sql
provider    VARCHAR(50) NOT NULL                     -- "google"
provider_id VARCHAR(255) NOT NULL                    -- Google sub claim
user_id     UUID FK→users(id) ON DELETE CASCADE
PK: (provider, provider_id)

Index: idx_oauth_accounts_user_id
```

#### `audit_log`
```sql
id          UUID PK
user_id     UUID FK→users(id) ON DELETE SET NULL     -- survives user deletion
action      VARCHAR(100) NOT NULL
entity_type VARCHAR(50) NULL
entity_id   UUID NULL
ip_address  VARCHAR(45) NULL
user_agent  TEXT NULL
details     JSONB NULL
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()

Indexes: idx_audit_log_user (user_id, created_at DESC)
         idx_audit_log_time BRIN (created_at)        -- efficient for time-range scans
```

#### `complaints`
```sql
id             UUID PK
tracking_id    BIGSERIAL UNIQUE NOT NULL              -- human-readable tracking number
user_id        UUID FK→users(id) NOT NULL
category       VARCHAR(20) NOT NULL                   -- POLICE|FIRE|CITY|ANIMAL
urgency        VARCHAR(10) NOT NULL                   -- LOW|MEDIUM|HIGH
status         VARCHAR(20) NOT NULL DEFAULT 'UNSOLVED'
title          VARCHAR(500) NOT NULL
details        TEXT NOT NULL                          -- OWASP sanitized at service layer
district       VARCHAR(100) NOT NULL
area           VARCHAR(100) NOT NULL
location_lat   DECIMAL(10,8) NULL
location_lng   DECIMAL(11,8) NULL
location_text  TEXT NULL
is_public      BOOLEAN NOT NULL DEFAULT TRUE
authority_note TEXT NULL
created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
resolved_at    TIMESTAMPTZ NULL                       -- set when status → SOLVED

Indexes: idx_complaints_category_status (category, status, created_at DESC)  -- main feed index
         idx_complaints_user_id (user_id)
         idx_complaints_district (district)
```

#### `complaint_photos`
```sql
id             UUID PK
complaint_id   UUID FK→complaints(id) ON DELETE CASCADE
file_public_id TEXT NOT NULL
uploaded_by    UUID FK→users(id)
is_evidence    BOOLEAN NOT NULL DEFAULT FALSE
created_at     TIMESTAMPTZ DEFAULT now()

Index: idx_complaint_photos_complaint
```

#### `complaint_tags`
```sql
complaint_id UUID FK→complaints(id) ON DELETE CASCADE
tag          VARCHAR(100) NOT NULL
PK: (complaint_id, tag)                              -- prevents duplicate tags
```

#### `complaint_follows`
```sql
user_id      UUID FK→users(id) ON DELETE CASCADE
complaint_id UUID FK→complaints(id) ON DELETE CASCADE
created_at   TIMESTAMPTZ DEFAULT now()
PK: (user_id, complaint_id)

Index: idx_complaint_follows_user (user_id)
```

#### `complaint_status_history`
```sql
id           UUID PK
complaint_id UUID FK→complaints(id) ON DELETE CASCADE
changed_by   UUID FK→users(id)
old_status   VARCHAR(20) NOT NULL
new_status   VARCHAR(20) NOT NULL
note         TEXT NULL
created_at   TIMESTAMPTZ NOT NULL DEFAULT now()

Index: idx_status_history_complaint (complaint_id, created_at DESC)
```

#### `comments`
```sql
id           UUID PK
complaint_id UUID FK→complaints(id) ON DELETE CASCADE
user_id      UUID FK→users(id)
content      TEXT NOT NULL
created_at   TIMESTAMPTZ DEFAULT now()
updated_at   TIMESTAMPTZ DEFAULT now()

Indexes: idx_comments_complaint_id (complaint_id, created_at ASC)
         idx_comments_user_id (user_id)
```

#### `complaint_reports`
```sql
id           UUID PK
complaint_id UUID FK→complaints(id) ON DELETE CASCADE
reporter_id  UUID FK→users(id)
reason       VARCHAR(100) NOT NULL
created_at   TIMESTAMPTZ DEFAULT now()
UNIQUE (complaint_id, reporter_id)

Indexes: idx_complaint_reports_complaint, idx_complaint_reports_reporter
```

#### `notifications`
```sql
id           UUID PK
user_id      UUID FK→users(id) ON DELETE CASCADE
type         VARCHAR(50) NOT NULL
title        VARCHAR(255) NOT NULL
message      TEXT NOT NULL
complaint_id UUID FK→complaints(id) ON DELETE SET NULL  -- nullable
is_read      BOOLEAN NOT NULL DEFAULT FALSE
created_at   TIMESTAMPTZ DEFAULT now()

Indexes: idx_notifications_user_unread (user_id, is_read) WHERE NOT is_read  -- partial index
         idx_notifications_user_time (user_id, created_at DESC)
```

#### `chat_messages`
```sql
id         UUID PK
user_id    UUID FK→users(id)
content    TEXT NOT NULL
created_at TIMESTAMPTZ DEFAULT now()

Index: idx_chat_messages_created_at (created_at DESC)
```

### ERD Relationship Summary

```
users ──< user_documents
users ──< oauth_accounts
users ──< complaints
users ──< complaint_follows >── complaints
users ──< complaint_status_history >── complaints
users ──< comments >── complaints
users ──< complaint_reports >── complaints
users ──< notifications >── complaints (nullable FK)
users ──< audit_log
users ──< chat_messages
complaints ──< complaint_photos
complaints ──< complaint_tags
```

### Performance Notes
- **Main feed query** — `idx_complaints_category_status` covers primary filter pattern
- **Notification unread count** — partial index on `is_read=false` keeps count queries fast
- **Audit log time range** — BRIN index appropriate for append-only time-ordered data
- **Missing** — no composite index on `(user_id, status)` for user's filtered views; no index on analytics queries

---

## 6. API Documentation

### Auth (`/api/v1/auth`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/signup` | None | Register citizen |
| POST | `/login` | None | Credential login |
| POST | `/refresh` | Cookie | Refresh access token |
| POST | `/logout` | Bearer | Revoke tokens |
| POST | `/send-otp` | None | Send verification OTP |
| POST | `/verify-otp` | None | Verify email |
| POST | `/forgot-password/send-otp` | None | Password reset OTP |
| POST | `/forgot-password/reset` | None | Apply new password |
| POST | `/google` | None | Google OAuth |

**POST `/api/v1/auth/login`**
```json
Request:  { "email": "string", "password": "string" }
Response: {
  "accessToken": "string",
  "refreshToken": "string",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "userId": "uuid",
  "role": "CITIZEN|POLICE|FIRE|CITY|ANIMAL|ADMIN",
  "name": "string"
}
Errors: 401 (invalid credentials), 403 (pending/suspended)
```

**POST `/api/v1/auth/signup`**
```json
Request: {
  "nid": "string(10)",
  "email": "string",
  "phone": "string",
  "password": "string",
  "name": "string",
  "presentAddress": "string",
  "permanentAddress": "string"
}
Response: 204 No Content
Errors: 409 (duplicate email/NID/phone), 400 (validation)
```

### Complaints (`/api/v1/complaints`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| POST | `/` | Bearer | Any authenticated |
| GET | `/` | Optional | Public (authority gets full category feed) |
| GET | `/{id}` | Optional | Access control enforced per complaint visibility |
| GET | `/track/{trackingId}` | None | Public |
| GET | `/user/{userId}` | Bearer | Self or ADMIN |
| GET | `/my` | Bearer | Any authenticated |
| PUT | `/{id}/status` | Bearer | POLICE/FIRE/CITY/ANIMAL/ADMIN |
| PUT | `/{id}/note` | Bearer | POLICE/FIRE/CITY/ANIMAL/ADMIN |
| DELETE | `/{id}` | Bearer | Owner (unsolved only) or ADMIN |
| POST | `/{id}/photos` | Bearer | Any authenticated |

**POST `/api/v1/complaints`**
```json
Request: {
  "category": "POLICE|FIRE|CITY|ANIMAL",
  "urgency": "LOW|MEDIUM|HIGH",
  "title": "string (max 500)",
  "details": "string (OWASP sanitized server-side)",
  "district": "string",
  "area": "string",
  "locationLat": "decimal(10,8)",
  "locationLng": "decimal(11,8)",
  "locationText": "string",
  "isPublic": true,
  "tags": ["string"],
  "photoPublicIds": ["string"]
}
Response: 201 ComplaintDetailResponse
```

**PUT `/api/v1/complaints/{id}/status`**
```json
Request:  { "status": "UNSOLVED|IN_PROGRESS|SOLVED", "note": "string" }
Response: ComplaintDetailResponse
```

### Users (`/api/v1/users`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/me` | Bearer | Own profile |
| GET | `/{userId}` | Bearer | Self or ADMIN |
| PUT | `/me` | Bearer | Update profile |
| PUT | `/me/password` | Bearer | Change password |

**GET `/api/v1/users/me`** Response:
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "phone": "string",
  "nid": "string",
  "role": "string",
  "status": "string",
  "presentAddress": "string",
  "permanentAddress": "string",
  "createdAt": "ISO8601"
}
```

### Admin (`/api/v1/admin`) — ADMIN role required

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/users` | List users (filter: role, status) |
| GET | `/users/{userId}` | User detail with documents |
| PUT | `/users/{userId}/approve` | Approve PENDING user |
| PUT | `/users/{userId}/suspend` | Suspend user |
| POST | `/users/authority` | Create authority user |
| GET | `/stats` | Platform statistics |
| GET | `/analytics` | Complaint analytics (from/to params) |
| GET | `/audit` | Audit log (userId, action filters) |
| GET | `/investigate/nid/{nid}` | Lookup by NID |
| GET | `/investigate/document/{number}` | Lookup by document |
| GET | `/reports` | List complaint reports |
| DELETE | `/reports/{reportId}` | Dismiss report |

### Notifications (`/api/v1/notifications`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Paginated notifications |
| GET | `/unread-count` | Unread count |
| PUT | `/read-all` | Mark all read |
| PUT | `/{id}/read` | Mark single read |

### Social Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/complaints/{id}/follow` | Follow status + count |
| POST | `/complaints/{id}/follow` | Follow |
| DELETE | `/complaints/{id}/follow` | Unfollow |
| POST | `/complaints/{id}/report` | Report complaint |
| GET | `/complaints/{id}/comments` | Get comments (public) |
| POST | `/complaints/{id}/comments` | Add comment |
| PUT | `/complaints/{id}/comments/{cid}` | Edit own comment |
| DELETE | `/complaints/{id}/comments/{cid}` | Delete comment |

### File

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/files/upload` | Upload image → returns Cloudinary publicId |

### API Security Issues

1. `GET /api/v1/complaints/{id}` — `principal` nullable for unauthenticated access; controller passes null userId defaulting to `UserRole.CITIZEN`; verify service handles null requesterId correctly
2. Complaint creation, comments, file upload have **no rate limiting** — spam vector
3. `X-Forwarded-For` rate limit key spoofable if not behind trusted reverse proxy

---

## 7. Frontend Analysis

### Page Structure

| Route | Auth | Description |
|-------|------|-------------|
| `/` | — | Redirect to /home |
| `/login` | Public | Credentials + Google login |
| `/signup` | Public | Registration form |
| `/forgot-password` | Public | OTP-based reset |
| `/home` | Required | Complaint feed with filters |
| `/complaint/[id]` | Optional | Full complaint detail |
| `/create-complaint` | Required | Submit complaint |
| `/profile` | Required | User profile |
| `/notifications` | Required | Notification center |
| `/livechat` | Required | STOMP live chat |
| `/tracker` | Public | Track by tracking ID |
| `/queue` | Authority+ | Authority complaint queue |
| `/admin/dashboard` | ADMIN | Stats + Recharts |
| `/admin/users` | ADMIN | User management |
| `/admin/analytics` | ADMIN | Date-range analytics |
| `/admin/audit` | ADMIN | Audit log |
| `/admin/investigate` | ADMIN | NID/doc lookup |
| `/admin/reports` | ADMIN | Report management |

### Component Hierarchy

```
app/layout.tsx (RootLayout)
└── providers.tsx (QueryClientProvider + ThemeProvider + SessionProvider)
    ├── (auth)/* (no Navbar)
    └── (main)/(privileged)/(admin)/layout.tsx
        └── Navbar → NavActions
        └── Page (server component)
            └── *View.tsx (client component)
                ├── complaint/ComplaintFeed
                │   ├── ComplaintCard
                │   └── ComplaintFilters
                ├── complaint/ComplaintDetailView
                │   ├── PhotoGallery
                │   ├── CommentSection
                │   ├── FollowButton
                │   ├── ReportModal
                │   ├── StatusBadge
                │   └── ComplaintMap
                └── ui/* (Button, Card, Badge, Dialog, Input, Label, Progress, Separator, Sonner)
```

### State Management

| Type | Tool | Usage |
|------|------|-------|
| Server state | TanStack Query | All API data |
| Auth state | NextAuth session | Identity, role, access token |
| Client state | Zustand | Presence, connection status |
| Form state | React Hook Form | All forms with Zod validation |
| WebSocket state | useWebSocket hook | STOMP lifecycle |

### Custom Hooks

| Hook | Operations |
|------|-----------|
| `useComplaints` | useInfiniteQuery (feed), useQuery (detail/track), useMutation (create/update/delete) |
| `useComments` | useQuery, useMutation (add/edit/delete) |
| `useFollow` | useQuery (status), useMutation (follow/unfollow) |
| `useNotifications` | useQuery, useMutation (mark read) |
| `useWebSocket` | STOMP connect/subscribe/disconnect |
| `usePresence` | Online users from Redis via WS |

### Identified Frontend Issues

1. **`/authority` vs `/queue` mismatch** — middleware guards `AUTHORITY_PATHS = ["/authority"]` but actual privileged routes are under `(privileged)/queue`. Guard is dead code for that path.
2. **`next-auth` beta** — `session.error` for `RefreshAccessTokenError` may not be visually handled in all pages; user could silently receive stale auth
3. **Leaflet SSR** — `ComplaintMap` uses browser APIs; requires `dynamic(() => import(...), { ssr: false })` wrapper — verify implemented
4. **Debug endpoint in production** — `app/api/debug-session/route.ts` exposes session data; must be removed before production
5. **Dual toast libraries** — both `react-hot-toast` and `sonner` listed in dependencies; likely one unused

---

## 8. Backend Analysis

### Application Quality Summary

**Strengths:**
- Clean layer separation enforced by ArchUnit
- DTOs are Java records (immutable)
- `@Transactional(readOnly = true)` correctly scoped on read operations
- `HTML_POLICY.sanitize()` applied in service layer, not controller
- Audit logging consistently applied across all mutations
- `@CacheEvict(allEntries = true)` prevents stale data

### Code Issues

| Issue | Location | Impact |
|-------|----------|--------|
| `roleToCategory()` duplicated | `ComplaintService` + `ComplaintController` | Maintenance risk |
| Photo loop insert (N saves) | `ComplaintService.create()` | Performance — use `saveAll()` |
| `AdminService.getStats()` serial queries (8+) | `AdminService` | Performance at scale |
| `WeeklyStatsEmailService` blocks scheduler thread | `WeeklyStatsEmailService.sendWeeklyStats()` | Reliability — add `@Async` |
| Analytics returns unbounded list | `AdminService.getAnalytics()` | Memory risk on large date ranges |
| Comment content not sanitized | `CommentService` | XSS gap |

### Security Filter Stack Order

```
1. RateLimitFilter (before UsernamePasswordAuthenticationFilter)
2. JwtAuthenticationFilter (before UsernamePasswordAuthenticationFilter)
3. Spring Security filter chain
```

### Exception Handling

`GlobalExceptionHandler` maps:
- `ApiException` → configured HTTP status
- `MethodArgumentNotValidException` → 400 with field errors
- Generic `Exception` → 500

`ApiException` factory: `notFound` (404), `forbidden` (403), `unauthorized` (401), `conflict` (409), `badRequest` (400)

---

## 9. Authentication & Security Review

### Security Assessment

| Aspect | Implementation | Assessment |
|--------|----------------|------------|
| Password hashing | BCrypt(12) | Secure |
| JWT algorithm | HS256 | Acceptable; RS256 preferred |
| Access token TTL | 15 minutes | Secure |
| Refresh token storage | Redis server-side | Secure |
| Refresh token rotation | Yes | Secure |
| JWT blacklisting | Redis JTI | Correct pattern |
| Refresh cookie | HttpOnly, Secure, SameSite=Strict | Secure |
| CSRF | Stateless JWT, disabled | Correct |
| CORS | Explicit origin whitelist | Secure |

### OWASP Top 10

| Risk | Status |
|------|--------|
| SQL Injection | Protected — JPA parameterized queries throughout |
| XSS | Partially protected — complaint details sanitized; **comment content NOT sanitized** |
| Broken Auth | Mostly protected — **admin seed placeholder hash is a risk** |
| Broken Access Control | Protected — RBAC properly enforced |
| Security Misconfiguration | CORS correct; Swagger exposed (acceptable) |
| IDOR | UUIDs used; access control enforced |
| CSRF | N/A — stateless |
| Rate Limiting | Partial — auth only; complaint/comment/upload unprotected |

### Critical Security Risk

> **V5__seed_admin.sql contains a placeholder bcrypt hash.**
> The hash `$2a$12$placeholder.hash.replace.before.deploy.nirapod.admin` is NOT a valid bcrypt hash.
> The comment states the default is bcrypt of `ChangeMe!1` but the actual value in the file is a placeholder.
> Any admin login attempt will fail until this is replaced with a real hash.
> No environment variable substitution mechanism is implemented in the migration.
> **This MUST be fixed before first production deployment.**

### Access Control Logic (Verified Correct)

```java
// ComplaintService.enforceReadAccess():
if (complaint.isPublic()) return;                                    // public → open
if (role == UserRole.ADMIN) return;                                  // admin → open
if (complaint.getUser().getId().equals(requesterId)) return;         // owner → open
if (requesterCategory == complaint.getCategory()) return;            // matching authority → open
throw ApiException.forbidden("Not authorized");                      // else → 403
```

---

## 10. Infrastructure & Deployment

### Environment Variables

| Variable | Required | Default | Usage |
|----------|----------|---------|-------|
| `JWT_SECRET` | YES | dev string (insecure) | JWT signing |
| `AUTH_SECRET` | YES | dev string (insecure) | NextAuth encryption |
| `GOOGLE_CLIENT_ID` | OAuth only | — | Google login |
| `GOOGLE_CLIENT_SECRET` | OAuth only | — | Google login frontend |
| `MAIL_USERNAME` | Email features | — | Gmail SMTP sender |
| `MAIL_PASSWORD` | Email features | — | Gmail App Password |
| `CLOUDINARY_CLOUD_NAME` | File uploads | — | Cloudinary |
| `CLOUDINARY_API_KEY` | File uploads | — | Cloudinary |
| `CLOUDINARY_API_SECRET` | File uploads | — | Cloudinary |
| `DATABASE_URL` | Prod | `jdbc:postgresql://postgres:5432/nirapod` | PostgreSQL |
| `DATABASE_USERNAME` | Prod | `postgres` | DB user |
| `DATABASE_PASSWORD` | Prod | `postgres` | DB password |
| `REDIS_URL` | Prod | `redis://redis:6379` | Redis |
| `HIKARI_MAX_POOL_SIZE` | Prod tuning | `5` | Connection pool |
| `ADMIN_EMAIL` | Weekly reports | `$MAIL_USERNAME` | Report recipient |
| `SENTRY_DSN_BACKEND` | Monitoring | blank | Sentry |
| `NEXT_PUBLIC_SENTRY_DSN` | Monitoring | blank | Sentry frontend |
| `SPRING_PROFILES_ACTIVE` | Prod | — | `prod` activates stricter config |
| `NEXT_PUBLIC_API_URL` | Always | `http://localhost:8080` | Frontend → backend |
| `NEXT_PUBLIC_WS_URL` | Always | `ws://localhost:8080` | Frontend WebSocket |
| `FRONTEND_URL` | CORS | `http://localhost:3000` | Backend CORS origin |

### Docker Services

| Service | Image | Port | Health Check |
|---------|-------|------|--------------|
| `postgres` | postgres:16-alpine | 5432 | `pg_isready` |
| `redis` | redis:7-alpine | 6379 | `redis-cli ping` |
| `backend` | Built `./backend/Dockerfile` | 8080 | `wget /actuator/health` |
| `frontend` | Built `./nirapod-web/Dockerfile` | 3000 | — |

Both Dockerfiles are multi-stage builds optimized for production size.

### Production Readiness Gaps

1. No reverse proxy (Nginx/Traefik) config — TLS termination unspecified
2. No SSL/TLS configuration in compose or Dockerfiles
3. Admin seed placeholder hash — critical
4. Rate limiter in-process only — breaks with multiple backend instances
5. No backup strategy documented
6. No horizontal scaling config (Redis and DB are SPOFs for single-instance setup)
7. HikariCP tuned for Supabase/Neon free tier (max 5 connections) — must raise for self-hosted

---

## 11. Testing & Quality Assurance

### Backend Tests

| Layer | Files | Framework |
|-------|-------|-----------|
| Controllers (integration) | `AdminControllerIT`, `AuthControllerIT`, `ComplaintControllerIT` | Spring Boot Test + Testcontainers |
| Services (unit) | `AuthServiceTest`, `ComplaintServiceTest`, `CommentServiceTest`, `FollowServiceTest`, `OtpServiceTest` | JUnit 5 + Mockito |
| Security | `JwtServiceTest` | JUnit 5 |
| Architecture | `ArchitectureTest` | ArchUnit |

- Testcontainers uses real PostgreSQL (not H2)
- JaCoCo coverage gate: **80% line coverage minimum** — build fails below threshold

### Frontend Tests

| Layer | Files | Framework |
|-------|-------|-----------|
| Components (unit) | `ComplaintCard.test.tsx`, `FollowButton.test.tsx`, `StatusBadge.test.tsx` | Vitest + React Testing Library |
| E2E | `auth.spec.ts`, `complaint.spec.ts`, `a11y.spec.ts` | Playwright |
| API mocks | `handlers.ts`, `server.ts` | MSW v2 |

- Lighthouse CI configured for performance budgets
- `bundlesize2` enforces JS chunk limits (180kB pages, 250kB app chunks)

### Untested Critical Flows

1. Google OAuth end-to-end
2. WebSocket/STOMP connections and message delivery
3. Weekly stats email scheduler
4. Cloudinary file upload integration
5. Notification WebSocket push delivery
6. Admin investigation endpoints (NID/document lookup)
7. Bucket4j rate limiting behavior
8. Token refresh error handling in UI

---

## 12. Recreation Plan

### Development Phases

#### Phase 1 — Infrastructure & Domain Foundation (Week 1–2)
**Goals:** Working local environment, database schema, domain model

**Deliverables:**
- Docker Compose (PostgreSQL 16 + Redis 7)
- Maven multi-module POM (parent → nirapod-core + nirapod-api)
- All 14 JPA entity classes with correct relationships
- All 10 Spring Data JPA repositories
- All 14 Flyway migrations V1–V14
- Admin seed with proper password mechanism (not placeholder)

**Validation:** `docker-compose up` → backend starts → Flyway runs all migrations → `/actuator/health` returns UP

---

#### Phase 2 — Security & Authentication (Week 2–3)
**Goals:** JWT auth, Google OAuth, OTP flow

**Deliverables:**
- `SecurityConfig` (CORS, BCrypt, stateless session, filter chain)
- `JwtService` (HS256 + Redis blacklist)
- `JwtAuthenticationFilter`
- `RateLimitFilter` (Bucket4j — use Redis backend, not in-process)
- `OtpService` (Redis TTL)
- `RefreshTokenService` (Redis token rotation)
- `EmailService` (Gmail SMTP)
- `GoogleAuthService`
- `AuthService` + `AuthController` + all auth DTOs

**Validation:** `AuthControllerIT` pass; `JwtServiceTest` pass; OTP email delivered; token refresh works

---

#### Phase 3 — Core Complaint System (Week 3–4)
**Goals:** Full complaint lifecycle with RBAC

**Deliverables:**
- `AuditService`
- `FileService` (Cloudinary + Tika)
- `ComplaintService` (CRUD, access control, OWASP sanitization, Redis cache)
- `ComplaintController` + `FileController` + all complaint DTOs

**Fix during this phase:** Batch photo inserts (`saveAll()`); extract `roleToCategory()` to shared utility

**Validation:** `ComplaintControllerIT` pass; authority cannot access wrong-category complaints; private complaints inaccessible to unauthorized

---

#### Phase 4 — Social & Real-time Features (Week 4–5)
**Goals:** Comments, follows, reports, WebSocket, notifications

**Deliverables:**
- `CommentService` + `CommentController` (with OWASP sanitization — fix from original)
- `FollowService` + `FollowController`
- `ReportService` + `ReportController`
- `NotificationService` + `NotificationWebSocketService`
- `WebSocketConfig` (STOMP + SockJS)
- `WebSocketChannelInterceptor`
- `ChatService` + `ChatController`
- `PresenceService`

**Validation:** STOMP connection with JWT succeeds; notification delivered on status change; chat broadcast

---

#### Phase 5 — Admin & Scheduled Jobs (Week 5–6)
**Goals:** Full admin capability, weekly reports

**Deliverables:**
- `AdminService` (parallelize stats queries with CompletableFuture)
- `AdminController` + all admin DTOs
- `UserService` + `UserController`
- `WeeklyStatsEmailService` (annotate `@Async`) + `weekly-stats.html` Thymeleaf template

**Validation:** `AdminControllerIT` pass; stats correct; weekly email renders HTML

---

#### Phase 6 — Frontend Foundation (Week 6–7)
**Goals:** Next.js with auth, routing, base layout

**Deliverables:**
- Next.js 16 scaffold (TypeScript strict, Tailwind v4)
- `auth.ts` (NextAuth Credentials + Google)
- `middleware.ts` (fix: `AUTHORITY_PATHS = ["/queue"]`)
- Root layout + providers
- Navbar + NavActions
- Login, Signup, Forgot Password pages
- Axios instance with interceptors
- Zod schemas + TypeScript types

**Validation:** Login/logout/signup works; protected routes redirect; token refresh automatic

---

#### Phase 7 — Frontend Core Features (Week 7–9)
**Goals:** Complaint feed, detail, create, tracker, profile

**Deliverables:**
- `useComplaints` hook
- `ComplaintFeed` + `ComplaintCard` + `ComplaintFilters`
- `ComplaintDetailView` (status history, photos, authority note)
- `CreateComplaintForm` (Leaflet map wrapped in `dynamic(..., {ssr: false})`, photo upload)
- `PhotoGallery`, `StatusBadge`, `TrackerForm`, `ProfileView`

**Validation:** Full complaint submit flow; filter works; track by ID; authority note visible

---

#### Phase 8 — Frontend Social & Real-time (Week 9–10)
**Goals:** Comments, follow, report, notifications, live chat

**Deliverables:**
- `CommentSection` + `FollowButton` + `ReportModal`
- `NotificationsView` + `useNotifications`
- `LiveChatView` + `useWebSocket` (with exponential backoff reconnect)
- `usePresence`
- Sonner toast integration

**Validation:** Status change notification delivered via WebSocket; chat broadcast; follow triggers notification

---

#### Phase 9 — Admin UI (Week 10–11)
**Goals:** All admin pages

**Deliverables:**
- Admin layout with navigation
- `AdminDashboardView` (stats cards + Recharts bar charts)
- `AdminUsersView` (table, approve/suspend, create authority)
- `AdminAnalyticsView` (date range + chart)
- `AdminAuditView`, `AdminInvestigateView`, `AdminReportsView`

---

#### Phase 10 — Authority Queue (Week 11)
**Goals:** Authority complaint management UI

**Deliverables:**
- `AuthorityQueueView` (filtered by role category)
- Status update + authority note UI
- Verification: POLICE sees only POLICE complaints; notification delivered on update

---

#### Phase 11 — Testing, Security, Polish (Week 12–13)
**Goals:** 80% coverage, security hardening, production polish

**Deliverables:**
- Backend integration tests for untested flows
- Frontend unit tests for all components
- Playwright E2E for auth, complaint, a11y
- MSW handlers for all endpoints
- Add rate limiting to complaint creation + file upload
- Sanitize comment content
- Fix admin seed password mechanism
- Remove `debug-session` API route
- Resolve dual toast library (`react-hot-toast` vs `sonner`)
- Bundle size validation passing

---

#### Phase 12 — Production Deployment (Week 13–14)
**Goals:** Production-ready deployment

**Deliverables:**
- Nginx reverse proxy config (TLS termination)
- Production `.env` with all secrets generated via `openssl rand -base64 32`
- Admin account properly seeded
- Redis persistence configured
- PostgreSQL backup strategy (scheduled pg_dump or managed DB)
- Sentry DSNs configured
- Health check smoke test

---

### Team Structure

| Role | Count | Responsibilities |
|------|-------|-----------------|
| Backend Lead | 1 | Architecture, security, Spring config, complex queries |
| Backend Developer | 1 | Services, controllers, tests |
| Frontend Lead | 1 | Next.js architecture, auth, WebSocket, state |
| Frontend Developer | 1 | UI components, pages, forms |
| DevOps/Fullstack | 1 | Docker, CI/CD, DB management |

**Minimum viable:** 2 fullstack developers, 16 weeks

### Required Skillsets
- Java 21, Spring Boot 3.x, Spring Security, JPA/Hibernate
- PostgreSQL, Flyway, Redis
- TypeScript, React 19, Next.js App Router, Auth.js v5
- TanStack Query, React Hook Form, Zod
- WebSocket/STOMP, Cloudinary API
- Docker, Docker Compose
- Vitest, Playwright, Testcontainers

---

## 13. Refactoring & Improvement Recommendations

### Critical

1. **Fix admin seed password** — Replace static placeholder hash in `V5__seed_admin.sql`. Options: (a) read `ADMIN_PASSWORD_HASH` env var in a separate initialization bean that runs post-Flyway, or (b) use a separate `V5_init_admin.sh` script run at deploy time.

2. **Distribute rate limiter** — Replace in-memory Bucket4j with Redis backend:
   ```java
   // Replace ConcurrentHashMap with:
   ProxyManager<String> proxyManager = Bucket4jRedis.casBasedBuilder(redisClient).build();
   ```

3. **Add rate limiting to complaint/comment/upload endpoints:**
   ```
   POST /api/v1/complaints:          10/hour per user
   POST /api/v1/files/upload:        20/hour per user
   POST /api/v1/complaints/*/comments: 30/hour per user
   ```

4. **Sanitize comment content** — Apply OWASP `HTML_POLICY.sanitize()` in `CommentService` same as `ComplaintService`

5. **Fix middleware authority path** — Change `AUTHORITY_PATHS = ["/authority"]` to `["/queue"]`

### Recommended

6. **Batch photo inserts** — Replace loop `photoRepository.save(photo)` with `photoRepository.saveAll(photos)` in `ComplaintService.create()`

7. **Parallelize admin stats** — Use `CompletableFuture.allOf()` in `AdminService.getStats()` for the 8+ queries

8. **Async weekly email** — Add `@Async` to `WeeklyStatsEmailService.sendWeeklyStats()`

9. **Extract `roleToCategory()`** — Duplicated in `ComplaintService` and `ComplaintController`; move to shared utility or enum method

10. **Support combined district+category filter** — `ComplaintService.getFeed()` currently treats filters as mutually exclusive

11. **Handle `session.error` in UI** — Detect `RefreshAccessTokenError` and force re-login

12. **Add NID format validation** — Enforce 10-digit numeric format at application layer, not just DB constraint

13. **Remove debug session endpoint** — Delete `app/api/debug-session/route.ts` before production

### Optional

14. **Full-text search** — Add `tsvector` index on `complaints(title, details)` for text search

15. **Complaint soft delete** — Archive rather than hard-delete to preserve history

16. **Multi-device session tracking** — Track refresh tokens per-device

17. **Pagination on analytics** — `AdminService.getAnalytics()` returns unbounded list

18. **RS256 JWT** — Migrate from HS256 for stateless distributed verification

19. **WebSocket auto-reconnect** — Implement exponential backoff in `useWebSocket`

20. **Resolve dual toast libraries** — Remove either `react-hot-toast` or `sonner` (not both)

---

## 14. Dead Code & Cleanup Report

| Location | Issue | Confidence | Action |
|----------|-------|------------|--------|
| `middleware.ts` — `AUTHORITY_PATHS = ["/authority"]` | No routes under `/authority`; privileged routes are under `/queue` | High | Fix to `["/queue"]` |
| `app/api/debug-session/route.ts` | Exposes session data; development tool not for production | High | Delete before deploy |
| `react-hot-toast` package | Both `react-hot-toast` and `sonner` listed; likely one unused | Medium | Audit and remove unused one |
| `@base-ui/react` package | Listed in dependencies but not found in any component during scan | Medium | Verify usage; remove if unused |

**No dead database structures found** — all 14 tables referenced by JPA entities and used in at least one service.

---

## 15. Risks, Unknowns & Missing Information

### Critical Risks

| Risk | Severity | Details |
|------|----------|---------|
| Admin seed placeholder hash | CRITICAL | `V5__seed_admin.sql` contains non-functional bcrypt placeholder; admin login broken until fixed |
| `next-auth@5.0.0-beta.31` | HIGH | Beta pre-release in production; breaking changes possible on updates |
| In-process rate limiter | HIGH | State lost on restart; ineffective with multiple instances |
| Comment XSS gap | MEDIUM | `comment.content` not sanitized; potential stored XSS if frontend rendering fails |

### Known Gaps

| Gap | Details |
|-----|---------|
| Thymeleaf `weekly-stats.html` template | `WeeklyStatsEmailService` references this template; file not found in scan — may be missing or in unenumerated directory |
| No reverse proxy config | Nginx/Traefik not present; TLS setup left to operator |
| No CI/CD pipeline file | `.github/workflows/*.yml` not confirmed present |
| No complaint rate limiting | Spam vector |
| OAuth user NID requirement unclear | Google OAuth users may bypass NID validation |

### Reverse-Engineering Assumptions (Medium Confidence)

- `render.yaml` exists but contents not read; assumed standard Render web service config
- Thymeleaf template may exist in subdirectory not fully enumerated
- Test assertion details not read; existence and class names confirmed only
- `nirapod-core` module contains only models/repositories (confirmed by file listing, not pom.xml dependency analysis)

### Migration Challenges

- **PostgreSQL JSONB** — `audit_log.details` requires JSONB extension; not portable to MySQL without schema change
- **`gen_random_uuid()`** — requires `pgcrypto` extension (created in V1); standard on Supabase/Neon/managed PostgreSQL
- **BIGSERIAL `tracking_id`** — sequential integer; would expose volume data; consider UUID for tracking ID in redesign
- **BRIN indexes** — PostgreSQL-specific; must be changed for other databases

---

## 16. Production Launch Checklist

Before any production deployment, complete ALL of the following:

- [ ] Replace `V5__seed_admin.sql` placeholder hash with real bcrypt hash of a strong password
- [ ] Generate `JWT_SECRET` with `openssl rand -base64 32`
- [ ] Generate `AUTH_SECRET` with `openssl rand -base64 32`
- [ ] Configure Gmail App Password for `MAIL_USERNAME`/`MAIL_PASSWORD`
- [ ] Create Cloudinary account and configure `CLOUDINARY_*` variables
- [ ] Create Thymeleaf `weekly-stats.html` template (or confirm it exists)
- [ ] Set up Nginx/reverse proxy with TLS certificates
- [ ] Configure PostgreSQL backup strategy (automated pg_dump schedule)
- [ ] Replace in-process Bucket4j with Redis-backed distributed rate limiter
- [ ] Fix middleware `AUTHORITY_PATHS = ["/queue"]`
- [ ] Delete `app/api/debug-session/route.ts`
- [ ] Add OWASP sanitization to `CommentService`
- [ ] Set `SPRING_PROFILES_ACTIVE=prod`
- [ ] Set `HIKARI_MAX_POOL_SIZE` appropriate to database tier
- [ ] Configure Sentry DSNs for error tracking
- [ ] Verify `next-auth` beta compatibility with production environment
- [ ] Run full integration test suite and confirm all pass
- [ ] Run Playwright E2E suite against staging environment

---

*Analysis performed: 2026-05-16*
*Scope: 100+ source files, 14 SQL migrations, all configuration files, all dependency manifests*
*Confidence: High for confirmed findings; Medium for inferred behaviors in unread template/CI files*
