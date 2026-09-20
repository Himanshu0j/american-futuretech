# American FutureTech ⚡

> **Production-Grade Futuristic EdTech Platform & Enterprise Operations Panel (CMS + CRM + LMS + RBAC + Analytics)**

Built with high-converting dark galactic aesthetic, real-time Recharts visualizations, TanStack Table CRM pipeline, course curriculum composer, cohort capacity scheduler, and role-based access control.

---

## 🚀 Quick Start (Instant Local Run)

### 1. Installation
All dependencies for root, client, and server are pre-installed. If you ever need to re-install:
```bash
npm run install:all
```

### 2. Start Both Client & Server Concurrently
```bash
npm run dev
```
- **Public Landing Page**: `http://localhost:5173/`
- **Enterprise Admin Panel**: `http://localhost:5173/admin/login` (or `/admin/dashboard`)
- **Backend REST API**: `http://localhost:5000/api`

---

## 🔑 Default Credentials

The platform features an instant **One-Click Demo Login** button on the `/admin/login` page:

| Persona | Email | Password | Role Permissions |
| :--- | :--- | :--- | :--- |
| **Alexander Pierce** | `admin@americanfuturetech.com` | `admin123` | **SuperAdmin** (Full control over CRM, CMS, Cohorts, Staff RBAC) |
| **Sarah Jenkins** | `counselor@americanfuturetech.com` | `admin123` | **Counselor** (CRM pipeline, applicant calls, student conversion) |
| **Dr. Marcus Vance** | `instructor@americanfuturetech.com` | `admin123` | **Instructor** (Curriculum review, student roster view) |

---

## 🎨 System Architecture & Design Tokens

### Aesthetic Palette
- **Base Background**: `#070b14` (Deep galactic night black)
- **Card Surface**: `#0f172a` at 80% opacity with `backdrop-blur-xl` and `1px solid rgba(255, 255, 255, 0.08)`
- **Primary Cyan/Sky Glow**: `#0ea5e9` to `#38bdf8` (Brand, Data Science track, primary CTAs)
- **Cyber Rose/Red Glow**: `#f43f5e` to `#e11d48` (Cyber Security track, live indicators, badges)
- **Neon Emerald**: `#10b981` ("Most Popular" pill, success confetti states)
- **Typography**: `Outfit` (Headings) & `Plus Jakarta Sans` (Body)

### Frontend Components (Landing Page)
1. **Sticky Translucent Glass Navbar**: Logo + "AMERICAN FUTURETECH", active nav underlines, and glowing gradient "Apply Now →" button.
2. **Futuristic Hero Showcase**:
   - Left: `⚡ Build In-Demand Skills • Shape Your Future` pill tag, gradient typography, and dual CTAs (`Explore Courses →` & `Talk to Counselor`).
   - Right: 3D-perspective laptop display mockup with live holographic widgets (AI Mentor badge, learning velocity telemetry chart, cyber shield lock box, audio frequency waveform).
3. **Bento Metrics Strip**: 5 horizontal cards (6 Months, Weekend Live Classes, Unlimited Doubt Sessions, Placement Assistance, 200+ Hiring Companies).
4. **Program Selector (Dynamic Bento Cards)**:
   - **Data Science with AI Integration**: Emerald "Most Popular" badge, AI brain hologram, checkmarks, dynamic curriculum accordion, circular cyan apply button.
   - **Cyber Security with Ethical Hacking**: Cyber red theme, holographic padlock shield, checkmarks, dynamic curriculum accordion, circular red apply button.
5. **Why Choose Us Bento Grid**: 4 glowing cards (Live + Recorded Sessions, Flexible Timings, Tests & Practice, Placement Support).
6. **High-Conversion Lead Modal**: Captures applicant data, submits to `/api/leads/apply`, triggers celebratory multi-color confetti, and logs notifications.
7. **Syllabus Modal**: Comprehensive 4-module breakdown with downloadable syllabus brochure simulation.
8. **Call to Action & Footer**: Gradient banner with rocket badge, hiring company ticker (Google Cloud, AWS, Microsoft, CrowdStrike, Palantir, Snowflake), and contact details.

### Enterprise Admin SaaS Panel (`/admin`)
- **Executive Dashboard (`/admin/dashboard`)**:
  - KPI Widgets: Leads Today, Admissions Rate %, Active Batches, Pipeline Revenue.
  - Recharts Funnel: Monthly Lead Funnel (Visits → Enquiries → Calls → Enrolled).
  - Recharts Donut: Course Distribution (AI vs Cyber).
  - Real-time live incoming lead application stream.
- **Lead CRM & Pipeline (`/admin/leads`)**:
  - Filterable by status (New, Contacted, Counseling Scheduled, Enrolled, Lost) and instant search.
  - Slide-over Drawer: complete applicant profile, call note recorder, outcome logger, follow-up calendar date setter, and 1-click **Convert to Student** action.
  - 1-Click CSV export.
- **Course & Curriculum CMS (`/admin/courses`)**:
  - Full CRUD operations.
  - Visual Curriculum Composer (modules, hours, and topics array).
  - Instant live badge switcher ("Most Popular", "Filling Fast", "High Demand").
- **Batch & Seat Manager (`/admin/batches`)**:
  - Cohort schedule planner, start dates, and max seat limits.
  - Seat count dynamically powers frontend urgency copy.
- **Students & Fees Directory (`/admin/students`)**:
  - Confirmed student roster, payment status management (Paid, Partial, Pending), and **Dynamic Printable PDF Invoice Generator**.
- **Staff & RBAC (`/admin/users`)**:
  - Granular role management (SuperAdmin, Counselor, Instructor) and active toggles.

---

## 🔌 REST API Endpoints

### Authentication & RBAC
- `POST /api/auth/login`: Authenticate staff and return JWT.
- `GET /api/auth/me`: Current authenticated user profile.
- `GET /api/auth/users`: List all staff (SuperAdmin).
- `POST /api/auth/users`: Create staff member (SuperAdmin).
- `PUT /api/auth/users/:id`: Update role/active state (SuperAdmin).

### Courses (Public & CMS)
- `GET /api/courses`: Published courses for landing page.
- `GET /api/courses/admin/all`: All courses for CMS.
- `POST /api/courses`: Create new course track.
- `PUT /api/courses/:id`: Update course and curriculum modules.
- `PATCH /api/courses/:id/badge`: Fast toggle badge or publish status.
- `DELETE /api/courses/:id`: Remove course.

### Leads & CRM Pipeline
- `POST /api/leads/apply`: Public student application (rate-limited, email triggered).
- `GET /api/leads`: Search, filter by status, date range, pagination.
- `GET /api/leads/export/csv`: 1-Click CSV export.
- `POST /api/leads/:id/call-logs`: Log counselor call notes and outcomes.
- `POST /api/leads/:id/convert`: Convert lead to confirmed student in active cohort.

### Cohorts & Batches
- `GET /api/batches`: List all batches and enrollment metrics.
- `GET /api/batches/urgency`: Seat scarcity data for landing page.
- `POST /api/batches`: Schedule new cohort.
- `PUT /api/batches/:id`: Update batch capacity/schedule.
- `DELETE /api/batches/:id`: Remove batch.

### Students & Dynamic Invoicing
- `GET /api/students`: Roster of all enrolled students across batches.
- `PATCH /api/students/:batchId/:studentId/payment`: Update tuition fee status.
- `GET /api/students/:invoiceId/invoice`: Dynamic branded invoice data.

### Executive Analytics
- `GET /api/analytics/dashboard`: KPI metrics, conversion funnel, donut distribution, and live lead stream.

---

## 🛡️ Database & Zero-Config Setup
- **Dual Database Strategy**: Supports MongoDB Atlas via `MONGODB_URI` in `.env`. If no external URI is provided, it automatically boots up an in-memory embedded MongoDB engine with zero downtime and automatic seeding on initial boot.
