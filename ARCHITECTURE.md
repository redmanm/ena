# ENA Visitor Management System - Architecture Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    React Components                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │  │
│  │  │   Login      │  │   Dashboard  │  │   Sidebar    │           │  │
│  │  │   Page       │  │   Page       │  │              │           │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │  │
│  │         ↓                ↓                    ↓                  │  │
│  │  ┌──────────────────────────────────────────────────────┐       │  │
│  │  │            React Context Providers                   │       │  │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │       │  │
│  │  │  │ Language     │  │ Auth         │  │ Visitor    │ │       │  │
│  │  │  │ Provider     │  │ Provider     │  │ Provider   │ │       │  │
│  │  │  └──────────────┘  └──────────────┘  └────────────┘ │       │  │
│  │  └──────────────────────────────────────────────────────┘       │  │
│  │         ↓                ↓                    ↓                  │  │
│  │  ┌──────────────────────────────────────────────────────┐       │  │
│  │  │         Hooks (useLanguage, useAuth, etc)           │       │  │
│  │  └──────────────────────────────────────────────────────┘       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              ↓                                          │
│                    [HTTP/REST API Calls]                               │
└─────────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER (Node.js)                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    API Routes (/api/*)                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │  │
│  │  │  auth/login  │  │ users/*      │  │ visitors/*   │           │  │
│  │  │  route.ts    │  │  route.ts    │  │  route.ts    │           │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │  │
│  │         ↓                ↓                    ↓                  │  │
│  │  ┌──────────────────────────────────────────────────────┐       │  │
│  │  │        Middleware & Authentication                  │       │  │
│  │  │  • JWT Verification                                │       │  │
│  │  │  • Session Management                             │       │  │
│  │  │  • Permission Checking                            │       │  │
│  │  └──────────────────────────────────────────────────────┘       │  │
│  │         ↓                                                       │  │
│  │  ┌──────────────────────────────────────────────────────┐       │  │
│  │  │         Business Logic Layer                        │       │  │
│  │  │  • User Authentication                            │       │  │
│  │  │  • Visitor Management                             │       │  │
│  │  │  • Appointment Handling                           │       │  │
│  │  │  • Audit Logging                                  │       │  │
│  │  └──────────────────────────────────────────────────────┘       │  │
│  │         ↓                                                       │  │
│  │  ┌──────────────────────────────────────────────────────┐       │  │
│  │  │        Data Access Layer                           │       │  │
│  │  │  • Database Connection (lib/db.ts)                │       │  │
│  │  │  • Query Builders                                 │       │  │
│  │  │  • Transaction Management                         │       │  │
│  │  └──────────────────────────────────────────────────────┘       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              ↓                                          │
│                    [SQL Queries / Parameterized]                       │
└─────────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              NEON POSTGRESQL DATABASE                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Database Tables                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │  │
│  │  │ users        │  │ visitors     │  │ appointments │           │  │
│  │  │              │  │              │  │              │           │  │
│  │  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │           │  │
│  │  │ email        │  │ name         │  │ visitor_id   │           │  │
│  │  │ password     │  │ email        │  │ user_id      │           │  │
│  │  │ role         │  │ phone        │  │ date_time    │           │  │
│  │  │ department   │  │ company      │  │ status       │           │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │  │
│  │                                                                  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │  │
│  │  │ departments  │  │ audit_logs   │  │ notifications│           │  │
│  │  │              │  │              │  │              │           │  │
│  │  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │           │  │
│  │  │ name         │  │ user_id (FK) │  │ user_id (FK) │           │  │
│  │  │ manager      │  │ action       │  │ message      │           │  │
│  │  │ description  │  │ timestamp    │  │ read_at      │           │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │  │
│  │                                                                  │  │
│  │  ┌──────────────────────────────────────────────────────┐       │  │
│  │  │           Indexes & Constraints                      │       │  │
│  │  │  • Primary Keys (PK)                               │       │  │
│  │  │  • Foreign Keys (FK)                               │       │  │
│  │  │  • Unique Constraints (email, etc)                 │       │  │
│  │  │  • Check Constraints (status values)               │       │  │
│  │  │  • Timestamps (created_at, updated_at)            │       │  │
│  │  └──────────────────────────────────────────────────────┘       │  │
│  │                                                                  │  │
│  │  ┌──────────────────────────────────────────────────────┐       │  │
│  │  │      Security Features (Row-Level Security)          │       │  │
│  │  │  • User can only see own visitor records            │       │  │
│  │  │  • Manager can see department data                  │       │  │
│  │  │  • Admin can see all data                           │       │  │
│  │  └──────────────────────────────────────────────────────┘       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                 ↕
                    [SSL/TLS Encrypted Connection]
                    [Neon Serverless Architecture]
```

## Component Hierarchy

```
RootLayout
  ↓
├─ LanguageProvider (NEW)
│  ├─ AuthProvider
│  │  ├─ VisitorProvider
│  │  │  ├─ Header (with LanguageSwitcher)
│  │  │  ├─ Sidebar
│  │  │  └─ Main Content
│  │  │     ├─ (auth) Routes
│  │  │     │  └─ LoginPage
│  │  │     │     └─ LoginContent (client component)
│  │  │     └─ (app) Routes
│  │  │        ├─ DashboardPage
│  │  │        ├─ AppointmentsPage
│  │  │        ├─ UsersPage
│  │  │        └─ DepartmentsPage
│  │  └─ Toaster
```

## Internationalization (i18n) Flow

```
┌─────────────────────────────┐
│    Browser / App Start       │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│  LanguageProvider (lib/language-context.tsx)        │
│                                                     │
│  1. Check localStorage for saved language          │
│  2. If not found, detect browser language          │
│  3. Check timezone (Ethiopia → Amharic)            │
│  4. Default to English                             │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│  Load Translation File                              │
│  • locales/en.json → English translations          │
│  • locales/am.json → Amharic translations          │
│                                                     │
│  139 translation keys organized by:                │
│  • header.*       - Header text                    │
│  • sidebar.*      - Menu items                     │
│  • login.*        - Login form                     │
│  • dashboard.*    - Dashboard content              │
│  • common.*       - Shared UI elements             │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│  useLanguage() Hook Usage in Components             │
│                                                     │
│  const { t, lang, setLanguage } = useLanguage()   │
│                                                     │
│  • t() - Translation function                      │
│  • lang - Current language code (en/am)            │
│  • setLanguage() - Change language                 │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│  Render Components with Translated Text             │
│                                                     │
│  <h1>{t('header.title')}</h1>                     │
│  → "ENA Visitor Management System" (en)           │
│  → "ENA ጎብኚ ማስተዳደር ስርዓት" (am)                   │
│                                                     │
│  HTML lang attribute updated:                      │
│  <html lang="en"> or <html lang="am">             │
│                                                     │
│  Font switched (if Amharic):                       │
│  font-family: 'Noto Serif Ethiopic', serif        │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│  User Switches Language                             │
│  (via LanguageSwitcher component)                  │
│                                                     │
│  1. Click language button                          │
│  2. Call setLanguage('am' or 'en')                │
│  3. Save to localStorage                           │
│  4. Update state                                   │
│  5. Re-render with new translations               │
│  6. No page reload needed!                        │
└─────────────────────────────────────────────────────┘
```

## Authentication & Session Flow

```
┌──────────────────┐
│  User Login      │
│  (LoginPage)     │
└────────┬─────────┘
         ↓
┌──────────────────────────────────┐
│  POST /api/auth/login            │
│  • Email                         │
│  • Password                      │
└────────┬─────────────────────────┘
         ↓
┌──────────────────────────────────┐
│  Server-Side Authentication      │
│  1. Hash password check (bcrypt) │
│  2. Generate JWT token          │
│  3. Create session               │
│  4. Set HTTP-only cookie        │
└────────┬─────────────────────────┘
         ↓
┌──────────────────────────────────┐
│  Return Response                 │
│  • User data                     │
│  • Session cookie               │
│  • Success status               │
└────────┬─────────────────────────┘
         ↓
┌──────────────────────────────────┐
│  Client-Side Processing         │
│  1. Store in AuthContext        │
│  2. Redirect to dashboard       │
└────────┬─────────────────────────┘
         ↓
┌──────────────────────────────────┐
│  Authenticated Requests          │
│  All API calls include:          │
│  • Cookie (session)              │
│  • JWT in Authorization header   │
└────────┬─────────────────────────┘
         ↓
┌──────────────────────────────────┐
│  Session Timeout                 │
│  • Warn after 5 hours           │
│  • Logout after 6 hours         │
└──────────────────────────────────┘
```

## Data Flow Example: User Login

```
1. User Interface Layer
   ┌─────────────────────┐
   │  LoginContent.tsx   │
   │  • Email input      │
   │  • Password input   │
   │  • Submit button    │
   └────────┬────────────┘

2. Business Logic Layer
   ↓
   ┌─────────────────────────────────┐
   │  handleSubmit() Function         │
   │  • Validate inputs              │
   │  • Call login() from useAuth()   │
   │  • Handle errors                │
   └────────┬────────────────────────┘

3. API Request Layer
   ↓
   ┌─────────────────────────────────┐
   │  POST /api/auth/login           │
   │  Body: { email, password }      │
   └────────┬────────────────────────┘

4. Server Processing
   ↓
   ┌─────────────────────────────────┐
   │  API Route Handler              │
   │  1. Parse request               │
   │  2. Validate email format       │
   │  3. Query database for user     │
   │  4. Compare passwords (bcrypt)  │
   │  5. Generate JWT token         │
   │  6. Create session              │
   │  7. Return user data            │
   └────────┬────────────────────────┘

5. Database Layer
   ↓
   ┌─────────────────────────────────┐
   │  PostgreSQL Query               │
   │  SELECT * FROM users            │
   │  WHERE email = $1               │
   └────────┬────────────────────────┘

6. Database Response
   ↓
   ┌─────────────────────────────────┐
   │  User Record                    │
   │  {                              │
   │    id: 1,                       │
   │    email: "user@example.com",   │
   │    password_hash: "...",        │
   │    role: "manager",             │
   │    department_id: 5             │
   │  }                              │
   └────────┬────────────────────────┘

7. Client Response
   ↓
   ┌─────────────────────────────────┐
   │  API Response                   │
   │  {                              │
   │    user: {...},                 │
   │    token: "jwt...",             │
   │    success: true                │
   │  }                              │
   │  + Set-Cookie header            │
   └────────┬────────────────────────┘

8. Client-Side Update
   ↓
   ┌─────────────────────────────────┐
   │  Update AuthContext             │
   │  • Set user data                │
   │  • Store token (if needed)      │
   │  • Mark as authenticated        │
   └────────┬────────────────────────┘

9. Navigation
   ↓
   ┌─────────────────────────────────┐
   │  Redirect to Dashboard          │
   │  window.location.assign(path)   │
   └─────────────────────────────────┘
```

## File Organization Strategy

### By Feature
```
/app
  /(auth)          - Authentication pages
    /login
    /register      (future)
    /reset         (future)
  /(app)           - Protected pages
    /dashboard
    /appointments
    /users
    /departments

/components
  /ui              - Reusable UI components
  /auth            - Auth-related components
  /layout          - Layout components

/lib
  /db              - Database utilities
  /auth            - Auth utilities
  /api             - API helpers
  /utils           - General utilities

/locales
  /en.json         - English translations
  /am.json         - Amharic translations
```

### By Layer
```
Frontend (Client)
  ├─ Pages (React components)
  ├─ Components (Reusable UI)
  ├─ Hooks (React hooks)
  └─ Styles (CSS/Tailwind)

Backend (Server)
  ├─ API Routes (Next.js)
  ├─ Middleware (Authentication)
  ├─ Business Logic
  └─ Database Layer

Data Layer
  ├─ PostgreSQL (Neon)
  ├─ Schemas
  └─ Migrations
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  SECURITY LAYERS                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. TRANSPORT SECURITY                                 │
│     • HTTPS/TLS for all connections                   │
│     • SSL/TLS for database connections                │
│     • Secure cookies (HttpOnly, Secure flags)         │
│                                                         │
│  2. AUTHENTICATION                                     │
│     • JWT tokens for stateless auth                   │
│     • Bcrypt password hashing (10 salt rounds)        │
│     • Secure session management                       │
│                                                         │
│  3. INPUT VALIDATION                                   │
│     • Email format validation                         │
│     • Password strength requirements                  │
│     • Parameterized SQL queries                       │
│     • Input sanitization                              │
│                                                         │
│  4. AUTHORIZATION                                      │
│     • Role-based access control (RBAC)               │
│     • Row-level security (RLS) in database           │
│     • Protected API routes                            │
│     • Permission checking middleware                  │
│                                                         │
│  5. DATA PROTECTION                                    │
│     • Encrypted database connections                 │
│     • Session isolation                               │
│     • Audit logging for all actions                  │
│     • Soft deletes (if needed)                       │
│                                                         │
│  6. ERROR HANDLING                                     │
│     • Generic error messages to users                │
│     • Detailed logging for debugging                 │
│     • No sensitive info in error responses           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture (Vercel)

```
┌───────────────────────────────────────┐
│      GitHub Repository                │
│      (Source code)                    │
└──────────────┬────────────────────────┘
               ↓
┌───────────────────────────────────────┐
│      Git Push → main branch           │
└──────────────┬────────────────────────┘
               ↓
┌───────────────────────────────────────┐
│      Vercel Deployment                │
│                                       │
│  1. Detect Next.js project           │
│  2. Install dependencies             │
│  3. Run build                        │
│  4. Test                             │
│  5. Deploy                           │
└──────────────┬────────────────────────┘
               ↓
┌───────────────────────────────────────┐
│      Production Environment           │
│                                       │
│  • Vercel Edge Network               │
│  • Automatic SSL/TLS                 │
│  • CDN for static assets             │
│  • Serverless functions (API routes) │
│  • Environment variables from Vercel │
└──────────────┬────────────────────────┘
               ↓
┌───────────────────────────────────────┐
│      Connected Services               │
│                                       │
│  • Neon PostgreSQL (Database)        │
│  • Email service (optional)          │
│  • Monitoring service (optional)     │
└───────────────────────────────────────┘
```

---

**Architecture Version**: 1.0
**Last Updated**: 5/6/2026
**Framework**: Next.js 15.5.15
**Database**: Neon PostgreSQL
**Hosting**: Vercel
