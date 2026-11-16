# School Study Material Management Portal

A secure, lightweight, and modern web application designed for schools and computer laboratories. Targets **zero monthly hosting costs** by leveraging Cloudflare Pages and Supabase Free Tier.

---

## 1. Overview & Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Lucide Icons (hosted on **Cloudflare Pages**).
- **Backend & Database**: **Supabase** (PostgreSQL, Supabase Auth, Private Storage).
- **Privileged Operations**: **Supabase Edge Functions** (Deno + TypeScript) for teacher provisioning, password rotation, session revocation, and atomic file deletion.
- **Routing**: React Router with SPA fallback redirects (`public/_redirects`).

---

## 2. User Roles & Capabilities

| Feature | Student | Teacher | Administrator |
|---|:---:|:---:|:---:|
| **Authentication** | Common shared lab password | Individual account | Protected master admin |
| **First-Login Force Reset** | No | Yes (enforced by route & DB) | N/A |
| **Browse Materials** | Published only | Own drafts + Published | All materials |
| **Download Materials** | Yes (signed 600s URL) | Yes | Yes |
| **Upload Study Notes** | No | Yes (PDF, DOCX, PPTX &le; 20MB) | Yes |
| **Post Google Forms** | No | Yes (validated domain) | Yes |
| **Rotate Student Password** | No | Yes (&ge; 12 chars + session kill) | Yes |
| **Manage Classes & Subjects**| No | No | Yes |
| **Provision Faculty** | No | No | Yes |
| **Site Announcement & Access**| No | No | Yes |
| **Audit Logs** | No | No | Yes (Immutable) |

---

## 3. Technology Stack

- **React 18**
- **Vite 5**
- **TypeScript 5**
- **Tailwind CSS 3**
- **Supabase JS v2**
- **Vitest** for automated unit and security tests

---

## 4. Setup & Local Development

### Prerequisites
- Node.js 18+ (tested on v26)
- npm or pnpm

### 1. Clone & Install
```bash
git clone <repo-url>
cd SSsalai
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_STUDENT_LOGIN_EMAIL=students@school.example
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

### 5. Run Automated Tests
```bash
npx vitest run
```

---

## 5. Supabase Database & Migrations

All SQL migrations are organized in `supabase/migrations/`:

1. `001_initial_schema.sql`: Core PostgreSQL schema, enums (`app_role`, `content_status`), tables, indexes, and triggers.
2. `002_rls_policies.sql`: Row Level Security policies for all 8 application tables.
3. `003_storage_policies.sql`: Private `study-materials` storage bucket with path-scoped RLS policies.
4. `004_security_hardening.sql`: Schema permissions, search_path isolation, and automated audit trigger hooks.
5. `005_seed_academic_data.sql`: Seed classes (Class 6 - Class 12), common subjects, mappings, and initial site settings.

---

## 6. Supabase Edge Functions

Functions are written in TypeScript for the Deno runtime inside `supabase/functions/`:

- `create-teacher`: Creates auth user, profile record, forces first-login password reset, and logs audit record.
- `update-teacher`: Admin edits teacher metadata or resets temporary password.
- `deactivate-teacher`: Toggles faculty active flag and revokes active sessions.
- `update-student-password`: Allows teachers and admins to update the shared lab password and immediately revokes all active lab sessions.
- `delete-material`: Atomically removes the file from private Supabase Storage and purges database metadata.
