# Yoluno AI

AI-powered educational platform for children with personalized learning experiences, interactive AI chat buddy, story generation, learning journeys, and family features — all with parental controls and safety monitoring.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite (SWC) |
| **Styling** | Tailwind CSS + shadcn/ui (Radix) + Framer Motion |
| **State** | TanStack React Query + React Context |
| **Backend** | Express.js + TypeScript (native ESM) |
| **Database** | PostgreSQL (raw SQL, no ORM) |
| **Auth** | JWT (access token + httpOnly refresh cookie) + Passport.js |
| **Real-time** | Socket.io |
| **AI** | Google Gemini 2.5 Flash (via OpenRouter), OpenAI (TTS/STT) |
| **Storage** | S3 (AWS SDK v3) |
| **Deployment** | Railway.app |

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL database

## Getting Started

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server && npm install
```

### 2. Environment Setup

**Frontend** — create `.env` in the root:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

**Backend** — copy `server/.env.example` to `server/.env.local`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/yoluno
JWT_SECRET=your-secure-random-string
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENAI_API_KEY=sk-proj-your-key
S3_ENDPOINT=https://your-s3-endpoint
S3_REGION=auto
S3_BUCKET=your-bucket
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5174
CORS_ORIGIN=http://localhost:5174
RESEND_API_KEY=your-resend-key
FROM_EMAIL=noreply@yourdomain.com
```

### 3. Run Database Migrations

```bash
cd server && npm run migrate
```

### 4. Start Development

```bash
# Terminal 1 — Backend (localhost:3000)
cd server && npm run dev

# Terminal 2 — Frontend (localhost:5174)
npm run dev
```

## Available Scripts

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server with hot reload (tsx) |
| `npm run build` | Compile TypeScript |
| `npm run start` | Start production server |
| `npm run migrate` | Run database migrations |

## Project Structure

```
yoluno/
├── src/                          # Frontend (React)
│   ├── pages/                    # Route pages
│   ├── components/
│   │   ├── ui/                   # Base UI (shadcn/ui)
│   │   ├── shared/               # Reusable components
│   │   ├── chat/                 # AI chat interface
│   │   ├── dashboard/            # Parent dashboard
│   │   ├── kids/                 # Kids mode components
│   │   └── landing/              # Landing site
│   ├── contexts/                 # Auth, Child, Chat contexts
│   ├── hooks/queries/            # TanStack Query hooks
│   ├── services/                 # API service layer
│   ├── integrations/api/         # Axios client, auth, socket
│   ├── types/                    # TypeScript definitions
│   └── lib/                      # Utilities
│
└── server/                       # Backend (Express)
    ├── src/
    │   ├── routes/               # API route handlers (~36 files)
    │   ├── config/               # Database pool, Passport
    │   ├── middleware/            # Auth, error handling, logging
    │   ├── helpers/              # Gamification logic
    │   ├── services/             # Email (Resend)
    │   ├── utils/                # JWT, S3, validation, password
    │   ├── socket/               # Socket.io handlers
    │   └── types/                # Backend type definitions
    └── migrations/               # Sequential SQL migrations
```

## Features

### Parent Dashboard
- Child profile management with PIN protection
- Story management and AI story generation
- Learning journey creation (templates or custom)
- Family tree with interactive canvas
- Mood tracking and analytics insights
- Safety monitoring and content moderation
- Voice vault for family recordings
- Topic management and content library
- Gamification overview (points, badges, streaks)

### Kids Mode
- AI chat buddy (Luno) with character world:
  - **Lala** — family storyteller, knows family members
  - **Lolo** — adventure guide, tracks journeys
  - **Lumi** — storyteller star, creates and recalls stories
  - **Luno** — the main chat buddy, creative and comforting
- Interactive story creation wizard
- Learning journeys with step-by-step progress
- Daily missions system
- Mood check-ins
- Family member profiles (kid-friendly view)
- Rewards gallery and badge collection

### Safety
- Real-time content safety detection (red/yellow/green flags)
- Parent-configurable guardrails (screen time, content filters)
- Safety reports with parent review
- Blocked topic management

## AI Models

| Feature | Model | Provider |
|---------|-------|----------|
| Buddy Chat | `google/gemini-2.5-flash` | OpenRouter |
| Story Generation | `google/gemini-2.5-flash` | OpenRouter |
| Story Illustrations | `google/gemini-2.5-flash` (vision) | OpenRouter |
| Text-to-Speech | `tts-1` | OpenAI |
| Speech-to-Text | `whisper-1` | OpenAI |

## Deployment

Deployed on Railway.app with:
- Frontend served via `npx serve dist`
- Backend with auto-migration on start: `npm run migrate && npm start`
- PostgreSQL managed by Railway
- Health checks on `/` (frontend) and `/api/auth/session` (backend)
