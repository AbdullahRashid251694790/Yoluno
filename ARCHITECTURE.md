# Yoluno — Architecture & Technical Documentation

A child-safe AI learning companion. Parents configure boundaries and monitor activity; children chat with an age-adaptive AI buddy, create illustrated stories, follow gentle daily routines, and explore their family history.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [High-Level Architecture](#high-level-architecture)
- [Frontend](#frontend)
- [Backend](#backend)
- [Database](#database)
- [AI Integration](#ai-integration)
- [Safety & Content Moderation](#safety--content-moderation)
- [Real-time & Background Work](#real-time--background-work)
- [Authentication & Sessions](#authentication--sessions)
- [File Storage](#file-storage)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Known Limitations](#known-limitations)

---

## Overview

Yoluno is deployed as two long-running services on Railway with a managed Postgres:

- **Frontend** — React + Vite SPA served via `serve` on port 8080
- **Backend** — Express + TypeScript API on port 3000
- **Database** — Railway-managed PostgreSQL
- **Object storage** — S3-compatible bucket (AWS S3 SDK v3)

Users are parents with multiple child profiles beneath them. Parents log in with email/password; kids enter via a profile picker (optionally PIN-gated per child). Kids mode is a separate route tree with no links back to the parent dashboard.

---

## Tech Stack

### Frontend

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 (SWC plugin) |
| Routing | React Router 6 |
| Server state | TanStack Query v5 |
| Client state | React Context (Auth, Child) |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix primitives) |
| Forms | React Hook Form + Zod |
| Real-time | Socket.io client |
| HTTP | Axios with interceptors (auto refresh) |

### Backend

| Layer | Choice |
|---|---|
| Runtime | Node 18+ (native ESM) |
| Framework | Express 4 |
| Language | TypeScript with `tsx` in dev, `tsc` build in prod |
| Database driver | `pg` pool (raw SQL, no ORM) |
| Auth | JWT access token + httpOnly refresh cookie, Passport.js strategies |
| Password hashing | bcryptjs (salt rounds = 12) |
| Real-time | Socket.io server |
| File uploads | Multer in-memory, uploaded to S3 via AWS SDK v3 |
| Email | Resend |
| Validation | Zod |

### External services

| Service | Use |
|---|---|
| OpenRouter | Gateway to Google Gemini models (chat, story text, illustrations, audio transcription, family voice extraction) |
| OpenAI | `tts-1` for story narration |
| Resend | Transactional email (verification, password reset, weekly digest) |
| AWS S3 (or compatible) | Images, voice clips, story illustrations |
| Railway | Hosting, Postgres, cron (in-process) |

---

## High-Level Architecture

```
                ┌──────────────────────────────────────────┐
                │                Frontend                  │
                │  React + Vite (Railway, port 8080)       │
                └──────┬───────────────────────┬───────────┘
              REST API│                       │Socket.io
                      ▼                       ▼
                ┌──────────────────────────────────────────┐
                │                Backend                   │
                │  Express + Node (Railway, port 3000)     │
                │                                          │
                │  • Routes: ~30 files under src/routes/   │
                │  • Middleware: auth, error handler, rate │
                │  • Crons (in-process setInterval)        │
                │  • Socket.io server                      │
                └──┬───────────┬───────────┬──────────┬────┘
                   │           │           │          │
                   ▼           ▼           ▼          ▼
              ┌────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
              │Postgres│ │   S3    │ │OpenRouter│ │ Resend  │
              │Railway │ │         │ │ + OpenAI │ │         │
              └────────┘ └─────────┘ └─────────┘ └─────────┘
```

---

## Frontend

### Directory structure

```
src/
├── pages/                    Route pages
│   ├── Landing.tsx           Public home
│   ├── landing/              Marketing pages (Features, Pricing, etc.)
│   ├── Login.tsx, Signup.tsx, ForgotPassword.tsx, ResetPassword.tsx, VerifyEmail.tsx
│   ├── ChildSelect.tsx       /play — profile picker
│   ├── Dashboard.tsx         Parent shell (sidebar + Routes)
│   ├── dashboardPages/       Children, Family, Stories, Journeys, Insights,
│   │                         Topics, ContentLibrary, VoiceVault, Settings
│   ├── SafetyDashboard.tsx   Parent safety views (lives under /dashboard/safety)
│   ├── KidsHome.tsx, KidsChat.tsx, KidsStories.tsx, KidsJourneys.tsx,
│   │   KidsJourneyDetail.tsx, KidsFamily.tsx, KidsMoments.tsx, KidsMoodCheck.tsx
│   └── StoryWizard.tsx       Parent-side story creator
│
├── components/
│   ├── ui/                   shadcn primitives
│   ├── shared/               Cross-cutting (LoadingState, ErrorState, ...)
│   ├── chat/                 ChatAvatar, ChatSessionList, JourneyTasksPanel
│   ├── dashboard/            children/ family/ journeys/ insights/ safety/ ...
│   ├── kids/                 auth/ celebrations/ family/ story/
│   ├── storybook/            StorybookReader, StorybookPage, audio controls
│   └── landing/              Navbar, footer, hero sections
│
├── contexts/                 AuthContext, ChildContext
├── hooks/                    useIsMobile, useConfetti, useAudioRecorder
│   └── queries/              TanStack Query hooks (one file per domain)
├── services/                 Typed API clients wrapping apiClient
├── integrations/api/         Axios client, Socket.io client
├── types/                    Domain + database + form types
└── lib/                      Utilities, error handler, format helpers
```

### Routing model

- `ProtectedRoute` wraps routes that require parent auth.
- `PublicRoute` wraps login/signup — redirects authed users to `/dashboard`.
- Kids mode lives under `/kids/:childId/*` and never links back to `/dashboard/*` (isolation by convention; see [Known Limitations](#known-limitations)).

### State management

- **Auth state** (AuthContext): access token in memory, refresh cookie httpOnly. Axios interceptor auto-refreshes on 401.
- **Active child** (ChildContext): persisted to localStorage so profile persists across tabs.
- **Server state**: TanStack Query for everything hitting the API. `queryKeys` factory per domain in `src/hooks/queries/keys.ts`.

---

## Backend

### Directory structure

```
server/src/
├── index.ts                  Entry: Express setup, CORS, routes, crons
├── config/
│   ├── database.ts           pg pool
│   └── passport.ts           JWT + local strategies
├── middleware/
│   ├── auth.ts               requireAuth
│   ├── errorHandler.ts       central error shape
│   └── rateLimiter.ts        express-rate-limit wrappers
├── routes/                   ~30 route files (one per domain)
│   ├── auth.ts               /api/auth/*
│   ├── childProfiles.ts      /api/child-profiles/*
│   ├── buddyChat.ts          /api/buddy-chat/* (largest — chat, safety, banned topics)
│   ├── storyGeneration.ts    /api/generate-story/* (text + illustrations)
│   ├── stories.ts            /api/stories/*
│   ├── journeys.ts           /api/journeys/*
│   ├── family.ts             /api/family/*
│   ├── sharedMoments.ts      /api/shared-moments/*
│   ├── safetySettings.ts     /api/safety-settings
│   ├── notifications.ts      Parent notifications
│   ├── kidNotifications.ts   Kid-side bell
│   ├── topics.ts             Parent topic management (incl. AI topic generation)
│   ├── analytics.ts          Parent insights
│   ├── tts.ts                /api/tts (OpenAI)
│   ├── transcribe.ts         /api/transcribe (Gemini audio)
│   ├── upload.ts             /api/upload/:bucket (S3)
│   ├── dataExport.ts         Granular data export + account deletion
│   ├── weeklyReport.ts       Manual-trigger digest endpoint
│   └── ...
├── helpers/                  gamification, misc
├── services/                 email.ts (Resend wrapper)
├── socket/                   Socket.io handlers (join rooms, emit helpers)
├── utils/                    jwt, storage (S3), validation, password
└── types/                    Backend types mirroring DB
```

### Middleware order

1. `cors` — credentials: true, origin from `CORS_ORIGIN` env
2. `helmet` — standard security headers
3. `cookieParser` — for httpOnly refresh cookie
4. `express.json({ limit: '10mb' })`
5. Rate limiters on auth + reset endpoints (see [Known Limitations](#known-limitations) for gaps on other routes)
6. Route handlers
7. Central `errorHandler` — converts `AppError` to structured JSON response, hides stack in production

---

## Database

Schema is defined by **sequential SQL migrations** in `server/migrations/NNN_*.sql`. No ORM, no migration tool — migrations run via a simple script (`npm run migrate`) that executes files in filename order inside a transaction.

### Core tables

| Table | Purpose |
|---|---|
| `users` | Parent accounts (email, password_hash, email_verified) |
| `sessions` | Active refresh tokens (hashed) for revocation |
| `child_profiles` | One row per child: name, age, gender, avatar, interests, session_time_limit_minutes, pin_hash |
| `family_members` | Relatives (name, relationship, photos, voice messages, fun facts) |
| `chat_sessions` | Per-child chat threads (title auto-generated from first message) |
| `buddy_messages` | Individual chat messages, linked to session and child |
| `chat_buddies` | Per-child buddy record (name, personality_traits JSON, use_custom_personality) |
| `safety_reports` | Flagged conversations (severity yellow/red, issue_summary, full_context) |
| `topics` / `child_topic_settings` | Built-in topic library + per-child allow/block |
| `journey_templates` / `journey_template_steps` | Canonical daily routines (Morning, Bedtime, etc.) and custom |
| `journeys` / `journey_steps` | Per-child journey instances, track completion |
| `stories` / `story_pages` | Generated stories with per-page illustrations and status |
| `story_reading_progress` | Per-child reading position for each story |
| `shared_moments` | Kid-authored and auto-generated moments; shown on parent dashboard |
| `parent_notifications` / `kid_notifications` | Bell streams |
| `mood_checkins` | Daily mood logs per child |
| `user_safety_settings` | Notification toggles + auto-delete policy |
| `voice_clips` | Family-recorded voice clips referenced by family members |
| `child_stats` | Per-child aggregate (total_points, total_stories, ...) |
| `badges_earned` / `badge_definitions` | Gamification badges |
| `activity_types` / `child_activities` | Point-awarding activity log |

### Notes on schema quirks

- `journeys.template_id` is `text` while `journey_templates.id` is `uuid`. All JOINs between them explicitly cast (see `routes/journeys.ts`, `routes/childProfiles.ts`, `index.ts` cron). Historic migration choice we haven't retrofitted.
- `shared_moments.reference_id` is a polymorphic `uuid` (points at session / story / journey / family_member depending on `moment_type`). Migration 068 installs per-table triggers to clean up orphan moments on cascade.
- Most user-facing tables cascade-delete on `users.id` / `child_profiles.id` for account deletion to work cleanly.

---

## AI Integration

All AI traffic except TTS goes through **OpenRouter**, which gives uniform billing + model swapping without per-provider SDKs.

### Models currently used

| Purpose | Model | Location |
|---|---|---|
| Chat reply | `google/gemini-2.5-flash` | `routes/buddyChat.ts:1375` |
| Chat greeting | `google/gemini-2.5-flash` | `routes/buddyChat.ts:832` |
| Chat session title | `google/gemini-2.5-flash` | `routes/buddyChat.ts:913` |
| Topic-redirect reply | `google/gemini-2.5-flash` | `routes/buddyChat.ts:2099` |
| Image analysis in chat | `google/gemini-2.5-flash` (vision) | `routes/buddyChat.ts:966` |
| Story text | `google/gemini-2.5-flash` | `routes/storyGeneration.ts:432` |
| Story illustration | `google/gemini-3.1-flash-image-preview` | `routes/storyGeneration.ts:536` |
| Audio transcription | `google/gemini-2.5-flash` (audio input) | `routes/transcribe.ts:32` |
| Voice→family-member extract | `google/gemini-2.0-flash-001` | `routes/family.ts:320` |
| AI-generated topic content | `google/gemini-2.5-flash` | `routes/topics.ts:784` |
| Story narration (TTS) | `tts-1` (OpenAI direct) | `routes/tts.ts:27` |

Every AI fetch has `AbortSignal.timeout()` applied (15–90s depending on call type) so upstream hangs can't block the Express worker indefinitely.

### Chat flow (simplified)

1. Kid sends a message to `POST /api/buddy-chat/:childId/sessions/:sessionId/send`
2. Backend runs **safety analysis** on the input (see below)
3. If the message references a banned topic, backend picks a redirect reply and returns early
4. Otherwise, the full system prompt is assembled:
   - Base persona + `personality_traits` sliders (Curious / Patient / Playful / Educational / Empathetic)
   - Age-appropriate tone block (different vocab for 3–6, 7–9, 10–14)
   - Recent conversation history
   - Child's family context (from `family_members`)
   - Current journey hints if applicable
5. Gemini returns a response, which is saved as a `buddy_messages` row
6. Backend emits a Socket.io event to the parent for the safety dashboard
7. Session title auto-generates in the background after the first message

### Story generation flow

1. `POST /api/generate-story` returns the story text synchronously (single Gemini call, up to 4000 tokens)
2. The story row is saved with `has_pages = true`; pages are seeded with `illustration_status = 'pending'`
3. `generateAllIllustrations()` fires as a background task:
   - Generate cover with lavender-purple palette emphasis
   - 3s delay, then each page sequentially
   - Per-page: up to 3 attempts; on failure, status flips to `'failed'`
4. Frontend polls `GET /api/generate-story/:storyId/pages` every 4 s while pages are in progress
5. When all pages complete, a kid bell notification fires

---

## Safety & Content Moderation

Three layers, in order:

### Layer 1 — Exact-substring banned topic check

`buddyChat.ts:1920-1940` — runs a SQL `ILIKE '%' || topic_name || '%'` against the child's disabled topics. Catches "I want to talk about guns" if the parent has blocked "guns".

### Layer 2 — Keyword expansion

Each topic can have `search_keywords` (array). Same query extends to `unnest(t.search_keywords)`. Adds coverage for colloquial/child terms without requiring the parent to list every variant.

### Layer 3 — Fuzzy match with typo tolerance

`buddyChat.ts:2015-2067` — for misspelled banned topics ("dinasours", "violance"). Defense:

- Stop-word blocklist (~90 common words) so "can you teach me" doesn't fuzzy-match "cats"
- Length-similarity guard (words must be within 2 characters)
- Prefix match (first 2–3 characters must agree)
- Levenshtein distance ≤ 1 for short words, ≤ 2 for longer ones

### Severity levels

- **Green** — Safe, nothing flagged. Default.
- **Yellow** — Topic redirect happened. Shown in the parent dashboard's "Redirections" section.
- **Red** — Sensitive content detected (self-harm language, distress signals, etc.). Creates a `safety_reports` row, emits a socket event, optionally creates a parent bell notification.

### Parent-controlled guardrails (`user_safety_settings`)

- `notify_on_redirect` — dashboard bell on yellow events
- `notify_on_report` — dashboard bell on red events
- `weekly_summary` — include in the Monday 8 AM UTC digest email
- `notify_on_journey` / `notify_on_story` — bells on kid actions
- `auto_delete_days` — cron wipes old conversations after N days

---

## Real-time & Background Work

### Socket.io

Each child has a room. Parents subscribe to their children's rooms on login and receive events:

- `new-message` — kid just sent a chat message
- `safety-alert` — a yellow or red event just fired
- `kid-notification` — kid-side bell update

### In-process crons

Yoluno runs four recurring jobs in the server process via `setInterval`:

| Job | Cadence | Purpose |
|---|---|---|
| Weekly report email | hourly check, fires Monday 8 AM UTC | Resend digest to all users with `weekly_summary = true` |
| Auto-delete | hourly check, fires daily 3 AM UTC | Delete conversations older than each user's `auto_delete_days` setting |
| Daily journey reset | hourly check, fires 12:05 AM UTC | Flip stale completed auto-assign journeys back to `active` |
| (Fast-path lazy reset) | on child / journey list fetch | Same reset targeted to the one child, for instant recovery after UTC midnight |

### Database triggers (migration 068)

Four triggers keep `shared_moments` clean when referenced entities get deleted:

- `chat_sessions DELETE` → remove `curiosity` / `mood_checkin` / `deep_chat` moments
- `stories DELETE` → remove `story_created` / `story_read` moments
- `journeys DELETE` → remove `journey_complete` moments
- `family_members DELETE` → remove `family_listen` moments

---

## Authentication & Sessions

- **Access token** — JWT, 1 h expiry, sent as `Authorization: Bearer <jwt>`
- **Refresh token** — random UUID, 30 d expiry, httpOnly + Secure + SameSite=Lax cookie, bcrypt-hashed in `sessions` table
- On each `/api/auth/refresh`, a new refresh token rotates in; old session row is updated
- Password reset + email verification use separate random UUIDs with shorter expiries
- Socket.io handshake uses the access token for room authorization

---

## File Storage

All uploads route through `POST /api/upload/:bucket` with Multer's memory storage. The handler validates MIME type against an allowlist and pushes to S3 via `PutObjectCommand`. Backend stores only the S3 key; frontend fetches signed URLs via `getUploadUrl()` helper.

Buckets in use:

- `avatars` — child profile avatars
- `story-illustrations` — AI-generated story images
- `family-photos` — uploaded family member photos
- `voice-clips` — recorded family voice messages

5 MB size cap on most endpoints; 50 MB on voice recordings.

---

## Deployment

Railway hosts three services sharing one private network:

1. **`yoluno-frontend`** — runs `npm run build` then `npx serve dist -p 8080`
2. **`yoluno-server`** — runs `npm run migrate && npm start`
3. **`yoluno-postgres`** — Railway-managed Postgres

The server runs `migrate.ts` on every boot, which applies any unrun migrations in filename order inside a single transaction. Failing migrations roll back cleanly without corrupting state.

Health checks: frontend GET `/`, backend GET `/api/auth/session`.

---

## Environment Variables

### Backend (`server/.env`)

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Access token signing key (required, no safe default) |
| `FRONTEND_URL` | For CORS + email links |
| `CORS_ORIGIN` | Allowed origin for CORS |
| `OPENROUTER_API_KEY` | Gateway for all Gemini calls |
| `OPENAI_API_KEY` | TTS narration |
| `RESEND_API_KEY` | Email delivery |
| `FROM_EMAIL` | Default sender |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Object storage |
| `CRON_SECRET` | Guard for manual cron-triggered endpoints |
| `PORT` | Defaults to 3000 |

### Frontend (`.env`)

| Var | Purpose |
|---|---|
| `VITE_API_URL` | e.g. `http://localhost:3000/api` |
| `VITE_SOCKET_URL` | e.g. `http://localhost:3000` |

---

## Known Limitations

- **Kids-mode isolation is convention, not enforcement.** A kid who types `/dashboard` in the URL reaches the parent dashboard. A parent-PIN gate is planned but not built.
- **No rate limiting on chat / story / TTS endpoints.** `express-rate-limit` is applied only to auth routes. A bot could burn OpenRouter credits.
- **In-process crons are single-node.** If you scale to multiple backend instances, crons will fire N times. Needs a distributed lock table before horizontal scale.
- **`journeys.template_id` is text, not uuid.** Every JOIN requires explicit casting. Worth a migration, never done.
- **File upload + DB insert is not atomic.** S3 can succeed and DB write fail, leaving orphan files. No cleanup job yet.
- **No structured logging.** Everything is `console.log/error`. Railway logs are searchable but not indexed by user / request.
