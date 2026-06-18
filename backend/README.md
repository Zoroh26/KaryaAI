# KaryaAI — Backend API

A Node.js / Express REST API backend for the KaryaAI project-management platform. It uses **Firebase Admin SDK** (Authentication + Firestore) as the database layer and **Google Gemini** for AI-powered workflow generation and project analysis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 4 |
| Database | Firebase Firestore (NoSQL) |
| Auth | Firebase Authentication (Admin SDK) |
| AI | Google Gemini (`@google/genai`) |
| Validation | Zod |
| Testing | Jest + Supertest |

---

## Project Structure

```
backend/
├── src/
│   ├── app.ts                  # Express app setup (CORS, middleware, routes)
│   ├── server.ts               # HTTP server entry point
│   ├── routes/
│   │   ├── auth.ts             # /api/auth  — signup, login, logout, /me
│   │   ├── users.ts            # /api/users — user CRUD (admin only)
│   │   ├── products.routes.ts  # /api/products
│   │   ├── workflows.routes.ts # /api/workflows
│   │   ├── tasks.ts            # /api/tasks
│   │   ├── sprints.routes.ts   # /api/sprints
│   │   └── ai.ts              # /api/ai    — AI generation endpoints
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── user.controller.ts
│   │   ├── product.controller.ts
│   │   ├── workflow.controller.ts
│   │   ├── taskController.ts
│   │   ├── sprint.controller.ts
│   │   └── aiController.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── products.services.ts
│   │   ├── workflow.service.ts
│   │   ├── taskAssignmentService.ts
│   │   ├── sprint.service.ts
│   │   └── firebaseService.ts
│   ├── middlewares/
│   │   ├── auth.ts             # Firebase token verification + RBAC
│   │   ├── errorHandler.ts
│   │   └── validation.ts       # Zod request-body validation
│   ├── models/                 # TypeScript interfaces
│   ├── types/
│   │   └── schema.ts           # Zod schemas + shared types
│   ├── config/
│   │   ├── firebase.ts         # Admin SDK initialisation
│   │   └── gemini.ts           # Gemini AI client
│   └── __tests__/
│       ├── setup.ts
│       └── workflow.test.ts
├── quick-tests.ps1             # Live API user-flow test script
├── .env                        # Environment variables (not committed)
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with **Firestore** and **Authentication** enabled
- A Google Gemini API key

### Install

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Google Gemini
GOOGLE_GEMINI_KEY=your_gemini_api_key

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Web API Key (used by client SDK / REST auth)
FIREBASE_API_KEY=your_web_api_key

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

### Run in Development

```bash
npm run dev          # nodemon + ts-node hot-reload
```

### Build & Run Production

```bash
npm run build        # tsc → dist/
npm start            # node dist/server.js
```

---

## API Reference

Base URL: `http://localhost:3000`  
All `/api/*` routes are rate-limited to **100 req / 15 min** per IP.  
AI generation endpoints have a stricter limit of **10 req / 1 min**.

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Create a new user account |
| `POST` | `/api/auth/login` | Public | Log in, receive a custom token |
| `POST` | `/api/auth/logout` | Public | Clear auth cookies |
| `GET` | `/api/auth/me` | Bearer token | Return current user profile |
| `POST` | `/api/auth/dev-token` | Public (dev only) | Issue a custom token for API testing |

**Token flow:**  
`POST /login` returns a Firebase **custom token**. In production, the client exchanges this for a Firebase **ID token** using the Firebase client SDK, then sends the ID token as `Authorization: Bearer <id-token>`. In development, the custom token itself is accepted directly by the auth middleware.

---

### Users (`/api/users`) — Admin only

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users` | List all users (paginated, filterable by role/isActive) |
| `GET` | `/api/users/stats` | User counts by role / active / deleted |
| `GET` | `/api/users/:id` | Get user by ID |
| `PUT` | `/api/users/:id` | Update user (full_name, role, skillset, isActive, isAvailable) |
| `DELETE` | `/api/users/:id` | Soft-delete user |
| `POST` | `/api/users/:id/restore` | Restore soft-deleted user |
| `GET` | `/api/users/employees/available` | List available employees (employee or admin) |

**Query parameters for `GET /api/users`:**
```
?role=employee|client|admin
&isActive=true|false
&page=1
&limit=10
```

---

### Products (`/api/products`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/products` | Client | Create a new product request |
| `GET` | `/api/products/my-products` | Client | Get the client's own products |
| `GET` | `/api/products` | Admin | List all products |
| `GET` | `/api/products/stats` | Admin | Product counts by status |
| `GET` | `/api/products/:id` | Client or Admin | Get product by ID |
| `PUT` | `/api/products/:id` | Client or Admin | Update product (clients: restricted fields) |
| `DELETE` | `/api/products/:id` | Admin | Soft-delete product |
| `PATCH` | `/api/products/:id/status` | Admin | Update product status |

**Product statuses:** `pending_review` · `in_progress` · `completed` · `cancelled`

---

### Workflows (`/api/workflows`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/workflows/generate` | Client | AI-generate a workflow for a product |
| `POST` | `/api/workflows/analyze` | Client or Admin | Analyze project complexity via AI |
| `GET` | `/api/workflows/my-workflows` | Client | Client's own workflows |
| `GET` | `/api/workflows` | Admin | All workflows |
| `GET` | `/api/workflows/:id` | Client or Admin | Get workflow by ID |
| `PUT` | `/api/workflows/:id` | Client or Admin | Update workflow |
| `POST` | `/api/workflows/:id/approve` | Admin | Approve workflow (auto-triggers sprint planning) |

**Workflow statuses:** `draft` · `generated` · `pending_approval` · `approved` · `in_progress` · `completed` · `cancelled`

**Approval side-effects:**
1. Workflow status → `approved`
2. Associated product status → `in_progress`
3. Embedded tasks are seeded into the top-level `tasks` Firestore collection
4. Sprint planning is automatically triggered

---

### Tasks (`/api/tasks`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | Admin (or own tasks for employee) | List tasks with filters |
| `POST` | `/api/tasks` | Admin | Create a task manually |
| `POST` | `/api/tasks/assign` | Admin | AI-assign unassigned tasks to employees |
| `GET` | `/api/tasks/employee/:employeeId` | Employee or Admin | Get tasks for a specific employee |
| `GET` | `/api/tasks/:id` | Employee (own) or Admin | Get task by ID |
| `PUT` | `/api/tasks/:id` | Employee (own) or Admin | Update task |

**Task statuses:** `unassigned` · `assigned` · `in_progress` · `completed` · `cancelled`

---

### Sprints (`/api/sprints`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/sprints/plan/:workflowId` | Admin | (Re-)plan sprints for a workflow |
| `GET` | `/api/sprints/workflow/:workflowId` | Client or Admin | List all sprints for a workflow |
| `GET` | `/api/sprints/:id` | Employee or Admin | Get sprint with enriched task list |
| `PATCH` | `/api/sprints/:id/status` | Admin | Advance sprint lifecycle |
| `POST` | `/api/sprints/:id/replan` | Admin | End sprint, roll unfinished tasks forward |

**Sprint statuses:** `planning` → `active` → `completed` | `cancelled`

**`POST /plan` body (all optional):**
```json
{
  "sprintStartDate": "2026-05-21",
  "sprintDurationWorkingDays": 10,
  "employeeCapacityPoints": 16
}
```

---

### AI (`/api/ai`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/ai/demo-workflow` | Public | Generate a demo workflow (no auth) |
| `POST` | `/api/ai/generate-workflow` | Client or Admin | Generate workflow for a product |
| `POST` | `/api/ai/assign-tasks` | Admin | AI-assign tasks to employees |
| `POST` | `/api/ai/analyze-project` | Client or Admin | Analyze project complexity |
| `GET` | `/api/ai/recommendations/:productId` | Client or Admin | Get AI recommendations |

---

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Server status + Firebase connection |
| `GET` | `/api/health` | Health check (`OK` or `DEGRADED`) |

---

## Roles & Access Control

| Role | Capabilities |
|---|---|
| `admin` | Full access to all resources |
| `client` | Own products, own workflows, own tasks view |
| `employee` | Own assigned tasks only |

Tokens are verified by `src/middlewares/auth.ts`. Role guards (`requireAdmin`, `requireClient`, `requireEmployee`, `requireEmployeeOrAdmin`, `requireClientOrAdmin`) are composed per-route.

---

## Data Models

### User
```ts
{
  uid: string;
  email: string;
  full_name: string;
  role: 'client' | 'admin' | 'employee';
  skillset?: string[];        // employees only
  isAvailable?: boolean;      // employees only
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Product
```ts
{
  id: string;
  clientId: string;
  title: string;
  description: string;
  category?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: ProductStatus;
  estimatedBudget?: number;
  deadline?: Timestamp;
}
```

### Workflow
```ts
{
  id: string;
  productId: string;
  clientId: string;
  title: string;
  description: string;
  status: WorkflowStatus;
  complexity: 'Low' | 'Medium' | 'High';
  priority: 'Low' | 'Medium' | 'High';
  estimatedHours: number;
  estimatedDuration: string;
  phases: WorkflowPhase[];    // embedded sub-collection
  summary: WorkflowSummary;
}
```

### Task (flat collection)
```ts
{
  id: string;
  workflowId: string;
  productId: string;
  phaseId: string;
  title: string;
  skillsRequired: string[];
  estimatedHours: number;
  storyPoints: number;        // Fibonacci: 1/2/3/5/8/13
  priority: 'Low' | 'Medium' | 'High';
  status: TaskStatus;
  assignedTo?: string;        // employee UID
  sprintId?: string;
  sprintNumber?: number;
}
```

---

## Running Tests

### Unit tests (Jest)

```bash
npm test              # run all jest tests
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

### Live API flow tests (PowerShell)

The `quick-tests.ps1` script runs an end-to-end user flow against the running server. It covers: health check, signup, login, dev-token issuance, authenticated access, RBAC enforcement, admin user CRUD, logout, and logic-flaw probes.

```powershell
# Basic flow (no admin token)
.\quick-tests.ps1

# Full flow including admin CRUD
.\quick-tests.ps1 -AdminEmail admin@example.com

# Keep the test user in Firestore after the run
.\quick-tests.ps1 -AdminEmail admin@example.com -KeepUser

# Point at a different environment
.\quick-tests.ps1 -BaseUrl http://localhost:4000 -AdminEmail admin@example.com
```

---

## Known Limitations / TODOs

| ID | Description | File |
|---|---|---|
| C1 | Password is not verified on login (intentional for testing; use Firebase REST API in production) | `src/services/auth.service.ts` |
| H4 | `PUT /api/workflows/:id` does not strip admin-only fields (e.g. `status`) for client users | `src/controllers/workflow.controller.ts` |
| H2 | Employees can overwrite any field on their tasks, not just `status` | `src/controllers/taskController.ts` |
| M1 | Soft-deleting a user does not disable the Firebase Auth account or revoke tokens | `src/services/user.service.ts` |

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with nodemon + ts-node hot-reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm test` | Run Jest unit tests |
| `npm run test:coverage` | Jest with coverage |
| `npm run type-check` | TypeScript type-check without emitting |
