#Aam Beji

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)
![tRPC](https://img.shields.io/badge/tRPC-11-2596be?style=flat-square)
![n8n](https://img.shields.io/badge/n8n-AI%20Workflow-ea4b71?style=flat-square&logo=n8n&logoColor=white)

A mobile-first behavioral intelligence platform for the Tunisian market. Users answer personalized micro-survey questions in Tunisian Arabic (Derja), earn points, and unlock rewards, while an AI-powered n8n workflow adapts future questions to each user's behavior profile in real time.
---

## Screenshots

<div style="display: flex; gap: 10px;">
  <img src="media/Capture d'écran 2026-05-02 070315.png" width="24%">
  <img src="media/Capture d'écran 2026-05-02 070124.png" width="24%">
  <img src="media/Capture d'écran 2026-05-02 070102.png" width="24%">
  <img src="media/Capture d'écran 2026-05-02 070230.png" width="24%">
</div>
---

**Key Features:**
- 🤖 **AI-Personalized Questions** — n8n workflow generates questions based on your level, skip rate, response time, and engagement score
- 🧠 **AI Performance Report** — LLM-powered async analysis of answer quality with strengths, improvements, and a behavioral score
- 🎮 **Gamification** — Points, trust score, levels, streak tracking
- 🎁 **Rewards Marketplace** — Redeem points for Jumia, Glovo, Netflix, Spotify vouchers
- 🎡 **Wheel of Fortune** — Spin-to-win prize mechanic
- 🔒 **Trust Score Engine** — 5-factor behavioral trust model (response time, skip rate, consistency, depth, continuity)

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Server Architecture](#server-architecture)
  - [Express + tRPC Server](#express--trpc-server)
  - [tRPC Router Map](#trpc-router-map)
  - [In-Memory Store](#in-memory-store)
  - [Scoring Service](#scoring-service)
  - [n8n Workflow Integration](#n8n-workflow-integration)
  - [AI Performance Report](#ai-performance-report)
  - [Database Schema (Drizzle ORM)](#database-schema-drizzle-orm)
- [Client Architecture](#client-architecture)
  - [App Shell & Routing](#app-shell--routing)
  - [Pages](#pages)
  - [Components](#components)
  - [State Management](#state-management)
  - [Localization](#localization)
- [Data Flow](#data-flow)
  - [Quiz Flow](#quiz-flow)
  - [AI-Suggested Questions Flow](#ai-suggested-questions-flow)
  - [Trust Score Calculation](#trust-score-calculation)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)



## System Architecture

```mermaid
graph TB
    subgraph Client["Client (React 19 + Vite)"]
        App["App Shell"]
        Pages["Pages"]
        TRPC_Client["tRPC Client"]
    end

    subgraph Server["Server (Express + tRPC)"]
        TRPC_Server["tRPC Router"]
        InMem["In-Memory Store"]
        Scoring["Scoring Service"]
        Mocks["Mock Data Layer"]
    end

    subgraph External["External Services"]
        N8N["n8n Workflow (AI)"]
        MySQL["MySQL Database"]
        OAuth["OAuth Server"]
    end

    App --> Pages
    Pages --> TRPC_Client
    TRPC_Client -->|"HTTP /api/trpc"| TRPC_Server
    TRPC_Server --> InMem
    TRPC_Server --> Scoring
    TRPC_Server --> Mocks
    TRPC_Server -->|"POST webhook"| N8N
    N8N -->|"suggested_questions"| TRPC_Server
    TRPC_Server -.->|"Optional"| MySQL
    TRPC_Server -.->|"Auth"| OAuth

    style Client fill:#1a1a2e,stroke:#ED1C24,color:#fff
    style Server fill:#16213e,stroke:#ED1C24,color:#fff
    style External fill:#0f3460,stroke:#ED1C24,color:#fff
```

The system is split into three layers:

- **Client** — React 19 SPA served by Vite. All API calls go through a tRPC client over `/api/trpc`. No direct DB access from the browser.
- **Server** — Single Express process that handles tRPC, OAuth, and static file serving. Manages all state through the in-memory store (demo) and fires async jobs (n8n snapshots, AI report generation) as fire-and-forget promises.
- **External** — n8n handles AI question personalization via webhook; OpenRouter provides the LLM for the performance report. MySQL is wired up via Drizzle but not active in the demo phase.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|--------|
| **Runtime** | Node.js 20 + TypeScript 5.9 | Server and type safety |
| **Frontend** | React 19, Vite 7, Wouter | UI, bundling, client-side routing |
| **Styling** | Tailwind CSS 4, Framer Motion | Utility styling, animations |
| **API Layer** | tRPC 11 + SuperJSON | End-to-end type-safe RPC with rich serialization |
| **Server State** | TanStack React Query | Caching, polling, mutations |
| **Backend** | Express 4 | HTTP server, middleware |
| **Database** | MySQL 2 via Drizzle ORM | Persistent storage (schema ready, in-memory for demo) |
| **AI Workflows** | n8n (webhook) | Personalized question generation |
| **AI Reports** | OpenRouter (`tencent/hy3-preview`) | Async answer quality analysis |
| **Auth** | OAuth + Jose JWT | Cookie-based sessions |

---

## Project Structure

```
Flayou3756/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── App.tsx            # App shell, routing, providers
│   │   ├── main.tsx           # Entry point, tRPC/QueryClient setup
│   │   ├── index.css          # Global styles + Tailwind
│   │   ├── pages/             # Page components (5 routes)
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # React contexts (Session, Theme)
│   │   ├── hooks/             # Custom hooks
│   │   ├── locales/           # Arabic (Derja) translations
│   │   └── lib/               # Utilities (tRPC client)
│   └── index.html             # HTML entry
├── server/
│   ├── _core/                 # Server infrastructure
│   │   ├── index.ts           # Express server bootstrap
│   │   ├── trpc.ts            # tRPC initialization + middleware
│   │   ├── context.ts         # Request context (auth)
│   │   ├── env.ts             # Environment variable map
│   │   ├── oauth.ts           # OAuth routes
│   │   ├── sdk.ts             # Auth SDK
│   │   └── vite.ts            # Vite dev server integration
│   ├── routers.ts             # All tRPC route handlers
│   ├── mocks.ts               # Mock questions, rewards, prizes
│   ├── inMemoryStore.ts       # In-memory session/data store
│   ├── db.ts                  # Database queries (Drizzle)
│   └── services/
│       ├── scoringService.ts  # Trust score + points calculation
│       └── answerAnalyzer.ts  # Async AI answer quality analysis (OpenRouter)
├── shared/                    # Shared types and constants
├── drizzle/                   # Database schema + migrations
│   ├── schema.ts              # Table definitions
│   └── *.sql                  # SQL migrations
├── .env                       # Environment variables
├── vite.config.ts             # Vite + Tailwind + plugins
├── drizzle.config.ts          # Drizzle CLI config
└── package.json               # Dependencies and scripts
```

---

## Server Architecture

### Express + tRPC Server

The server is a single Express process that serves both the API and the frontend.

```mermaid
graph LR
    subgraph Express["Express Server (:3000)"]
        BP["Body Parser (50MB)"]
        Storage["Storage Proxy"]
        OAuthR["OAuth Routes"]
        TRPC["/api/trpc → tRPC"]
        Vite["Vite Dev Server / Static Files"]
    end

    Request["HTTP Request"] --> BP
    BP --> Storage
    BP --> OAuthR
    BP --> TRPC
    BP --> Vite

    style Express fill:#16213e,stroke:#ED1C24,color:#fff
```

**Boot sequence** (`server/_core/index.ts`):
1. Load environment via `dotenv`
2. Create Express app with JSON body parsing (50MB limit)
3. Register storage proxy and OAuth routes
4. Mount tRPC middleware at `/api/trpc`
5. In development: attach Vite dev server with HMR. In production: serve static build
6. Find an available port starting from 3000 and start listening

**tRPC Context** (`server/_core/context.ts`):
Every request receives a context containing `{ req, res, user }`. The `user` is resolved from the session cookie via the auth SDK. Authentication is optional for `publicProcedure` routes.

**Procedure Types** (`server/_core/trpc.ts`):
- `publicProcedure` — No auth required (used for all game endpoints)
- `protectedProcedure` — Requires authenticated user
- `adminProcedure` — Requires admin role

---

### tRPC Router Map

All API endpoints are defined in `server/routers.ts` as a single `appRouter`:

```mermaid
graph TD
    Router["appRouter"]
    
    Router --> Auth["auth"]
    Auth --> AuthMe["me (query)"]
    Auth --> AuthLogout["logout (mutation)"]
    
    Router --> Session["session"]
    Session --> SessionCreate["create (mutation)"]
    Session --> SessionGet["get (query)"]
    
    Router --> Missions["missions"]
    Missions --> MissionsNext["getNext (query)"]
    Missions --> MissionsSuggested["getSuggested (mutation)"]
    Missions --> MissionsAll["getAll (query)"]
    
    Router --> Submit["submit"]
    Submit --> SubmitAnswer["answer (mutation)"]
    
    Router --> Analytics["analytics"]
    Analytics --> AnalyticsSnapshot["snapshot (query)"]
    Analytics --> AnalyticsReport["report (query) 🤖"]
    
    Router --> Behavior["behavior"]
    Behavior --> BehaviorTrack["trackEvent (mutation)"]
    
    Router --> Rewards["rewards"]
    Rewards --> RewardsAll["getAll (query)"]
    Rewards --> RewardsPurchase["purchase (mutation)"]
    Rewards --> RewardsHistory["getPurchaseHistory (query)"]
    
    Router --> Wheel["wheel"]
    Wheel --> WheelSpin["spin (mutation)"]
    Wheel --> WheelHistory["getHistory (query)"]

    style Router fill:#ED1C24,stroke:#fff,color:#fff
    style Missions fill:#2d3436,stroke:#ED1C24,color:#fff
    style Submit fill:#2d3436,stroke:#ED1C24,color:#fff
```

#### Key Endpoints

| Endpoint | Type | Description |
|----------|------|-------------|
| `session.create` | mutation | Creates a new in-memory session, returns `sessionId` |
| `missions.getNext` | query | Returns next unseen question (AI-suggested if cached, else n8n, else mock fallback) |
| `missions.getSuggested` | mutation | Fetches a batch of AI-suggested questions from the n8n workflow |
| `submit.answer` | mutation | Records answer, recalculates points + trust score, invalidates cache, fires n8n snapshot, triggers AI analysis |
| `analytics.snapshot` | query | Returns the full behavioral snapshot for a session |
| `analytics.report` | query | Returns the async AI performance report (status: none/pending/ready/error) |
| `rewards.purchase` | mutation | Deducts points and records a reward purchase |
| `wheel.spin` | mutation | Deducts spin cost, picks random prize, returns result with animation index |

---

### In-Memory Store

`server/inMemoryStore.ts` is a singleton class that replaces the database for the demo. All data lives in `Map` instances and is lost on server restart.

```mermaid
classDiagram
    class InMemoryStore {
        -sessions: Map~string, InMemorySession~
        -answers: Map~string, InMemoryAnswer[]~
        -behavioralMetrics: Map~string, InMemoryBehavioralMetrics~
        -purchases: Map~string, InMemoryPurchase[]~
        -wheelSpins: Map~string, InMemoryWheelSpin[]~
        -suggestedQuestions: Map~string, SuggestedQuestionsCache~
        +createSession(sessionId) InMemorySession
        +getSession(sessionId) InMemorySession | null
        +updateSession(sessionId, updates) InMemorySession | null
        +addAnswer(answer) void
        +getAnswers(sessionId) InMemoryAnswer[]
        +setSuggestedQuestions(sessionId, questions) void
        +getNextSuggestedQuestion(sessionId) SuggestedQuestion | null
        +hasSuggestedQuestions(sessionId) boolean
        +invalidateSuggestedQuestions(sessionId) void
        +addPurchase(purchase) void
        +addWheelSpin(spin) void
        +getSessionStats(sessionId) object
    }

    class InMemorySession {
        +sessionId: string
        +profileLevel: number
        +trustScore: number
        +points: number
        +streak: number
        +isActive: boolean
        +questionsAnswered: number
    }

    class SuggestedQuestion {
        +id: string
        +type: "swipe" | "rating" | "choice" | "open_ended"
        +text: string
        +options: array
        +difficulty: "easy" | "medium" | "hard"
        +pointsValue: number
        +topic: string
        +isAISuggested: boolean
    }

    InMemoryStore --> InMemorySession
    InMemoryStore --> SuggestedQuestion
```

**Suggested Questions Cache**: AI-suggested questions are cached per session with a cursor-based consumption pattern. The cache auto-expires after 5 minutes and is invalidated after each answer submission to ensure fresh suggestions.

---

### Scoring Service

`server/services/scoringService.ts` calculates trust scores and points using a multi-factor model:

```mermaid
graph LR
    subgraph Inputs["Behavioral Inputs"]
        RT["Avg Response Time"]
        SR["Skip Rate"]
        CR["Completion Rate"]
        QA["Questions Answered"]
        SC["Session Continuity"]
    end

    subgraph Factors["Trust Score Factors (0-20 each)"]
        PD["Profile Depth"]
        CO["Consistency"]
        EF["Effort"]
        BE["Behavior"]
        SCS["Session Continuity"]
    end

    subgraph Output["Output"]
        TS["Trust Score (0-100)"]
        TL["Trust Level"]
    end

    RT --> CO
    RT --> BE
    SR --> CO
    SR --> BE
    CR --> BE
    QA --> EF
    SC --> SCS

    PD --> TS
    CO --> TS
    EF --> TS
    BE --> TS
    SCS --> TS
    TS --> TL

    style Output fill:#ED1C24,stroke:#fff,color:#fff
```

| Factor | Weight | Evaluates |
|--------|--------|-----------|
| **Profile Depth** | 0–20 | Profile level + fields completed |
| **Consistency** | 0–20 | Response time deviation from ideal (3.5s), answer stability |
| **Effort** | 0–20 | Total questions answered + session time |
| **Behavior** | 0–20 | Low skip rate, high completion, no speed-clicking (<1s penalty) |
| **Session Continuity** | 0–20 | Session duration, no drop-offs |

**Points Calculation** (`calculatePointsEarned`):
- Base points per question (10)
- +10% bonus for thoughtful responses (2–5 seconds)
- -20% penalty for speed-clicking (<1 second)
- +15% bonus for high trust (≥70), -10% penalty for low trust (<30)
- +20% bonus for verified users

---

### n8n Workflow Integration

The platform integrates with an external n8n workflow that uses AI to generate personalized questions based on user behavior.

```mermaid
sequenceDiagram
    participant C as Client (QuizPage)
    participant S as tRPC Server
    participant Store as InMemoryStore
    participant N as n8n Webhook

    C->>S: missions.getSuggested({ sessionId })
    S->>Store: getSession(sessionId)
    Store-->>S: session data
    
    S->>S: buildWorkflowSnapshot()
    Note right of S: user_id, session_id, level,<br/>xp, completed_missions,<br/>recent_topics, skip_rate,<br/>avg_time_on_question_sec,<br/>engagement_score,<br/>preferred_difficulty

    S->>N: POST /webhook/{id} (snapshot JSON)
    N->>N: AI processes behavioral data
    N-->>S: { suggested_questions: [...], total: 5 }
    
    S->>S: parsePossibleAnswers() + convertN8nQuestion()
    S->>Store: setSuggestedQuestions(sessionId, questions)
    S-->>C: { questions: [...], source: "ai" }
    
    C->>C: Queue questions, serve one at a time
    
    Note over C,S: On answer submission:
    C->>S: submit.answer(...)
    S->>Store: invalidateSuggestedQuestions()
    S->>N: Fire-and-forget snapshot (async)
```

#### Workflow Snapshot Fields

| Field | Type | Derivation |
|-------|------|-----------|
| `user_id` | string | Auth openId or `guest:<sessionId>` |
| `session_id` | string | Session identifier |
| `level` | number | `floor(trustScore / 20)`, clamped 0–5 |
| `xp` | number | Accumulated points |
| `completed_missions` | string[] | `["quiz"]` after ≥10 answers |
| `recent_topics` | string[] | Last 5 answered question types |
| `skip_rate` | number | Skipped / total (0–1) |
| `avg_time_on_question_sec` | number | Mean response time in seconds |
| `engagement_score` | number | Clamped trust score (0–100) |
| `preferred_difficulty` | string | Most-answered difficulty level |

#### n8n Response Parsing

The n8n workflow returns questions as:
```json
{
  "question": "Arabic question text",
  "possible_answers": "1 (option A)، 2 (option B)، 3 (option C)",
  "topic": "Mobile Payment Usage",
  "difficulty": "easy",
  "xp_reward": 20
}
```

The server parses `possible_answers` (split by `،` or `,`) and auto-detects question type:
- **0–1 options** → `open_ended`
- **2 options** → `swipe` (binary choice)
- **3+ options** → `choice` (multiple choice)

**Fallback**: If the webhook is unavailable (timeout, error, invalid format), the server transparently falls back to local mock questions. Seen question IDs are tracked per session to prevent repetition.

---

### AI Performance Report

`server/services/answerAnalyzer.ts` runs **asynchronously** after every answer submission (triggered at 5+ answers). It calls the OpenRouter API (`tencent/hy3-preview:free`) with all session answers and behavioral stats, and stores the result back in the in-memory store.

```mermaid
sequenceDiagram
    participant S as tRPC Server
    participant A as answerAnalyzer
    participant OR as OpenRouter API
    participant Store as InMemoryStore

    S->>Store: setAIReport(sessionId, { status: "pending" })
    S->>A: triggerAnswerAnalysis() [fire-and-forget]
    
    A->>OR: POST /v1/chat/completions (tencent/hy3-preview:free)
    Note right of A: Sends all answers + behavioral stats
    OR-->>A: JSON report in Tunisian Arabic
    
    A->>A: Parse JSON: score, summary, strengths, improvements
    A->>Store: setAIReport(sessionId, { status: "ready", ... })
    
    Note over A,OR: If LLM fails → behavioral fallback
    A->>A: generateFallbackReport() from raw metrics
    A->>Store: setAIReport(sessionId, fallback)
```

**Report fields:**

| Field | Description |
|-------|-------------|
| `overallScore` | 0–100 performance score |
| `summary` | 2–3 sentence summary in Tunisian Arabic |
| `strengths` | List of positive behavioral traits |
| `improvements` | List of suggested improvements |
| `engagementLevel` | عالي / متوسط / منخفض |
| `answerDepth` | عميق / متوسط / سطحي |
| `consistencyRating` | ثابت / متقلب / غير كافي |

**Fallback behavior**: If OpenRouter returns an empty response or errors, `generateFallbackReport()` computes a score purely from behavioral metrics (avg response time, skip rate, open-ended answer length, trust score).

---

### Database Schema (Drizzle ORM)

The persistent database layer uses MySQL via Drizzle ORM. Currently the demo runs on the in-memory store, but the schema is ready for production.

```mermaid
erDiagram
    users {
        int id PK
        varchar openId UK
        text name
        varchar email
        varchar loginMethod
        enum role
        timestamp createdAt
        timestamp lastSignedIn
    }

    sessions {
        int id PK
        int userId FK
        varchar sessionId UK
        int profileLevel
        decimal trustScore
        int points
        int streak
        boolean isActive
        timestamp createdAt
    }

    behavioral_metrics {
        int id PK
        int sessionId FK
        decimal avgResponseTime
        decimal skipRate
        decimal completionRate
        int totalQuestionsAnswered
        int totalQuestionsSkipped
        int totalSessionTime
    }

    questions {
        int id PK
        varchar questionId UK
        enum type
        text questionText
        text questionTextAr
        text options
        enum difficulty
        int pointsValue
    }

    answers {
        int id PK
        int sessionId FK
        int questionId FK
        text answer
        int responseTime
        boolean wasSkipped
        int pointsEarned
        decimal trustImpact
    }

    rewards {
        int id PK
        varchar rewardId UK
        varchar name
        varchar nameAr
        int pointsCost
        enum category
        enum trustRequired
        boolean isActive
    }

    purchases {
        int id PK
        int sessionId FK
        int rewardId FK
        int pointsSpent
        enum status
    }

    wheel_spins {
        int id PK
        int sessionId FK
        int pointsSpent
        text prizeWon
        int spinResult
    }

    users ||--o{ sessions : "has"
    sessions ||--o{ answers : "contains"
    sessions ||--o| behavioral_metrics : "tracks"
    sessions ||--o{ purchases : "makes"
    sessions ||--o{ wheel_spins : "plays"
    questions ||--o{ answers : "receives"
    rewards ||--o{ purchases : "bought via"
```

---

## Client Architecture

### App Shell & Routing

```mermaid
graph TD
    Main["main.tsx"]
    Main -->|"Providers"| QC["QueryClientProvider"]
    QC --> TC["tRPC.Provider"]
    TC --> App["App.tsx"]
    
    App --> EB["ErrorBoundary"]
    EB --> TP["ThemeProvider"]
    TP --> TTP["TooltipProvider"]
    TTP --> Toaster["Sonner Toaster"]
    TTP --> Router["Wouter Router"]
    TTP --> Nav["Navigation (bottom bar)"]

    Router -->|"/"| Home["Home"]
    Router -->|"/quiz"| Quiz["QuizPage"]
    Router -->|"/marchi"| Marchi["ElMarchi"]
    Router -->|"/profile"| Profile["ProfilePage"]
    Router -->|"/roue"| Roue["RoueElHadh"]
    Router -->|"*"| NF["NotFound"]

    style Main fill:#ED1C24,stroke:#fff,color:#fff
    style Router fill:#2d3436,stroke:#ED1C24,color:#fff
```

All pages are wrapped in `AnimatedRoute` which applies Framer Motion page transitions (`opacity + y` slide animation with `AnimatePresence mode="wait"`).

**Navigation** is a fixed bottom bar with 4 items: البيت (Home), أسئلة (Quiz), السوق (Shop), حسابي (Profile). Active state is highlighted with the brand red `#ED1C24`.

---

### Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Home` | Editorial hero with brand typography, CTA to start quiz, links to wheel and shop, behavioral insight teaser |
| `/quiz` | `QuizPage` | Main quiz flow — fetches AI-suggested questions in batches, serves one at a time, shows reward + BejiAvatar animation, tracks progress (0/10). Shows 🤖 badge on AI-personalized questions |
| `/marchi` | `ElMarchi` | Rewards marketplace — grid of purchasable items (Jumia, Glovo, Ooredoo, Netflix, Spotify vouchers), purchase confirmation overlay |
| `/profile` | `ProfilePage` | User stats (live from server), trust score bar, activity metrics, **AI Performance Report card** (polls `analytics.report` every 5s, shows pending spinner → full report) |
| `/roue` | `RoueElHadh` | Wheel of Fortune — animated spinning wheel with 8 vibrant segments, spin history, cost/balance display |

---

### Components

```mermaid
graph TD
    subgraph UI["Core UI Components"]
        QC["QuestionCard"]
        WOF["WheelOfFortune"]
        Nav["Navigation"]
    end

    subgraph QTypes["Question Types (in QuestionCard)"]
        Swipe["Swipe (2 buttons)"]
        Rating["Rating (5 stars)"]
        Choice["Choice (N options)"]
        Open["Open-ended (textarea)"]
    end

    QC --> Swipe
    QC --> Rating
    QC --> Choice
    QC --> Open

    style QC fill:#ED1C24,stroke:#fff,color:#fff
    style WOF fill:#ED1C24,stroke:#fff,color:#fff
```

#### QuestionCard

The central interaction component. Renders differently based on `question.type`:

| Type | UI | Interaction |
|------|----|-------------|
| `swipe` | Two large tap buttons side by side | Tap either option |
| `rating` | 5 interactive stars with fill animation | Tap star → auto-submit |
| `choice` | Vertical list of selectable options | Tap to select → Submit button |
| `open_ended` | RTL textarea | Type answer → Submit button |

All types track `responseTime` from mount to submission. When `isAISuggested` is true, a 🤖 **"سؤال مخصص ليك"** badge appears in the header.

#### WheelOfFortune

Canvas-less CSS wheel using `conic-gradient` with 8 vibrant color segments. Features:
- Animated outer ring with 24 alternating red/white "lights" that pulse during spin
- Custom cubic-bezier spin easing for realistic deceleration
- Metallic center hub with glowing red dot
- Red pointer with clip-path
- Winner announcement with bounce animation

---

### State Management

```mermaid
graph TD
    subgraph Global["Global State"]
        SC["SessionContext"]
        TC["ThemeContext"]
    end

    subgraph PerPage["Page-Local State"]
        QS["QuizPage: questionQueue, points, trustScore"]
        MS["ElMarchi: userPoints, selectedReward"]
        PS["ProfilePage: profile data"]
        RS["RoueElHadh: userPoints, spinHistory"]
    end

    subgraph ServerState["Server State (via tRPC)"]
        RQ["React Query Cache"]
        Mutations["Mutation Results"]
    end

    SC --> QS
    SC --> MS
    RQ --> QS
    Mutations --> QS

    style Global fill:#2d3436,stroke:#ED1C24,color:#fff
    style ServerState fill:#16213e,stroke:#ED1C24,color:#fff
```

- **SessionContext**: Provides `sessionId`, `points`, `trustScore`, `profileLevel`, `streak` with update methods. Initializes by creating/restoring a server-side session.
- **ThemeContext**: Manages light/dark theme (defaults to light).
- **Server state** is managed by TanStack React Query through tRPC hooks — queries auto-cache and mutations invalidate relevant caches.
- **Page state** is local via `useState` — each page manages its own UI state (selected items, loading states, reward animations).

---

### Localization

All user-facing text is in Tunisian Arabic (Derja) via `client/src/locales/ar.ts`. The app is RTL-first.

| Namespace | Contents |
|-----------|----------|
| Common | Loading, skip, confirm, cancel |
| Home | Onboarding and hero copy |
| Quiz | Mission labels, progress, reward messages |
| Shop | El Marchi item labels, purchase flow |
| Wheel | Rouet el Hadh spin labels, prize names |
| Profile | Stats labels, trust levels, logout |
| Errors | API and validation messages |

RTL layout is enforced throughout via `dir="rtl"`, `text-right` alignment, and Arabic-first content ordering. The Cairo and Inter font families are loaded from Google Fonts for Arabic/Latin mixed rendering.

---

## Data Flow

### Quiz Flow

```mermaid
sequenceDiagram
    actor User
    participant QP as QuizPage
    participant API as tRPC Server
    participant Store as InMemoryStore
    participant Score as ScoringService

    User->>QP: Opens /quiz
    QP->>API: session.create()
    API->>Store: createSession()
    Store-->>API: { sessionId }
    API-->>QP: { sessionId }

    QP->>API: missions.getSuggested({ sessionId })
    API-->>QP: { questions: [...], source }
    QP->>QP: Set first question, queue rest

    User->>QP: Answers question
    QP->>API: submit.answer({ sessionId, questionId, answer, responseTime })
    API->>Score: calculatePointsEarned()
    API->>Store: addAnswer() + updateSession()
    API->>Score: calculateTrustScoreFromBehavior()
    API->>Store: invalidateSuggestedQuestions()
    API-->>QP: { pointsEarned, totalPoints, newTrustScore }
    QP->>QP: Show +points animation
    QP->>QP: Load next from queue

    Note over QP: After 10 questions:
    QP->>QP: Show "Mission Complete" screen
```

### AI-Suggested Questions Flow

```mermaid
flowchart TD
    A["Client calls missions.getSuggested"] --> B{"Cached questions available?"}
    B -->|Yes| C["Return next from cache"]
    B -->|No| D["Build WorkflowSnapshot"]
    D --> E["POST to n8n webhook"]
    E --> F{"Webhook responded OK?"}
    F -->|Yes| G["Parse suggested_questions"]
    G --> H["Convert to SuggestedQuestion format"]
    H --> I["Cache in InMemoryStore"]
    I --> J["Return questions with source='ai'"]
    F -->|No / Timeout / Error| K["Generate mock questions"]
    K --> L["Return questions with source='fallback'"]

    style A fill:#ED1C24,stroke:#fff,color:#fff
    style J fill:#2d3436,stroke:#4CD964,color:#fff
    style L fill:#2d3436,stroke:#FF9500,color:#fff
```

### Trust Score Calculation

```mermaid
flowchart LR
    subgraph Raw["Raw Behavioral Data"]
        A1["Response times per answer"]
        A2["Skip count / total"]
        A3["Completion count / total"]
        A4["Profile level"]
    end

    subgraph Derived["Derived Metrics"]
        B1["avgResponseTime"]
        B2["skipRate (0-1)"]
        B3["completionRate (0-1)"]
        B4["sessionContinuity"]
    end

    subgraph Scores["Factor Scores"]
        C1["profileDepth: 0-20"]
        C2["consistency: 0-20"]
        C3["effort: 0-20"]
        C4["behavior: 0-20"]
        C5["continuity: 0-20"]
    end

    subgraph Final["Final"]
        D1["trustScore: 0-100"]
        D2["trustLevel: low/medium/high"]
    end

    A1 --> B1
    A2 --> B2
    A3 --> B3
    A4 --> C1
    B1 --> C2
    B1 --> C4
    B2 --> C2
    B2 --> C4
    B3 --> C4
    B4 --> C5
    C1 --> D1
    C2 --> D1
    C3 --> D1
    C4 --> D1
    C5 --> D1
    D1 --> D2

    style Final fill:#ED1C24,stroke:#fff,color:#fff
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- An active [n8n](https://n8n.io) instance with the workflow configured and **activated**
- (Optional) An [OpenRouter](https://openrouter.ai) API key for the AI performance report

### Install & Run

```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy and fill in environment variables
copy .env.example .env
# Edit .env with your values

# Start development server (frontend + backend on :3000)
npm run dev
```

### n8n Setup

1. Import the workflow into your n8n instance
2. Set the **Webhook node** to accept **POST** requests
3. **Activate** the workflow (toggle in the top-right — test mode won't work)
4. Copy the production webhook URL into `N8N_WORKFLOW_URL` in `.env`
5. If using ngrok, ensure the tunnel is running and the URL hasn't changed

The workflow must return:
```json
{ "suggested_questions": [ { "question": "...", "possible_answers": "A، B، C", "difficulty": "easy", "topic": "...", "xp_reward": 15 } ] }
```

### Other Commands

```bash
# Type check (no emit)
npm run check

# Build for production (Vite + esbuild server bundle)
npm run build

# Start production server
npm run start

# Push Drizzle schema to MySQL (when DATABASE_URL is set)
npm run db:push
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `N8N_WORKFLOW_URL` | **Yes** | n8n production webhook URL for AI question generation |
| `OPENROUTER_API_KEY` | Recommended | OpenRouter API key for the AI performance report (`tencent/hy3-preview:free`) |
| `DATABASE_URL` | No | MySQL connection string (falls back to in-memory store) |
| `JWT_SECRET` | No | Secret for session cookie signing |
| `OAUTH_SERVER_URL` | No | OAuth provider URL |
| `OWNER_OPEN_ID` | No | OpenID of the admin user |
| `VITE_APP_ID` | No | Application ID for OAuth |

```env
# .env
N8N_WORKFLOW_URL=https://your-ngrok-or-n8n-url/webhook/<webhook-id>
OPENROUTER_API_KEY=sk-or-v1-your-key-here
DATABASE_URL=mysql://user:pass@host:3306/dbname
JWT_SECRET=your-secret
```

> **Note**: The n8n webhook must be set to **POST** and the workflow must be **Activated** (not just in test mode). Free ngrok URLs change on restart — update `N8N_WORKFLOW_URL` accordingly.

---

## Contributing

### Branch Strategy

- `main` — stable, production-ready
- Feature branches → PR to `main`
- Merge conflicts must be resolved manually (especially `QuizPage.tsx` and `routers.ts` which are frequently edited)

### Known Limitations (Demo Phase)

- **In-memory store**: all session data is lost on server restart — intended for demo/hackathon use
- **No-repeat questions**: tracked per session in memory; resets on restart
- **n8n timeout**: the app allows up to 120 seconds for the n8n workflow (which calls an AI model internally). If your workflow is slower, increase the timeout in `server/routers.ts`
- **AI report fallback**: if OpenRouter returns an empty response (rate limit, model issue), the app falls back to a behavioral heuristic report

### Roadmap

- [ ] Migrate from in-memory store to MySQL (Drizzle schema is ready)
- [ ] Add more question types (image-based, video clips)
- [ ] Improve AI report with multi-session history
- [ ] Add admin dashboard for question and reward management
- [ ] Leaderboard and social features
