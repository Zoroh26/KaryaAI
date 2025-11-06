
<img width="1000" height="313" alt="Banner" src="https://github.com/user-attachments/assets/5bebf049-3e50-470d-ae2c-9e65f49aebc5" /><br>

[![Node.js](https://img.shields.io/badge/Node.js-20.0%2B-brightgreen?style=for-the-badge&logo=nodejs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9%2B-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21%2B-lightgrey?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-13.4%2B-orange?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1%2B-06B6D4.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow?style=for-the-badge)](LICENSE)

**KaryaAI** is an intelligent project and task management platform that leverages Google Gemini AI for automated workflow generation and smart task assignment. Built with modern technologies including Node.js, TypeScript, Firebase, and Next.js.

## Key Features

### **AI-Powered Intelligence**
- **Smart Workflow Generation**: Convert natural language requirements into structured workflows
- **Intelligent Task Assignment**: AI-driven employee matching based on skills, workload, and availability
- **Automated Project Planning**: Generate comprehensive project structures from simple descriptions

### **Enterprise-Grade Security**
- **Role-Based Access Control**: Admin, Employee, and Client roles with granular permissions
- **JWT Authentication**: Secure token-based authentication with httpOnly cookies
- **Firebase Integration**: Robust user management and real-time database capabilities

### **Comprehensive Management**
- **Product Lifecycle**: End-to-end product development tracking
- **Workflow Orchestration**: Hierarchical workflow and task organization
- **Team Collaboration**: Real-time task updates and progress tracking
- **Performance Analytics**: Employee workload balancing and productivity insights

## Architecture Overview

```
KaryaAI/
├── backend/              # Node.js + Express API Server
│   ├── src/
│   │   ├── controllers/  # API endpoint handlers
│   │   ├── services/     # Business logic & AI integration
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── config/       # Firebase & Gemini configuration
│   │   └── routes/       # API route definitions
│   └── package.json
├── frontend/             # Next.js React Application
│   ├── components/       # Reusable UI components
│   ├── pages/           # Next.js pages and API routes
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Frontend utilities
├── docs/                # Documentation & guides
└── README.md           # Project overview
```

## Tech Stack

### **Backend**
- **Node.js 20+** - JavaScript runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript development
- **Firebase Firestore** - NoSQL document database
- **Firebase Auth** - Authentication and user management
- **Google Gemini AI** - Advanced language model for AI features
- **Zod** - TypeScript-first schema validation

### **Frontend** 
- **Next.js** - React framework with SSR/SSG
- **React** - Component-based UI library
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Data fetching and state management

### **DevOps & Tools**
- **Git** - Version control
- **Docker** - Containerization
- **PowerShell/Postman** - API testing
- **TypeScript ESLint** - Code quality and consistency

## Quick Start

### **Prerequisites**
- Node.js 20.0 or higher
- npm or yarn package manager
- Firebase project with Admin SDK credentials
- Google AI API key

### **Backend Setup**
```bash
# Clone the repository
git clone https://github.com/Zoroh26/KaryaAI.git
cd KaryaAI/backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

### **Environment Configuration**
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"

# Google AI Configuration
GOOGLE_GEMINI_KEY=your-gemini-api-key

# Security
JWT_SECRET=your-secure-jwt-secret-minimum-32-characters
```

## � API Reference

**Base URL**: `http://localhost:3000/api`

### **Authentication**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | User authentication |
| POST | `/auth/logout` | User logout |

### **Core Resources**
| Resource | Endpoints | Description |
|----------|-----------|-------------|
| **Users** | `GET/PATCH /users` | User management |
| **Products** | `GET/POST/PATCH /products` | Product CRUD operations |
| **Workflows** | `GET/POST/PATCH /workflows` | Workflow management |
| **Tasks** | `GET/POST/PATCH /tasks` | Task operations |
| **AI** | `POST /ai/generate-workflow` | AI-powered generation |

### **Key Features**
- **Smart Assignment**: `POST /tasks/assign` - AI-powered task assignment
- **Role Access**: Admin, Employee, Client role-based permissions
- **Real-time Updates**: WebSocket support for live updates

## AI-Powered Task Assignment

KaryaAI's intelligent task assignment system uses a sophisticated multi-factor algorithm:

### **Assignment Algorithm**
1. **Skill Matching (40%)** - Exact and partial skill matching with fuzzy logic
2. **Workload Balance (30%)** - Current active tasks (max 3 per employee)
3. **Task Priority (20%)** - High/Medium/Low priority weighting
4. **Availability (10%)** - Employee availability status

### **How It Works**
```bash
# Admin triggers assignment
POST /api/tasks/assign
{
  "taskIds": ["task1", "task2", "task3"]
}

# AI processes each task and returns optimal assignments
Response: {
  "assignments": [{
    "taskId": "task1",
    "assignedTo": "employee_id",
    "employeeName": "Alice Johnson",
    "matchScore": 87.5,
    "reason": "High skill match, low workload, high priority"
  }]
}
```

## � Role-Based Access Control

| Role | Permissions | Key Features |
|------|-------------|--------------|
| **Admin** | Full system access | User management, AI assignment, analytics |
| **Employee** | Personal task management | View/update own tasks, skill management |
| **Client** | Project ownership | Create products, generate workflows |

## Testing & Development

### **API Testing**
```bash
# Health check
GET http://localhost:3000/

# Authentication flow
POST /api/auth/login
{
  "email": "admin@karyaai.com",
  "password": "Admin@123"
}

# Test AI workflow generation
POST /api/ai/generate-workflow
{
  "productId": "product_id",
  "requirements": "Build a task management app with user auth and real-time updates"
}
```

### **PowerShell Testing**
```powershell
# Quick login test
$loginData = @{
    email = "admin@karyaai.com"
    password = "Admin@123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST -Body $loginData -ContentType "application/json"

Write-Host "Token received: $($response.token)"
```

## Deployment

### **Development**
```bash
cd backend
npm run dev  # Starts on http://localhost:3000
```

### **Production**
```bash
# Build and start
npm run build
npm start

# Using Docker
docker build -t karyaai-backend .
docker run -p 3000:3000 karyaai-backend
```

### **Environment Setup**
- **Development**: Local Firebase project, test Gemini key
- **Production**: Production Firebase project, secured environment variables

## Project Structure

```
KaryaAI
├── backend/           # Node.js API server
│   ├── src/
│   │   ├── controllers/   # API endpoint handlers
│   │   ├── services/      # Business logic & AI
│   │   ├── middleware/    # Auth & validation
│   │   └── config/        # Firebase & Gemini
│   └── README.md      # Backend documentation
├── frontend/          
└── README.md          # Project overview
```

## Contributing

### **Development Workflow**
1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Follow** TypeScript best practices and existing code style
4. **Test** your changes with provided test scripts
5. **Update** documentation for new features
6. **Submit** a Pull Request with clear description

### **Code Standards**
- **TypeScript** strict mode enabled
- **ESLint** configuration for consistent code style
- **Zod** schemas for all API validation
- **Error handling** with centralized middleware
- **Security** best practices (JWT, CORS, validation)

##  Roadmap

### **Current Status** 
- Backend API fully implemented and tested
- AI-powered workflow generation and task assignment
- Role-based authentication and authorization
- Comprehensive documentation and testing guides

### **Planned Features** 
- **Real-time Updates**: WebSocket integration for live task updates
- **Advanced Analytics**: Employee performance and project insights
- **Mobile Support**: Responsive design and mobile-first approach
- **Integrations**: Slack, email notifications, calendar sync

- **Discussions**: Join project discussions for questions and ideas
- **Email**: Contact the maintainer for enterprise inquiries

---

**Built with ❤️ using modern technologies and AI-powered intelligence**
