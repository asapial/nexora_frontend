<div align="center">

# Nexora Frontend

**A modern, responsive, role-based learning platform built with Next.js and React**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.7-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Code Style](https://img.shields.io/badge/code_style-ESLint-4B32C3?style=flat-square&logo=eslint)](https://eslint.org/)

</div>

---

## Table of Contents

- [Frontend Overview](#frontend-overview)
- [Key Features](#key-features)
- [Frontend Architecture Flow](#frontend-architecture-flow)
- [Folder Structure](#folder-structure)
- [Technology Stack](#technology-stack)
- [Installation Guide](#installation-guide)
- [Environment Variables](#environment-variables)
- [Running the Frontend Locally](#running-the-frontend-locally)
- [Backend Connection Guide](#backend-connection-guide)
- [Authentication and Protected Routes](#authentication-and-protected-routes)
- [Application Routes](#application-routes)
- [UI/UX Design Principles](#uiux-design-principles)
- [Development Guidelines](#development-guidelines)
- [Future Improvements](#future-improvements)
- [License](#license)

## Frontend Overview

Nexora Frontend is the browser-facing application for the Nexora SaaS learning platform. It is developed and deployed independently from the backend, with a clearly defined API boundary between the two applications.

The frontend is responsible for:

- Rendering the public website, authentication screens, course catalog, and dashboards.
- Providing distinct experiences for administrators, teachers, and students.
- Managing navigation with the Next.js App Router.
- Protecting authenticated and role-specific routes.
- Sending requests to the Nexora Backend API and handling its responses.
- Presenting forms, validation feedback, loading states, notifications, and errors.
- Supporting responsive layouts, light and dark themes, data tables, charts, payments, and accessible UI controls.

The application uses a feature-oriented component structure. Shared primitives live in `src/components/ui`, larger domain components are grouped by feature, and route-specific UI stays near its route under `src/app`.

For a detailed breakdown of Admin, Teacher, and Student capabilities—including cross-role workflow diagrams—see [Role Features and Workflows](./ROLE_FEATURES.md).

## Key Features

- **Modern responsive UI** — layouts adapt across mobile, tablet, laptop, and desktop viewports.
- **Authentication pages** — sign in, registration, email verification, password recovery, password reset, password change, and Google OAuth callback flows.
- **Dashboard interface** — shared dashboard shell with navigation, contextual headers, responsive sidebar, theme support, and role-specific modules.
- **Protected routes** — unauthenticated users are redirected to sign in, while role checks prevent access to another role's dashboard.
- **Backend API integration** — a centralized Fetch wrapper sends typed requests through Next.js API rewrites and includes authentication cookies.
- **Role-based rendering** — navigation items, routes, dashboard cards, and actions are adapted for `ADMIN`, `TEACHER`, and `STUDENT` users.
- **Form validation** — Zod schemas and controlled form state provide predictable validation and clear feedback.
- **Reusable components** — Shadcn/Radix primitives, shared navigation, data tables, cards, dialogs, charts, profile controls, and course components reduce duplication.
- **Scalable project structure** — public routes, shared routes, role-based routes, API logic, components, hooks, providers, types, and utilities have separate responsibilities.
- **Interactive data experiences** — sortable content, drag-and-drop ordering, dashboards, charts, tables, notifications, and payment flows.
- **Theme support** — light and dark appearance powered by `next-themes` and design tokens.

## Frontend Architecture Flow

```text
User Interaction
      |
      v
Page or UI Component
      |
      v
Local React State / Custom Hook / Context
      |
      v
Central API Client (Fetch)
      |
      v
Next.js /api Rewrite
      |
      v
Nexora Backend API
      |
      v
Response and Error Handling
      |
      v
State Update -> Re-render -> User Feedback
```

### Flow explanation

| Stage | Responsibility |
| --- | --- |
| User interaction | The user clicks, types, submits a form, changes a filter, or navigates. |
| UI component | A page or reusable component receives the event and gathers the required data. |
| State management | React state, a custom hook, or a context provider tracks form values and interface state. |
| API call | A function from `src/lib/api.ts` builds and sends the request with cookies and headers. |
| Backend API | The separate Express backend authenticates the request, applies business rules, and queries the database. |
| Response handling | The client parses JSON or files, identifies failures, and normalizes errors. |
| UI update | State is updated and React renders success data, an empty state, a loading indicator, or an error message. |

### Example data request

```tsx
import { studentApi } from "@/lib/api";

const loadCourses = async () => {
  try {
    setLoading(true);
    const response = await studentApi.getEnrollments();
    setCourses(response.data ?? response);
  } catch (error) {
    setError(error instanceof Error ? error.message : "Unable to load courses");
  } finally {
    setLoading(false);
  }
};
```

## Folder Structure

```text
nexora_frontend/
|-- public/                         # Static assets served from the site root
|   `-- logo/                       # Nexora brand assets
|-- src/
|   |-- app/                        # Next.js App Router pages and layouts
|   |   |-- (main)/                 # Public website route group
|   |   |   |-- auth/              # Sign-in, sign-up, verification, recovery
|   |   |   |-- courses/           # Catalog, details, enrollment, payment result
|   |   |   `-- (others)/           # About, pricing, contact, legal, use cases
|   |   |-- dashboard/
|   |   |   |-- (commonRoute)/      # Profile and settings shared by all roles
|   |   |   `-- (roleBasedRoute)/   # Admin, teacher, and student pages
|   |   `-- api/                    # Frontend route handlers where required
|   |-- components/
|   |   |-- ui/                     # Shadcn/Radix UI primitives
|   |   |-- shared/                 # Navigation, footer, theme, common controls
|   |   |-- dashboard/              # Dashboard widgets and navigation pieces
|   |   |-- courses/                # Course catalog and enrollment components
|   |   |-- profile/                # Profile display and editing components
|   |   |-- home/                   # Landing-page sections
|   |   |-- chat/                   # AI chat interface
|   |   `-- backgrounds/            # Dashboard ambient backgrounds
|   |-- config/                     # Application configuration
|   |-- hooks/                      # Reusable React hooks
|   |-- lib/
|   |   |-- api.ts                  # Central API client and endpoint namespaces
|   |   `-- utils.ts                # Shared class-name utility
|   |-- provider/                   # React context providers such as theme
|   |-- services/                   # Server-oriented service abstractions
|   |-- types/                      # Shared TypeScript types
|   |-- utils/                      # General-purpose frontend helpers
|   |-- env.ts                      # Type-safe environment validation
|   `-- proxy.ts                    # Authentication and role route guard
|-- components.json                 # Shadcn component configuration
|-- eslint.config.mjs               # ESLint configuration
|-- next.config.ts                  # Next.js settings and backend rewrites
|-- package.json
|-- postcss.config.mjs
`-- tsconfig.json
```

### Folder responsibilities

| Folder | Purpose |
| --- | --- |
| `components` | Reusable visual building blocks. Keep generic primitives separate from feature-specific components. |
| `app` | Pages, layouts, loading boundaries, route groups, dynamic segments, and route handlers. This project uses App Router rather than the legacy `pages` directory. |
| Layouts | `layout.tsx` files define shared public and dashboard shells without duplicating them on every page. |
| `hooks` | Reusable stateful behavior such as mobile detection and chat interactions. |
| `lib/api.ts` | Central Fetch client and named API groups for authentication, courses, payments, dashboards, and settings. |
| `services` | Higher-level server-aware operations, including session retrieval used by route protection. |
| `provider` | Context-based application providers. The current project includes a theme provider. |
| `utils` | Small pure helpers that can be reused without owning UI or business state. |
| `public` | Static assets such as the Nexora logo and framework icons. Importable component assets may also live near their feature. |
| `types` | Shared interfaces and type aliases used across routes and components. |

## Technology Stack

| Category | Technology | Usage |
| --- | --- | --- |
| Framework | Next.js 16 App Router | Routing, layouts, rendering, rewrites, optimization, and production builds. |
| UI library | React 19 | Component composition, local state, effects, and context. |
| Language | TypeScript 5 | Static types for components, API data, props, and utilities. |
| Styling | Tailwind CSS 4 | Responsive utility styling and design tokens. |
| Components | Shadcn UI and Radix UI | Accessible, composable UI primitives. |
| API communication | Native Fetch API | Cookie-aware communication through a centralized wrapper. |
| Authentication | Better Auth integration | Session handling, credentials, Google OAuth, and protected UI. |
| Validation | Zod 4 | Runtime validation for forms and environment variables. |
| State management | React state, custom hooks, and Context API | Local and shared interface state without a global Redux/Zustand dependency. |
| Tables | TanStack React Table | Sortable and structured dashboard data tables. |
| Charts | Recharts | Analytics and progress visualizations. |
| Payments | Stripe React SDK | Secure course checkout and payment confirmation UI. |
| Drag and drop | DnD Kit | Sortable course and mission content. |
| Themes | next-themes | Light and dark mode. |
| Notifications | Sonner | Toast feedback for user actions. |
| Icons | Lucide, Tabler, and React Icons | Consistent interface iconography. |
| Environment validation | `@t3-oss/env-nextjs` | Type-safe server and public environment variables. |
| Code quality | ESLint with Next.js rules | Static analysis and framework conventions. |

> Axios, React Hook Form, Redux, and Zustand are common alternatives, but they are not current dependencies. Nexora uses Fetch, controlled React state, custom hooks, Context, and Zod.

## Installation Guide

### Prerequisites

- Node.js 20 or newer
- npm
- A running Nexora Backend instance
- A modern browser
- Stripe and ImgBB public credentials for the related features

### 1. Clone the repository

```bash
git clone <repository-url>
cd Nexora/nexora_frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the local environment file

Create `.env.local` in the `nexora_frontend` directory. Use the template in the next section and replace every placeholder with the correct value for your environment.

### 4. Start the backend

The frontend depends on the separate backend service. For local development, start it on `http://localhost:5000` before opening pages that require API data.

### 5. Start the frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file:

```dotenv
# Server-only application URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Values exposed to browser-side code
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
NEXT_PUBLIC_IMGBB_API_KEY=replace_me

# Optional credentials used only by the public demo page
NEXT_PUBLIC_DEMO_TEACHER_EMAIL=teacher@example.com
NEXT_PUBLIC_DEMO_TEACHER_PASSWORD=replace_me
NEXT_PUBLIC_DEMO_STUDENT_EMAIL=student@example.com
NEXT_PUBLIC_DEMO_STUDENT_PASSWORD=replace_me
```

| Variable | Visibility | Required for | Description |
| --- | --- | --- | --- |
| `FRONTEND_URL` | Server | Core configuration | Canonical frontend URL. |
| `BACKEND_URL` | Server | API access | Base URL of the separate backend server. |
| `NEXT_PUBLIC_APP_URL` | Browser | Core configuration | Public frontend URL available to client components. |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Browser | Authentication | Public authentication service URL. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Browser | Paid enrollment | Stripe publishable key; never use the secret key here. |
| `NEXT_PUBLIC_IMGBB_API_KEY` | Browser | Image uploads | Public API key used by profile and course image upload flows. |
| `NEXT_PUBLIC_DEMO_*` | Browser | Demo page | Optional demo credentials displayed or used by the demo experience. |

### Environment safety

- Variables prefixed with `NEXT_PUBLIC_` are included in browser bundles and must be treated as public.
- Never place database URLs, JWT secrets, Stripe secret keys, SMTP credentials, or backend-only API secrets in the frontend environment.
- Keep `.env.local` out of version control.
- Use separate values for development, preview, and production deployments.
- Avoid exposing real reusable passwords as public demo variables; use restricted demo accounts and rotate their credentials.

## Running the Frontend Locally

### Development mode

```bash
npm run dev
```

Starts the Next.js development server with Fast Refresh at `http://localhost:3000`.

### Production build

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

### Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run the local Next.js development server. |
| `npm run build` | Create an optimized production build. |
| `npm run start` | Serve the previously generated production build. |
| `npm run lint` | Analyze the codebase with ESLint. |

## Backend Connection Guide

The frontend and backend are separate applications. The browser normally requests a same-origin frontend path such as `/api/courses`; Next.js then rewrites that request to the backend URL.

```text
Browser
  POST http://localhost:3000/api/auth/login
                         |
                         v
Next.js rewrite from next.config.ts
                         |
                         v
Backend
  POST http://localhost:5000/api/auth/login
```

The relevant rewrite configuration is:

```ts
async rewrites() {
  return [
    {
      source: "/api/auth/:path*",
      destination: `${process.env.BACKEND_URL}/api/auth/:path*`,
    },
    {
      source: "/api/:path*",
      destination: `${process.env.BACKEND_URL}/api/:path*`,
    },
  ];
}
```

### Local connection checklist

1. Run the backend at `http://localhost:5000`.
2. Set `BACKEND_URL=http://localhost:5000` in `.env.local`.
3. Set the backend's allowed frontend origin to `http://localhost:3000`.
4. Ensure backend CORS enables credentials.
5. Use `credentials: "include"` for authenticated Fetch requests.
6. Restart Next.js after changing environment variables or rewrite configuration.
7. Open the browser's Network panel to inspect status codes, redirects, cookies, and response bodies.

### Central API client

`src/lib/api.ts` centralizes backend calls. Its request helper:

- Uses the native Fetch API.
- Sends JSON content headers when appropriate.
- Includes cookies with `credentials: "include"`.
- Parses successful JSON responses.
- Throws useful errors for non-successful HTTP or API responses.
- Groups endpoint functions into feature namespaces such as course, student, payment, settings, admin, and teacher APIs.

New API calls should be added to the relevant namespace instead of scattering raw URLs throughout UI components.

## Authentication and Protected Routes

Route access is controlled in `src/proxy.ts`. The proxy obtains the current session and evaluates authentication, email verification, and role requirements before allowing navigation.

| Condition | Result |
| --- | --- |
| Unauthenticated user opens a protected page | Redirect to `/auth/signin`. |
| Authenticated user has not verified email | Redirect to `/auth/verifyEmail`. |
| Verified user opens the verification page | Redirect to `/dashboard`. |
| Student opens an admin or teacher route | Redirect to `/dashboard`. |
| Teacher opens an admin or student route | Redirect to `/dashboard`. |
| Admin opens a teacher or student route | Redirect to `/dashboard`. |
| User opens the public course catalog or course details | Allow access. |

Frontend guards improve navigation and user experience, but they are not a security boundary. The backend must independently authenticate every protected request and enforce roles and resource ownership.

## Application Routes

### Public and authentication routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing homepage. |
| `/courses` | Public course catalog. |
| `/courses/[id]` | Public course details. |
| `/courses/[id]/enroll` | Protected enrollment and payment flow. |
| `/auth/signin` | Email/password and OAuth sign-in. |
| `/auth/signup` | New account registration. |
| `/auth/verifyEmail` | Email verification. |
| `/auth/forgetPassword` | Password recovery request. |
| `/auth/resetPassword` | Password reset completion. |
| `/about`, `/pricing`, `/contact` | Public informational pages. |
| `/privacyPolicy`, `/termsOfService` | Legal pages. |

### Dashboard areas

| Area | Example capabilities |
| --- | --- |
| Shared | Profile, account settings, sessions, password, two-factor authentication, and API keys. |
| Admin | Analytics, users, approvals, courses, categories, certificates, moderation, enrollments, announcements, email templates, revenue, testimonials, and teacher requests. |
| Teacher | Courses, missions, enrollments, clusters, sessions, attendance, resources, announcements, homework, submissions, templates, progress, notices, and analytics. |
| Student | Enrolled courses, content, homework, progress, clusters, resources, annotations, leaderboard, study planner, certificates, payments, tasks, and notices. |

## UI/UX Design Principles

### 1. Clarity before decoration

Every screen should communicate its purpose, current state, and primary action quickly. Visual effects support content hierarchy rather than compete with it.

### 2. Responsive by default

Components should work from narrow mobile screens upward. Dashboard tables need responsive alternatives, horizontal overflow, or prioritized columns rather than assuming desktop width.

### 3. Consistent design language

Use shared colors, spacing, typography, border radii, shadows, controls, and interaction states. Extend existing Shadcn components before creating one-off primitives.

### 4. Accessible interaction

- Use semantic HTML and descriptive labels.
- Preserve visible keyboard focus.
- Associate validation messages with their fields.
- Provide text alternatives for meaningful images and icons.
- Avoid relying on color alone to communicate status.
- Respect readable contrast in both light and dark themes.
- Ensure dialogs, menus, sidebars, and forms are usable with a keyboard.

### 5. Complete interface states

Data-driven views should define loading, success, empty, error, stale, and unauthorized states. Mutating actions should prevent accidental duplicate submissions and provide immediate feedback.

### 6. Role-aware simplicity

Show users the navigation and actions relevant to their role. Avoid presenting controls that the current user cannot use, while relying on the backend for final authorization.

### 7. Predictable feedback

Use consistent toast messages, inline validation, confirmations for destructive actions, and progress indicators for long-running uploads or API requests.

### 8. Performance-conscious rendering

Prefer server components where browser-only behavior is unnecessary. Keep client component boundaries focused, optimize images, avoid excessive effect-driven fetching, and lazy-load expensive interfaces when useful.

## Development Guidelines

- Prefer TypeScript interfaces and narrow types over `any` for new code.
- Reuse components from `src/components/ui` and `src/components/shared`.
- Keep page files focused on route composition; extract complex UI into feature components.
- Add API operations to `src/lib/api.ts` or a focused service module.
- Keep server-only environment variables out of client components.
- Use route groups for organization without changing public URLs.
- Validate forms before sending requests and display backend validation errors safely.
- Do not treat hidden UI controls as authorization; protect operations on the backend.
- Run linting and a production build before opening a pull request.

## Future Improvements

- Add unit tests for utilities, hooks, and complex components.
- Add integration tests for forms and API response handling.
- Add Playwright end-to-end coverage for authentication, dashboards, enrollment, and role guards.
- Introduce React Hook Form for complex forms if its ergonomics justify the dependency.
- Evaluate TanStack Query for caching, request deduplication, retries, and invalidation.
- Generate API types from an OpenAPI specification to reduce frontend/backend contract drift.
- Add error boundaries, structured client logging, and production error monitoring.
- Add route-level loading skeletons and more consistent empty states.
- Perform a full WCAG accessibility audit and automate common checks.
- Add internationalization and locale-aware date, time, number, and currency formatting.
- Add Storybook or an equivalent component workshop for the design system.
- Add bundle analysis, performance budgets, and Core Web Vitals monitoring.
- Add automated CI checks for linting, types, tests, builds, and dependency security.

## License

No open-source license is currently declared in the frontend package or repository. Unless a `LICENSE` file is added, the source code should be treated as proprietary and all rights reserved.

If the project is intended for open-source distribution, add a license file and update this section with the selected license and copyright holder.

---

<div align="center">

Built for the Nexora SaaS learning platform with Next.js, React, TypeScript, and Tailwind CSS.

</div>
