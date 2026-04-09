<div align="center">

# 🚀 Nexora — Learning Management Platform

**A full-featured, role-based Learning Management System built with Next.js 16 & React 19**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.7-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.5.5-6366f1)](https://better-auth.com)
[![Stripe](https://img.shields.io/badge/Stripe-Integrated-635BFF?logo=stripe)](https://stripe.com)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features by Role](#features-by-role)
- [Route Map](#route-map)
- [API Client](#api-client)
- [Authentication](#authentication)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Key Design Patterns](#key-design-patterns)
- [Component Architecture](#component-architecture)

---

## Overview

Nexora is a **production-ready Learning Management System** with three distinct role-based portals — **Admin**, **Teacher**, and **Student**. It features a rich, dark-mode-first UI, Stripe-powered course purchases, real-time attendance tracking, cluster-based student grouping, a leaderboard, resource annotations, and a full content approval pipeline.

The frontend is a **Next.js 16 App Router** application that proxies all API calls to a separate backend service. All route access is protected by role-based guards at the layout level.

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16.1.7 (App Router) |
| **UI Library** | React 19.2.3 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 + `tw-animate-css` |
| **Component Library** | Shadcn UI + Radix UI |
| **Icons** | React Icons (Remix Icon set) + Tabler Icons |
| **Authentication** | Better Auth 1.5.5 (Email/Password + Google OAuth) |
| **Payments** | Stripe (`@stripe/react-stripe-js`, `@stripe/stripe-js`) |
| **Drag & Drop** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers` |
| **Data Tables** | TanStack React Table v8 |
| **Charts** | Recharts v2 |
| **Toasts** | Sonner v2 |
| **Validation** | Zod v4 |
| **Theme** | next-themes (dark/light mode) |
| **Env Validation** | @t3-oss/env-nextjs |

---

## Project Structure

```
nexora_frontend/
├── src/
│   ├── app/
│   │   ├── (main)/                    # Public-facing pages
│   │   │   ├── page.tsx               # Homepage (hero, features, testimonials)
│   │   │   ├── layout.tsx             # Public layout (Navbar + Footer)
│   │   │   ├── auth/                  # Authentication pages
│   │   │   │   ├── signin/
│   │   │   │   ├── signup/
│   │   │   │   ├── forgetPassword/
│   │   │   │   ├── resetPassword/
│   │   │   │   ├── changePassword/
│   │   │   │   ├── verifyEmail/
│   │   │   │   └── google/            # Google OAuth callback
│   │   │   └── courses/               # Public course catalog
│   │   │       ├── page.tsx           # Browsable course listing
│   │   │       ├── [id]/              # Course detail page
│   │   │       └── enroll/            # Stripe enrollment flow
│   │   ├── dashboard/
│   │   │   ├── layout.tsx             # Dashboard shell (sidebar + auth guard)
│   │   │   ├── page.tsx               # Main dashboard overview
│   │   │   ├── (commonRoute)/         # Shared routes (settings, profile)
│   │   │   └── (roleBasedRoute)/
│   │   │       ├── admin/             # Admin portal (15 modules)
│   │   │       ├── teacher/           # Teacher portal (14 modules)
│   │   │       └── student/           # Student portal (12 modules)
│   │   └── api/                       # Next.js Route Handlers (proxy layer)
│   ├── components/
│   │   ├── shared/                    # Cross-cutting UI components
│   │   │   ├── NavBar.tsx             # Public navigation
│   │   │   ├── RefreshIcon.tsx        # Unified data-refresh button
│   │   │   ├── footer.tsx             # Site footer
│   │   │   └── themeToggleSwitch.tsx  # Dark/Light mode toggle
│   │   ├── backgrounds/               # Ambient gradient backgrounds
│   │   ├── chat/                      # AI chat widget
│   │   ├── courses/                   # Course card, catalog components
│   │   ├── dashboard/                 # Dashboard-specific widgets
│   │   ├── home/                      # Homepage sections
│   │   ├── profile/                   # User profile components
│   │   ├── ui/                        # Shadcn base components
│   │   ├── app-sidebar.tsx            # Sidebar navigation
│   │   ├── data-table.tsx             # TanStack Table wrapper
│   │   └── chart-area-interactive.tsx # Recharts page chart
│   ├── lib/
│   │   ├── api.ts                     # Typed API client (all namespaced endpoints)
│   │   └── utils.ts                   # `cn()` class merge utility
│   ├── types/
│   │   └── course.type.ts             # Shared TypeScript interfaces
│   ├── hooks/                         # Custom React hooks
│   ├── services/                      # Higher-level service abstractions
│   ├── provider/                      # React context providers
│   ├── config/                        # App configuration
│   ├── env.ts                         # Type-safe env vars (t3-oss)
│   └── proxy.ts                       # API proxy utilities
├── next.config.ts                     # Next.js config + API rewrites
├── package.json
└── tsconfig.json
```

---

## Features by Role

### 👑 Admin

| Module | Description |
|---|---|
| **Analytics** | Platform-wide KPIs — users, teachers, students, clusters, sessions, resources, enrollments, revenue with signup trend charts and storage breakdowns |
| **Users** | Full user management — search, view, update, deactivate, reset password, impersonate |
| **Courses** | Browse all courses, approve/reject submissions, toggle featured, set revenue share percentage |
| **Approvals › Courses** | Review teacher-submitted courses awaiting approval |
| **Approvals › Missions** | Approve or reject individual course missions/lessons |
| **Approvals › Price Requests** | Approve or reject teacher-requested course price changes |
| **Certificates** | View and manually issue completion certificates per enrollment |
| **Category** | Manage course categories |
| **Cluster Oversight** | Monitor all clusters, members, and attendance |
| **Content Moderation** | Review and remove flagged comments, courses, and resources; warn users |
| **Enrollments** | Browse all platform enrollments with filters |
| **Global Announcements** | Send targeted or broadcast announcements with urgency levels |
| **Email Templates** | Manage reusable email templates (create, edit, delete) |
| **Revenue** | Revenue summary — gross revenue, teacher payouts, platform earnings, transaction history |
| **Teacher Requests** | Approve or reject applications from users wanting to become teachers |
| **Testimonials** | Moderate user-submitted testimonials shown on the homepage |

### 📚 Teacher

| Module | Description |
|---|---|
| **Analytics** | Personal teaching metrics — enrollment rates, course performance, earnings |
| **Courses** | Create and manage courses through a full lifecycle (Draft → Submitted → Approved → Active → Finished) |
| **Course › Missions** | Add/reorder/delete lessons with mixed content (video, text/markdown, PDF) using drag-and-drop |
| **Course › Enrollments** | View enrolled students, their payment status, progress, and earnings breakdown |
| **Course › Price Requests** | Submit and track price change requests for admin approval |
| **Clusters** | Create and manage learning cohorts; invite students |
| **Sessions** | Schedule, manage, and track study sessions across clusters |
| **Attendance Tracking** | Mark and review student attendance per session |
| **Homework Management** | Create and review homework tasks; grade student submissions |
| **Task Submissions** | Review student task submissions and assign scores |
| **Task Templates** | Create reusable homework/task templates |
| **Resources** | Upload and organize learning materials (PDF, video, text, links) |
| **Announcements** | Send cluster-level announcements with urgency levels and scheduling |
| **Student Progress** | View per-student performance dashboards (submission rate, attendance, scores) |
| **Session History** | Historical log of completed sessions |
| **Notices** | View admin-sent personal notices |

### 🎓 Student

| Module | Description |
|---|---|
| **My Courses** | All enrolled courses with progress bars (In Progress / Completed tabs) |
| **Course Detail** | Mission-by-mission content viewer with completion tracking |
| **Homework** | View all assigned homework across sessions with submit/view actions |
| **Progress Dashboard** | Academic overview — submission rate, average score, attendance rate, session timeline, badges, pending homework |
| **Leaderboard** | Weekly and all-time rankings with composite score (tasks + attendance); opt-in/opt-out privacy control |
| **Certificates** | View and download PDF completion certificates with shareable verification links |
| **Clusters** | View joined clusters, sessions, members, and activities |
| **Resources** | Browse, search, filter, bookmark, and download learning materials |
| **Resource Annotations** | Highlight and annotate shared resources; view peer annotations |
| **Study Planner** | Create and track personal study goals with streak tracking |
| **Task Submission** | Submit homework and view reviewed scores |
| **Payment History** | Stripe transaction history with status, amounts, and course links |
| **Notices** | View admin-sent personal announcements |

---

## Route Map

### Public Routes

```
/                           → Homepage
/courses                    → Public course catalog
/courses/[id]               → Course detail & enrollment CTA
/courses/enroll             → Stripe payment flow
/auth/signin                → Sign in (email/password + Google)
/auth/signup                → Registration
/auth/forgetPassword        → Forgot password
/auth/resetPassword         → Reset password (token-based)
/auth/changePassword        → Change password (authenticated)
/auth/verifyEmail           → Email verification
/auth/google                → Google OAuth callback handler
```

### Dashboard Routes

```
/dashboard                             → Main overview
/dashboard/settings                    → Account settings, 2FA, API keys, sessions
/dashboard/profile                     → Public profile management

# Admin
/dashboard/admin/analytics             → Platform analytics
/dashboard/admin/users                 → User management
/dashboard/admin/courses               → All courses
/dashboard/admin/courses/[id]          → Course detail view
/dashboard/admin/approvals/courses     → Course approval queue
/dashboard/admin/approvals/missions    → Mission approval queue
/dashboard/admin/approvals/price-requests → Price request review
/dashboard/admin/certificates          → Certificate management
/dashboard/admin/category              → Category management
/dashboard/admin/cluster-oversight     → Cluster monitoring
/dashboard/admin/content-moderation    → Content moderation
/dashboard/admin/enrollments           → All enrollments
/dashboard/admin/email-templates       → Email template management
/dashboard/admin/global-announcements  → Platform-wide announcements
/dashboard/admin/revenue               → Revenue & financials
/dashboard/admin/teacher-requests      → Teacher application review
/dashboard/admin/testimonials          → Testimonial moderation
/dashboard/admin/create                → Admin account creation

# Teacher
/dashboard/teacher/courses              → My courses
/dashboard/teacher/courses/[id]         → Course overview
/dashboard/teacher/courses/[id]/edit    → Edit course details
/dashboard/teacher/courses/[id]/missions → Manage lessons (DnD reorder)
/dashboard/teacher/courses/[id]/enrollments → Student enrollment view
/dashboard/teacher/courses/[id]/priceRequests → Price history per course
/dashboard/teacher/courses/priceRequests    → All price requests
/dashboard/teacher/cluster              → My clusters
/dashboard/teacher/cluster/manageCluster → Cluster detail & management
/dashboard/teacher/session/manageSession → Session management (all)
/dashboard/teacher/session/create       → Create new session
/dashboard/teacher/session/manageSession/[sessionId] → Session detail
/dashboard/teacher/attendanceTracking   → Attendance by session
/dashboard/teacher/homeworkManagement   → Homework creation & grading
/dashboard/teacher/taskSubmission       → Student submission review
/dashboard/teacher/task-templates       → Task templates
/dashboard/teacher/resource             → Resource library management
/dashboard/teacher/announcement/create  → Create announcement
/dashboard/teacher/studentProgress      → Student progress viewer
/dashboard/teacher/analytics            → Teacher analytics
/dashboard/teacher/session-history      → Past sessions
/dashboard/teacher/notice               → Admin notices

# Student
/dashboard/student/courses              → My enrolled courses
/dashboard/student/courses/[courseId]   → Course content viewer
/dashboard/student/homework             → Homework list
/dashboard/student/progress             → Progress dashboard
/dashboard/student/leaderboard          → Cluster leaderboard
/dashboard/student/certificates         → My certificates
/dashboard/student/cluster/[clusterId]  → Cluster detail
/dashboard/student/resources/all        → Resource library
/dashboard/student/resource-annotation  → Resource annotations
/dashboard/student/study-planner        → Study goals & streaks
/dashboard/student/taskSubmission       → Submit homework
/dashboard/student/paymentHistory       → Payment history
/dashboard/student/notice               → Admin notices
```

---

## API Client

All HTTP communication is centralized in `src/lib/api.ts` using a typed `apiFetch` wrapper that automatically:
- Attaches `credentials: "include"` for cookie-based sessions
- Sets `Content-Type: application/json`
- Throws on non-2xx or `success: false` responses

Exported namespaces:

```ts
courseApi          // Teacher: course CRUD, missions, contents, price requests, enrollments
adminApi           // Admin: course/mission approvals, price requests, revenue, user management
adminPlatformApi   // Admin: analytics, announcements, clusters, moderation, certificates, email templates
adminUsersApi      // Admin: user search, update, deactivate, impersonate
studentApi         // Student: catalog, enrollments, mission progress, payments
settingsApi        // All roles: account, password, 2FA, API keys, sessions, data export
paymentApi         // Stripe: create intent, confirm, sync, status, history
leaderboardApi     // Student: get leaderboard, opt-in/opt-out
studyPlannerApi    // Student: goals CRUD, streak
annotationApi      // Student: resource annotations CRUD + shared view
teacherDashApi     // Teacher: analytics, session history, task templates, clusters
teacherNoticeApi   // Teacher: notices from admin
```

All API requests are proxied through Next.js rewrites:

```ts
// next.config.ts
"/api/auth/:path*" → BACKEND_URL/api/auth/:path*
"/api/:path*"      → BACKEND_URL/api/:path*
```

---

## Authentication

Authentication is powered by **Better Auth** with support for:

| Method | Details |
|---|---|
| **Email / Password** | Full register, login, forgot password, reset password, email verification flow |
| **Google OAuth** | One-click sign-in with Google; handled via `/auth/google` callback |
| **Two-Factor Auth (2FA)** | TOTP-based 2FA — enable, disable, verify via `settingsApi` |
| **Session Management** | View active sessions, revoke individual or all sessions |
| **API Keys** | Generate, list, and revoke personal API keys |

Role-based access is enforced at the **layout level** inside `dashboard/(roleBasedRoute)`. Unauthenticated or unauthorized requests are redirected before rendering.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Server-side
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000

# Client-side (exposed to browser)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:4000

# Stripe (if handling client-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Demo login credentials (optional)
NEXT_PUBLIC_DEMO_STUDENT_EMAIL=student@demo.com
NEXT_PUBLIC_DEMO_STUDENT_PASSWORD=demo1234
NEXT_PUBLIC_DEMO_TEACHER_EMAIL=teacher@demo.com
NEXT_PUBLIC_DEMO_TEACHER_PASSWORD=demo1234
```

> All environment variables are validated at build time using **@t3-oss/env-nextjs** with Zod schemas (`src/env.ts`).

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- A running **Nexora backend** instance

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd nexora_frontend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your backend URL and keys

# 4. Start the development server
npm run dev
```

The application is available at **http://localhost:3000**.

### Build for Production

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

---

## Key Design Patterns

### 1. Unified Refresh Pattern
All dashboard pages use the shared `<RefreshIcon>` component for manual data refresh:

```tsx
import RefreshIcon from "@/components/shared/RefreshIcon";

// Fetch function wrapped in useCallback
const load = useCallback(async () => {
  setLoading(true);
  try { /* fetch data */ }
  finally { setLoading(false); }
}, []);

// In JSX header
<RefreshIcon onClick={load} loading={loading} />
```

This ensures consistent UX — the icon spins during loading and is positioned in the top-right of every page header.

### 2. Role-Based Route Guards
Dashboard routes are protected at the layout level inside `(roleBasedRoute)/`. Each sub-folder (`admin/`, `teacher/`, `student/`) has its own layout that verifies the current user's role and redirects unauthorized access.

### 3. API Proxy Pattern
No API URLs are hardcoded in components. All requests go through the typed `apiFetch` client in `src/lib/api.ts`, which proxies through Next.js rewrites to the backend. This keeps CORS concerns server-side and allows easy backend URL changes.

### 4. Drag-and-Drop Content Ordering
Course mission content reordering uses **@dnd-kit** with `optimistic UI updates` — the order is updated in-state immediately on drag-end, and a `reorderContents` PATCH is sent in the background.

### 5. Ambient Background System
Interactive pages use ambient gradient backgrounds from `src/components/backgrounds/AmbientBg.tsx` (multiple variants: `AmbientBg`, `AmbientBg2`…`AmbientBg6`) to create depth without impacting performance.

---

## Component Architecture

```
components/
├── shared/
│   ├── NavBar.tsx          # Full responsive public navbar with auth state
│   ├── RefreshIcon.tsx     # Reusable spinner/refresh button (used across all dashboard pages)
│   ├── footer.tsx          # Site-wide footer with links and branding
│   └── themeToggleSwitch   # next-themes dark/light toggle
├── ui/                     # Shadcn primitives (Button, Dialog, Select, Toast…)
├── backgrounds/            # AmbientBg variants (CSS-only, zero JS)
├── chat/                   # AI-powered guest & authenticated chat widget
├── courses/                # CourseCard, CatalogGrid, ContentViewer
├── dashboard/              # StatsCard, ActivityFeed, QuickActions
├── home/                   # Hero, Features, Testimonials, Pricing sections
├── profile/                # Avatar upload, profile form
├── app-sidebar.tsx         # Role-aware collapsible sidebar navigation
├── data-table.tsx          # TanStack Table with sorting, filtering, pagination
└── chart-area-interactive.tsx # Recharts area chart with period selector
```

---

## License

This project is part of the **Next Level Web Development** assignment series.  
All rights reserved © 2026 Nexora.
