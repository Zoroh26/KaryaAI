
<img width="1000" height="313" alt="Banner" src="https://github.com/user-attachments/assets/5bebf049-3e50-470d-ae2c-9e65f49aebc5" /><br>

[![Node.js](https://img.shields.io/badge/Node.js-20.0%2B-brightgreen?style=for-the-badge&logo=nodejs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9%2B-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21%2B-lightgrey?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-13.4%2B-orange?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-3_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4%2B-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1%2B-06B6D4.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow?style=for-the-badge)](LICENSE)

**KaryaAI** is an intelligent project and task management platform that leverages **Google Gemini AI** for automated workflow generation, dependency-aware sprint planning, and smart task assignment. Built with a Node.js/TypeScript backend and a React + Vite frontend.

---

## Table of Contents

- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Data Models](#data-models)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [API Reference](#api-reference)
- [AI Capabilities](#ai-capabilities)
- [Role-Based Access Control](#role-based-access-control)
- [Sprint Planning Engine](#sprint-planning-engine)
- [Task Assignment Algorithm](#task-assignment-algorithm)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Roadmap](#roadmap)

---

## Key Features

### **AI-Powered Intelligence (Google Gemini 3 Flash)**
- **Automated Workflow Generation** — Convert a plain-language project description into a fully structured, multi-phase workflow with tasks, skills, hour estimates, and dependency chains
- **Intelligent Task Assignment** — Multi-factor scoring algorithm (skill match · workload · priority · experience) to assign tasks to the best-available employee
- **Project Complexity Analysis** — AI-driven analysis returning complexity rating, duration estimate, team-size recommendation, risk factors, and key technologies
- **Actionable Recommendations** — Per-product AI suggestions surfacing unassigned tasks, workflow gaps, and planning actions

### **Agile Sprint Planning Engine**
- **Dependency-Aware Scheduling** — Kahn's topological sort ensures dependent tasks are placed in later sprints than their prerequisites
- **Capacity-Bound Allocation** — Each employee is capped at **16 story points per sprint** (configurable); tasks spill automatically to the next sprint when capacity is reached
- **Fibonacci Story Points** — Hours are converted to story points (1/2/3/5/8/13 scale) for industry-standard estimation
- **Sprint Lifecycle Management** — `planning → active → completed` transitions with admin-gated status changes
- **Sprint Replanning** — Incomplete tasks roll forward to a newly created sprint with computed dates (skipping weekends)

### **Enterprise-Grade Security**
- **Firebase ID Token Verification** — All protected routes verify Firebase ID tokens via the Admin SDK
- **Dual Token Acceptance** — Tokens can be delivered as httpOnly cookies (`auth_token`) or `Authorization: Bearer` headers
- **Role-Based Access Control** — Three roles (`admin`, `client`, `employee`) with route-level middleware enforcement
- **Rate Limiting** — 100 req/15 min on all `/api/*` routes; 10 req/min on AI generation endpoints (Gemini is expensive)
- **Zod Schema Validation** — Every request body is validated against a typed Zod schema before reaching business logic

### **Comprehensive Resource Management**
- **Products** — Full lifecycle from client submission (`pending_review`) through admin approval to delivery (`completed`)
- **Workflows** — AI-generated or manually created; status progresses `generated → pending_approval → approved → in_progress → completed`
- **Tasks (flat + embedded)** — Embedded in workflow phases for display; mirrored to a flat `tasks` Firestore collection on workflow approval for assignment and sprint planning
- **Users** — Soft-delete, restore, skill management, and availability toggling

---

## Architecture Overview

```
KaryaAI/
├── backend/                   # Node.js + Express API Server (port 3000)
│   ├── src/
│   │   ├── server.ts          # Process entry point — starts HTTP server
│   │   ├── app.ts             # Express app, CORS, rate-limiting, route mounting
│   │   ├── config/
│   │   │   ├── firebase.ts    # Firebase Admin SDK initialization
│   │   │   └── gemini.ts      # Google GenAI client (Gemini 3 Flash)
│   │   ├── controllers/       # Request/response handlers (thin layer)
│   │   │   ├── authController.ts
│   │   │   ├── aiController.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── workflow.controller.ts
│   │   │   ├── taskController.ts
│   │   │   ├── sprint.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── services/          # Business logic & AI integration
│   │   │   ├── workflow.service.ts      # Gemini calls, workflow CRUD, task seeding
│   │   │   ├── sprint.service.ts        # Sprint planning & lifecycle
│   │   │   ├── taskAssignmentService.ts # Scoring & task-to-employee matching
│   │   │   ├── auth.service.ts
│   │   │   ├── products.services.ts
│   │   │   ├── user.service.ts
│   │   │   └── firebaseService.ts       # Shared Firestore helpers
│   │   ├── middlewares/
│   │   │   ├── auth.ts        # Firebase token verification + role guards
│   │   │   ├── validation.ts  # Zod body validator middleware
│   │   │   └── errorHandler.ts
│   │   ├── models/            # TypeScript interfaces (domain types)
│   │   │   ├── user.models.ts
│   │   │   ├── products.model.ts
│   │   │   ├── workflow.model.ts
│   │   │   └── sprint.model.ts
│   │   ├── types/
│   │   │   └── schema.ts      # Zod schemas + inferred TS types
│   │   ├── routes/            # Express Router definitions
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── products.routes.ts
│   │   │   ├── workflows.routes.ts
│   │   │   ├── tasks.ts
│   │   │   ├── sprints.routes.ts
│   │   │   └── ai.ts
│   │   ├── utils/
│   │   │   ├── constants.ts   # Enums, limits, collection names
│   │   │   ├── helpers.ts
│   │   │   ├── storyPoints.ts # Hours → Fibonacci story-points conversion
│   │   │   └── validators.ts
│   │   └── __tests__/
│   │       └── workflow.test.ts
│   ├── scripts/
│   │   └── create-admin.ts    # One-shot script to bootstrap an admin user
│   ├── quick-tests.ps1        # PowerShell end-to-end API tests
│   └── jest.config.ts
│
├── frontend/                  # React 18 + Vite 5 SPA (port 5173)
│   ├── src/
│   │   ├── components/        # shadcn/ui + custom components
│   │   ├── pages/             # Route-level views
│   │   ├── hooks/             # Custom React hooks (TanStack Query)
│   │   └── utils/
│   └── vite.config.ts
└── README.md
```

### Request Flow

```
Client Request
    │
    ▼
Express app.ts (CORS + Rate Limiter + Body Parser + Cookie Parser)
    │
    ▼
Route Module (e.g. /api/ai/assign-tasks)
    │
    ▼
Middleware: authenticateToken → requireRole(['admin'])
    │
    ▼
Middleware: validateBody(zodSchema)
    │
    ▼
Controller (thin handler — calls service, returns JSON)
    │
    ▼
Service (business logic + Firestore + Gemini calls)
    │
    ▼
Firebase Firestore / Google Gemini AI
```

---

## Tech Stack

### **Backend**
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20+ | JavaScript runtime |
| Express.js | 4.21+ | HTTP framework |
| TypeScript | 5.9+ | Type safety, strict mode |
| Firebase Admin SDK | 13.4+ | Firestore + Auth token verification |
| `@google/genai` | 1.50+ | Gemini 3 Flash (workflow generation, analysis) |
| Zod | 4.0+ | Request body validation & type inference |
| express-rate-limit | 8.0+ | API + AI endpoint throttling |
| cookie-parser | 1.4+ | httpOnly cookie token support |
| nodemon + ts-node | — | Development hot-reload |
| Jest + Supertest | 30+ | Unit & integration testing |

### **Frontend**
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3+ | UI library |
| Vite | 5.4+ | Build tool (SWC plugin) |
| TypeScript | 5.8+ | Type safety |
| Tailwind CSS | 4.1+ | Utility-first styling |
| TanStack Query | 5.83+ | Server state & caching |
| React Router DOM | 6.30+ | Client-side routing |
| React Hook Form + Zod | — | Form handling & validation |
| Recharts | 2.15+ | Data visualization |
| Radix UI / shadcn/ui | — | Accessible component primitives |
| Motion (Framer) | 12+ | Animations |

### **Infrastructure**
| Technology | Purpose |
|---|---|
| Firebase Firestore | Primary NoSQL database |
| Firebase Auth | Identity & token management |
| Docker | Containerized production deployment |

---

## Data Models

### User
```typescript
{
  uid: string;
  email: string;
  full_name: string;
  role: 'client' | 'admin' | 'employee';
  skillset?: string[];        // employee only
  isAvailable?: boolean;      // employee only — toggled when at 3 active tasks
  sprintCapacityPoints?: number; // default: 16 pts/sprint
  isActive?: boolean;
  isDeleted?: boolean;        // soft delete
}
```

### Product
```typescript
{
  id: string;
  clientId: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending_review' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  estimatedBudget?: number;
  deadline?: Date;
  targetAudience?: string;
  platformType?: string;
  techPreferences?: string;
  keyFeatures?: string;
}
```

### Workflow
```typescript
{
  id: string;
  productId: string;
  clientId: string;
  status: 'draft' | 'generated' | 'pending_approval' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  complexity: 'Low' | 'Medium' | 'High';
  estimatedHours: number;
  estimatedDuration: string;   // e.g. "3 weeks"
  generatedBy: 'ai' | string;
  phases: WorkflowPhase[];
  summary: WorkflowSummary;    // progress %, team size recommendation
}
```

### Task (flat — `tasks` Firestore collection)
```typescript
{
  id: string;                  // "<workflowId>_<embeddedId>"
  workflowId: string;
  productId: string;
  phaseId: string;
  skillsRequired: string[];
  estimatedHours: number;
  storyPoints: number;         // Fibonacci: 1/2/3/5/8/13
  priority: 'High' | 'Medium' | 'Low';
  status: 'unassigned' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;         // employee uid
  sprintId?: string;
  sprintNumber?: number;
}
```

### Sprint
```typescript
{
  id: string;
  workflowId: string;
  number: number;              // 1-based, sequential
  startDate: Date;
  endDate: Date;               // computed via working-day math (skips weekends)
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  allocatedPoints: number;
  taskIds: string[];
  employeeAllocations: Record<string, number>;  // employeeId → story points
}
```

---

## Quick Start

### Prerequisites
- Node.js 20.0+
- npm or yarn
- Firebase project with a **service account** key (Admin SDK)
- Google AI API key ([get one here](https://aistudio.google.com/app/apikey))

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/Zoroh26/KaryaAI.git
cd KaryaAI/backend

# Install dependencies
npm install

# Configure environment variables (see section below)
cp .env.example .env
# Edit .env with your Firebase and Gemini credentials

# Bootstrap an admin user (first-time setup)
npm run create-admin

# Start development server (http://localhost:3000)
npm run dev
```

### Frontend Setup
```bash
cd KaryaAI/frontend
npm install
npm run dev   # http://localhost:5173
```

---

## Environment Configuration

Create `backend/.env` with the following variables:

```env
# ─── Server ──────────────────────────────────────────────────────────────────
PORT=3000
NODE_ENV=development

# ─── Firebase Admin SDK ───────────────────────────────────────────────────────
# Download your service account JSON from Firebase Console →
# Project Settings → Service Accounts → Generate new private key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"

# ─── Google Gemini AI ─────────────────────────────────────────────────────────
# Accepted as either name; GOOGLE_GEMINI_KEY takes precedence
GOOGLE_GEMINI_KEY=your-gemini-api-key
# GEMINI_API_KEY=your-gemini-api-key   # fallback alias

# ─── Security ────────────────────────────────────────────────────────────────
JWT_SECRET=your-secure-jwt-secret-minimum-32-characters

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Comma-separated list of allowed frontend origins
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
FRONTEND_URL=http://localhost:5173
```

> **Note:** `FIREBASE_PRIVATE_KEY` must preserve the literal `\n` sequences — wrap the value in double-quotes as shown above.

---

## API Reference

**Base URL:** `http://localhost:3000/api`  
All versioned routes are also accessible under `/api/v1/` (e.g. `/api/v1/auth/login`).

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/signup` | Public | Register a new user (client, employee, admin) |
| `POST` | `/auth/register` | Public | Alias for `/signup` |
| `POST` | `/auth/login` | Public | Sign in, receive Firebase ID token |
| `POST` | `/auth/logout` | Public | Clear auth cookie |
| `GET`  | `/auth/me` | 🔒 Any | Return currently authenticated user |
| `POST` | `/auth/dev-token` | Public (non-prod) | Issue a test token via Admin SDK custom token |

**Login request:**
```json
POST /api/auth/login
{ "email": "admin@company.com", "password": "Admin@123" }
```

**Login response:**
```json
{
  "success": true,
  "token": "<firebase-id-token>",
  "user": { "uid": "...", "email": "...", "role": "admin" }
}
```

---

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`    | `/users` | 🔒 Admin | List all users |
| `GET`    | `/users/stats` | 🔒 Admin | User count/role breakdown |
| `GET`    | `/users/employees/available` | 🔒 Employee/Admin | List employees with `isAvailable: true` |
| `GET`    | `/users/:id` | 🔒 Admin | Get user by ID |
| `PUT`    | `/users/:id` | 🔒 Admin | Update user (skills, role, availability) |
| `DELETE` | `/users/:id` | 🔒 Admin | Soft-delete user |
| `POST`   | `/users/:id/restore` | 🔒 Admin | Restore soft-deleted user |

---

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST`  | `/products` | 🔒 Client | Submit a new product brief |
| `GET`   | `/products/my-products` | 🔒 Client | Get client's own products |
| `GET`   | `/products` | 🔒 Admin | List all products |
| `GET`   | `/products/stats` | 🔒 Admin | Product count by status |
| `GET`   | `/products/:id` | 🔒 Client/Admin | Get product details |
| `PUT`   | `/products/:id` | 🔒 Client/Admin | Update product fields |
| `PATCH` | `/products/:id/status` | 🔒 Admin | Advance product status |
| `DELETE`| `/products/:id` | 🔒 Admin | Soft-delete product |

**Create product request:**
```json
POST /api/products
{
  "title": "E-Commerce Platform",
  "description": "A modern online store with cart, payments, and inventory management",
  "priority": "High",
  "estimatedBudget": 50000,
  "targetAudience": "SMB retailers",
  "platformType": "Web + Mobile",
  "techPreferences": "React, Node.js, PostgreSQL"
}
```

---

### Workflows
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/workflows/generate` | 🔒 Client/Admin | Generate AI workflow for a product |
| `POST` | `/workflows/analyze` | 🔒 Client/Admin | Analyze project complexity (no workflow created) |
| `GET`  | `/workflows/my-workflows` | 🔒 Client | Get client's own workflows |
| `GET`  | `/workflows` | 🔒 Admin | List all workflows |
| `GET`  | `/workflows/:id` | 🔒 Client/Admin | Get workflow with phases and tasks |
| `PUT`  | `/workflows/:id` | 🔒 Client/Admin | Update workflow fields |
| `POST` | `/workflows/:id/approve` | 🔒 Admin | Approve workflow → seeds flat `tasks` collection + updates product status to `in_progress` |

---

### Tasks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`  | `/tasks` | 🔒 Admin | List all tasks (with filters) |
| `POST` | `/tasks` | 🔒 Admin | Manually create a task |
| `POST` | `/tasks/assign` | 🔒 Admin | AI-assign tasks by `taskIds` (with optional `preview` mode) |
| `GET`  | `/tasks/employee/:employeeId` | 🔒 Employee/Admin | Get tasks for a specific employee |
| `GET`  | `/tasks/:id` | 🔒 Employee/Admin | Get task by ID |
| `PUT`  | `/tasks/:id` | 🔒 Employee/Admin | Update task (status, progress) |

---

### Sprints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST`  | `/sprints/plan/:workflowId` | 🔒 Admin | (Re-)plan all sprints for a workflow |
| `GET`   | `/sprints/workflow/:workflowId` | 🔒 Client/Admin | List all sprints for a workflow |
| `GET`   | `/sprints/:id` | 🔒 Employee/Admin | Get sprint details with task IDs |
| `PATCH` | `/sprints/:id/status` | 🔒 Admin | Advance sprint lifecycle (`planning → active → completed`) |
| `POST`  | `/sprints/:id/replan` | 🔒 Admin | End sprint & roll incomplete tasks to a new sprint |

**Sprint plan response:**
```json
{
  "success": true,
  "result": {
    "sprintsCreated": 4,
    "totalTasks": 23,
    "tasksPlanned": 23,
    "sprintSummary": [
      {
        "sprintNumber": 1,
        "sprintId": "abc123",
        "taskCount": 6,
        "totalPoints": 14,
        "employeeAllocations": { "emp001": 8, "emp002": 6 },
        "startDate": "2026-06-23T00:00:00.000Z",
        "endDate": "2026-07-04T00:00:00.000Z"
      }
    ]
  }
}
```

---

### AI Endpoints
| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| `POST` | `/ai/demo-workflow` | Public | 10/min | Generate a sample workflow without saving |
| `POST` | `/ai/generate-workflow` | 🔒 Client/Admin | 10/min | Generate & persist AI workflow |
| `POST` | `/ai/assign-tasks` | 🔒 Admin | Standard | AI-assign tasks by `workflowId` or `taskIds` |
| `POST` | `/ai/analyze-project` | 🔒 Client/Admin | Standard | Analyze project description for complexity |
| `GET`  | `/ai/recommendations/:productId` | 🔒 Client/Admin | Standard | Get AI-driven suggestions for a product |

**Generate workflow request:**
```json
POST /api/ai/generate-workflow
{
  "description": "Build a multi-tenant SaaS dashboard with real-time analytics, user management, and billing integration",
  "productId": "prod_abc123",
  "clientId": "user_xyz789"
}
```

**Assign tasks request (preview mode):**
```json
POST /api/ai/assign-tasks
{
  "workflowId": "wf_abc123",
  "preview": true
}
```

**Health check:**
```bash
GET http://localhost:3000/api/health
# → { "status": "OK", "database": { "connected": true }, "environment": "development" }
```

---

## AI Capabilities

### Workflow Generation
The `WorkflowService.generateWorkflow()` method sends a structured prompt to **Gemini 3 Flash** (via `@google/genai`) requesting a JSON-mode response conforming to:

```
Project Description → Gemini 3 Flash (JSON mode)
    ↓
WorkflowStructure { title, phases[], totalEstimatedHours, recommendedTeamSize }
    ↓
transformToHierarchical() — resolves dependency task-titles → IDs
    ↓
Firestore: workflows/{id} (embedded tasks in phases)
```

The generated workflow includes:
- 3–6 logical project phases
- Specific, actionable tasks per phase with skill requirements
- Realistic hour estimates (Fibonacci-mapped to story points)
- Dependency chains (title-to-ID resolution performed server-side)
- Complexity and priority auto-classification

### Project Analysis
`POST /api/ai/analyze-project` returns:
```json
{
  "complexity": "High",
  "estimatedDuration": "3-4 months",
  "recommendedApproach": "Agile with 2-week sprints",
  "riskFactors": ["Third-party payment gateway integration", "Real-time data sync"],
  "recommendedTeamSize": 6,
  "keyTechnologies": ["React", "Node.js", "PostgreSQL", "Stripe API"]
}
```

---

## Role-Based Access Control

| Role | Can Do |
|------|--------|
| **Admin** | All operations — user management, product approval, workflow approval, AI assignment, sprint planning, analytics |
| **Client** | Submit products, generate AI workflows, view their own products/workflows |
| **Employee** | View and update their own assigned tasks, view sprint details |

Authentication tokens can be passed in two ways:
1. **Cookie** — `auth_token` httpOnly cookie (set on login)
2. **Header** — `Authorization: Bearer <firebase-id-token>`

In development (`NODE_ENV !== 'production'`), the `/auth/dev-token` endpoint issues Firebase custom tokens for testing without a browser-based login flow.

---

## Sprint Planning Engine

Sprints are planned via `POST /api/sprints/plan/:workflowId`. The algorithm:

1. **Load tasks** — fetches the flat `tasks` collection for the workflow (requires workflow to be approved first)
2. **Topological sort** — Kahn's algorithm orders tasks so dependencies are scheduled in earlier sprints
3. **Capacity-bound assignment** — for each task (in dependency order):
   - Find the employee with the best skill-match score who can absorb the task's story points in the earliest possible sprint
   - If all employees are at capacity, create sprint N+1
4. **Persist** — batch-writes Sprint documents + updates each task with `sprintId`, `sprintNumber`, `assignedTo`, `storyPoints`
5. **Idempotent** — calling again deletes existing sprints and rebuilds from scratch

**Sprint constants (configurable via request body):**
| Parameter | Default | Description |
|---|---|---|
| `sprintDurationWorkingDays` | 10 | Working days per sprint (Mon–Fri) |
| `employeeCapacityPoints` | 16 | Max story points per employee per sprint |
| `sprintStartDate` | Today | Start date for Sprint 1 |

**Story point mapping:**
| Estimated Hours | Story Points |
|---|---|
| 1 – 4h | 1 |
| 5 – 8h | 2 |
| 9 – 16h | 3 |
| 17 – 24h | 5 |
| 25 – 40h | 8 |
| 41h+ | 13 |

---

## Task Assignment Algorithm

The `TaskAssignmentService` scores each available employee against each unassigned task:

| Factor | Weight | Logic |
|---|---|---|
| **Skill Match** | 60% | Gatekeeper — 0 score if 0 skills match; score = `(matched / required) × 60` |
| **Workload** | 20% | `(3 − activeTasks) / 3 × 20`; employees with ≥ 3 active tasks are excluded |
| **Priority** | 15% | High = 15 pts, Medium = 10 pts, Low = 5 pts |
| **Experience** | 5% | `min(skillsetSize / 10, 1) × 5` |

> **Score interpretation:** ≥ 80 = Excellent, ≥ 60 = Good, ≥ 30 = Fair, < 30 = Low/fallback

On commit (`preview: false`), the service:
- Updates each task's `assignedTo` + `status: 'assigned'` in Firestore
- Increments the in-memory workload counter to account for assignments within the same batch
- Sets `isAvailable: false` on employees who reach 3 active tasks

---

## Security

| Mechanism | Details |
|---|---|
| **Firebase Auth** | All tokens verified server-side via `auth.verifyIdToken()` |
| **Role Guards** | `requireAdmin`, `requireClient`, `requireEmployee`, `requireClientOrAdmin`, `requireEmployeeOrAdmin` |
| **Rate Limiting** | 100 req / 15 min globally; **10 req / 1 min** on AI generation routes |
| **CORS** | Configurable via `ALLOWED_ORIGINS` env var; credentials allowed |
| **Zod Validation** | All request bodies validated before hitting service layer |
| **Soft Deletes** | Users, products, and workflows use `isDeleted` flags — no hard deletes |
| **Body Limits** | JSON and URL-encoded bodies limited to **10 MB** |

---

## Testing

### Unit & Integration Tests
```bash
cd backend
npm test                  # Run Jest test suite
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### End-to-End Flow Tests
```bash
# Full workflow: signup → login → create product → generate workflow → approve → assign
npm run test:flow

# Keep test data after run (for inspection)
npm run test:flow:keep
```

### PowerShell API Testing
```powershell
# Quick login
$body = @{ email = "admin@karyaai.com"; password = "Admin@123" } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST -Body $body -ContentType "application/json"

# Store token
$token = $res.token
$headers = @{ Authorization = "Bearer $token" }

# Generate AI workflow
$wfBody = @{
    description = "Build a SaaS dashboard with analytics and billing"
    productId   = "YOUR_PRODUCT_ID"
    clientId    = "YOUR_CLIENT_ID"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/ai/generate-workflow" `
    -Method POST -Headers $headers -Body $wfBody -ContentType "application/json"
```

> Full test scripts are in [`backend/quick-tests.ps1`](backend/quick-tests.ps1)

### Bootstrap Admin User
```bash
cd backend
npm run create-admin
# Creates a Firebase Auth user and Firestore record for the admin role
```

---

## Deployment

### Development
```bash
# Backend (http://localhost:3000)
cd backend && npm run dev

# Frontend (http://localhost:5173)
cd frontend && npm run dev
```

### Production Build
```bash
# Backend — compile TypeScript
cd backend
npm run build        # outputs to dist/
npm start            # node dist/server.js

# Frontend — build static assets
cd frontend
npm run build        # outputs to dist/
```

### Docker (Backend)
```bash
docker build -t karyaai-backend ./backend
docker run -p 3000:3000 --env-file ./backend/.env karyaai-backend
```

### Environment Notes
- Set `NODE_ENV=production` in production — this disables the `/auth/dev-token` endpoint and the custom-token fallback in the auth middleware
- Ensure `ALLOWED_ORIGINS` includes your deployed frontend URL
- Use a proper secret manager for `FIREBASE_PRIVATE_KEY` in production — avoid storing raw PEM in environment variables where possible

---

## Project Structure

```
KaryaAI/
├── backend/
│   ├── src/
│   │   ├── app.ts               # Express app setup
│   │   ├── server.ts            # HTTP server entry
│   │   ├── config/              # Firebase + Gemini init
│   │   ├── controllers/         # Route handlers (7 controllers)
│   │   ├── services/            # Business logic (8 services)
│   │   ├── middlewares/         # Auth, validation, error handling
│   │   ├── models/              # Domain interfaces (4 models)
│   │   ├── types/schema.ts      # Zod schemas + inferred types
│   │   ├── routes/              # Express routers (7 route files)
│   │   ├── utils/               # Constants, helpers, story points
│   │   └── __tests__/           # Jest test suite
│   ├── scripts/create-admin.ts  # Admin bootstrap script
│   ├── quick-tests.ps1          # PowerShell E2E tests
│   ├── jest.config.ts
│   ├── tsconfig.json            # Strict TS config, ES2020 target
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # shadcn/ui + custom components
│   │   ├── pages/               # Route-level views
│   │   └── hooks/               # TanStack Query hooks
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

---

## Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Follow** TypeScript strict mode and existing code patterns
4. **Add** Zod validation for any new request bodies
5. **Test** using the PowerShell scripts or Jest suite
6. **Update** this README for any new endpoints or configuration
7. **Submit** a Pull Request with a clear description and test evidence

### Code Standards
- TypeScript **strict mode** enabled — `noImplicitAny`, `strictNullChecks`, `noImplicitReturns`
- All request bodies validated with **Zod** schemas defined in `src/types/schema.ts`
- **Centralized error handling** via `errorHandler.ts` middleware
- **Soft deletes only** — never hard-delete users, products, or workflows
- Services own all Firestore reads/writes — controllers stay thin
- Rate-limit any routes that trigger Gemini API calls

---

## Roadmap

### Current Status ✅
- Backend API fully implemented and tested (auth, products, workflows, tasks, sprints, AI)
- AI-powered workflow generation and project analysis (Gemini 3 Flash)
- Dependency-aware sprint planning with capacity constraints
- Multi-factor task assignment scoring engine
- Role-based auth with Firebase token verification
- PowerShell + Jest test coverage

### Planned Features 🗓️
- **Real-time Updates** — WebSocket / Firestore listeners for live task and sprint status
- **Advanced Analytics** — Employee velocity charts, sprint burn-down, on-time delivery rates
- **Notification System** — Email + Slack alerts for task assignments and sprint transitions
- **Calendar Integration** — Sync sprint dates with Google Calendar / Outlook
- **Mobile Responsive Frontend** — Progressive Web App support
- **Audit Log** — Immutable history of status changes and assignments

---

**Built with ❤️ using Node.js, TypeScript, Firebase, and Google Gemini AI**
