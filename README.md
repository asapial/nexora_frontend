<p align="center">
  <img src="https://img.shields.io/badge/Nexora-Learning%20Platform-14b8a6?style=for-the-badge&logo=bookstack&logoColor=white" alt="Nexora" />
</p>

<h1 align="center">Nexora — Frontend</h1>

<p align="center">
  <strong>A premium, full-stack Learning Management System built with Next.js 16</strong><br/>
  Role-based dashboards · Stripe payments · Real-time analytics · Dark mode
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4.x-38B2AC?logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white" alt="Stripe" />
</p>

---

## 🌐 Live Demo

| Service  | URL                                      |
| -------- | ---------------------------------------- |
| Frontend | [nexorafrontend-one.vercel.app](https://nexorafrontend-one.vercel.app) |
| Backend  | [nexora-backend-rust.vercel.app](https://nexora-backend-rust.vercel.app) |



---

## ✨ Features

### 🏠 Public-Facing Pages
- **Landing page** with Hero, Courses, Features, How It Works, Testimonials, FAQ & CTA sections
- **Course catalog** with public course detail pages & free enrollment
- **Stripe-powered checkout** for paid courses with real-time payment sync
- **Google OAuth** & email/password authentication via Better Auth
- **Email verification** with 6-digit OTP flow & resend cooldown
- **Password recovery** — forget password → OTP verify → reset flow
- **Static pages** — About, Contact, Pricing, Privacy Policy, Terms of Service

### 📊 Role-Based Dashboards

| Feature | Student | Teacher | Admin |
|---------|:-------:|:-------:|:-----:|
| Personalized dashboard with animated stats | ✅ | ✅ | ✅ |
| Time-of-day ambient backgrounds | ✅ | ✅ | ✅ |
| Profile & settings management | ✅ | ✅ | ✅ |
| Course browsing & enrollment | ✅ | — | — |
| Mission progress tracking | ✅ | — | — |
| Leaderboard & opt-in/opt-out | ✅ | — | — |
| Study planner with streaks | ✅ | — | — |
| Resource annotations (highlights/notes) | ✅ | — | — |
| Payment history | ✅ | — | — |
| Homework submissions | ✅ | — | — |
| Course creation & management | — | ✅ | — |
| Mission & content builder (drag-and-drop) | — | ✅ | — |
| Student progress & analytics | — | ✅ | — |
| Earnings & revenue tracking | — | ✅ | — |
| Session history & task templates | — | ✅ | — |
| Announcement & notice board | — | ✅ | — |
| Platform-wide analytics | — | — | ✅ |
| Course/mission approvals | — | — | ✅ |
| Price request approvals | — | — | ✅ |
| User management (create/deactivate/impersonate) | — | — | ✅ |
| Global announcements & personal notices | — | — | ✅ |
| Content moderation | — | — | ✅ |
| Certificate generation | — | — | ✅ |
| Email template management | — | — | ✅ |
| Revenue & enrollment oversight | — | — | ✅ |

### 🎨 UI/UX
- **Dark/Light/System theme** with smooth transitions
- **Glassmorphism cards** with animated shimmer effects
- **Ambient backgrounds** that change with the time of day (6 variants)
- **Skeleton loading** states across all data-driven pages
- **Sonner toast notifications** for all user actions
- **Fully responsive** — mobile, tablet, and desktop
- **ShadCN UI** component library with Radix primitives

---

## 🛠 Tech Stack

| Layer         | Technology                                     |
| ------------- | ---------------------------------------------- |
| Framework     | **Next.js 16** (App Router, Server Components) |
| Language      | **TypeScript 5**                               |
| UI Library    | **React 19**                                   |
| Styling       | **Tailwind CSS 4** + ShadCN UI + Radix UI      |
| State         | React hooks (`useState`, `useCallback`, `useEffect`) |
| Charts        | **Recharts** (Area, Bar, Pie, Radial)          |
| Payments      | **Stripe** (Elements, Payment Intents)         |
| Auth          | **Better Auth** (session-based, Google OAuth)  |
| Forms         | **Zod** validation                             |
| Drag & Drop   | **@dnd-kit** (sortable, modifiers)             |
| Data Tables   | **@tanstack/react-table**                      |
| Icons         | **React Icons** + **Lucide** + **Tabler Icons**|
| Notifications | **Sonner** toasts                              |
| Fonts         | Google Fonts (Inter, Geist, Geist Mono)        |
| Environment   | **@t3-oss/env-nextjs** with Zod validation     |
| Deployment    | **Vercel**                                     |

---

## 📁 Project Structure

```
nexora_frontend/
├── public/                     # Static assets
├── src/
│   ├── app/
│   │   ├── (main)/             # Public-facing routes
│   │   │   ├── auth/           # Sign in, Sign up, Verify Email, etc.
│   │   │   │   ├── signin/
│   │   │   │   ├── signup/
│   │   │   │   ├── verifyEmail/
│   │   │   │   ├── forgetPassword/
│   │   │   │   ├── resetPassword/
│   │   │   │   ├── changePassword/
│   │   │   │   └── google/
│   │   │   ├── courses/        # Public course catalog & detail
│   │   │   ├── (others)/       # About, Contact, Pricing, etc.
│   │   │   ├── layout.tsx      # Public layout (NavBar + Footer)
│   │   │   └── page.tsx        # Landing page
│   │   ├── dashboard/
│   │   │   ├── (commonRoute)/  # Profile, Settings (all roles)
│   │   │   ├── (roleBasedRoute)/
│   │   │   │   ├── admin/      # 13 admin sub-pages
│   │   │   │   ├── teacher/    # 14 teacher sub-pages
│   │   │   │   └── student/    # 11 student sub-pages
│   │   │   ├── layout.tsx      # Dashboard layout (Sidebar + Ambient BG)
│   │   │   └── page.tsx        # Main dashboard with role-specific widgets
│   │   ├── api/auth/           # Next.js API routes (token handling)
│   │   ├── globals.css         # Tailwind + ShadCN theme tokens
│   │   ├── layout.tsx          # Root layout (fonts, providers)
│   │   ├── loading.tsx         # Global loading skeleton
│   │   └── not-found.tsx       # Custom 404 page
│   ├── components/
│   │   ├── home/               # Landing page sections (9 components)
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── courses/            # Course cards, listings
│   │   ├── backgrounds/        # 6 ambient background variants
│   │   ├── shared/             # NavBar, Footer, reusable elements
│   │   ├── ui/                 # ShadCN primitives (Button, Dialog, etc.)
│   │   └── ...                 # Sidebar, navigation, data-table, etc.
│   ├── services/
│   │   └── user.service.ts     # Server-side session fetcher
│   ├── lib/
│   │   ├── api.ts              # Centralized API client (all endpoints)
│   │   └── utils.ts            # cn() helper
│   ├── hooks/
│   │   └── use-mobile.ts       # Responsive breakpoint hook
│   ├── provider/
│   │   └── theme-provider.tsx  # next-themes wrapper
│   ├── types/
│   │   └── course.type.ts      # TypeScript interfaces
│   ├── utils/                  # Utility components & helpers
│   ├── config/env.ts           # Environment config (legacy)
│   ├── env.ts                  # @t3-oss/env-nextjs setup
│   └── proxy.ts                # Route-protection middleware
├── .env                        # Environment variables
├── next.config.ts              # Rewrites (API proxy to backend)
├── package.json
├── tsconfig.json
└── components.json             # ShadCN CLI configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- A running instance of the [Nexora Backend](https://nexora-backend-rust.vercel.app)

### 1. Install dependencies

```bash
cd nexora_frontend
npm install
```

### 2. Setup environment variables

Create a `.env` file in the project root:

```env
# Server-side
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Client-side (browser-safe)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
NEXT_PUBLIC_IMGBB_API_KEY=your_imgbb_api_key
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for production

```bash
npm run build
npm start
```

---

## 🧠 Key Concepts / Architecture

### API Proxy Pattern
All frontend API calls hit `/api/*` routes which are **rewritten** by `next.config.ts` to the backend server. This avoids CORS issues and keeps the backend URL private.

```
Browser → /api/auth/me → next.config.ts rewrite → BACKEND_URL/api/auth/me
```

### Route Protection (proxy.ts)
The `proxy.ts` middleware runs before every matched route and enforces:
1. **Authentication** — unauthenticated users are redirected to `/auth/signin`
2. **Email verification** — unverified users are forced to `/auth/verifyEmail`
3. **Role-based access** — students can't access admin/teacher routes and vice versa

### Session Management
- Sessions are fetched server-side via `userService.getSession()` which reads cookies and calls the backend `/api/auth/me` endpoint
- Client-side components fetch the session via `fetch("/api/auth/me", { credentials: "include" })`
- JWT tokens are stored as HTTP-only cookies set by the backend

### Centralized API Client (`lib/api.ts`)
A single `apiFetch<T>()` wrapper handles all API communication with:
- Automatic credential forwarding
- Type-safe response parsing
- Unified error handling
- Query string builder for filtered endpoints

### Component Architecture
- **Server Components** for static/SEO pages (landing, course catalog)
- **Client Components** (`"use client"`) for interactive dashboards
- **Skeleton loading** patterns for all async data
- **Role-conditional rendering** in shared layouts (sidebar, dashboard)

---

## ⚡ Performance & Optimization

| Technique | Implementation |
|-----------|---------------|
| **API Proxy** | `next.config.ts` rewrites eliminate CORS overhead |
| **No-store fetch** | Session checks use `cache: "no-store"` for real-time auth |
| **Code splitting** | Next.js App Router auto-splits per route segment |
| **Font optimization** | Google Fonts loaded via `next/font` (zero CLS) |
| **Image optimization** | Next.js `<Image>` component with lazy loading |
| **Bundle analysis** | Tree-shaking via ES modules + React Compiler (babel plugin) |
| **Skeleton UIs** | Instant perceived loading for all data-heavy pages |
| **Ambient BG caching** | Background components switch on a 60s interval, not per-render |
| **Debounced interactions** | Search, filter, and form inputs are debounced where needed |

---

## 👤 Author

**Md Abu Syeed Abdullah**

- 📧 Email: [abusyeed2001@gmail.com](mailto:abusyeed2001@gmail.com)
- 🔗 GitHub: [github.com/asapial](https://github.com/asapial)

---

<p align="center">
  Built with ❤️ using Next.js, TypeScript & Tailwind CSS
</p>
