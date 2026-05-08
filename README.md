# Payout Management MVP

A full-stack payout management system with role-based access control, vendor management, payout workflows, and audit trails.

## Tech Stack

- **Frontend & Backend:** Next.js 14 (App Router + API Routes)
- **Database:** MongoDB Atlas
- **Auth:** JWT (bcrypt for password hashing)
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## Quick Start (< 5 minutes)

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)

### 1. Clone & Install

```bash
git clone <repo-url>
cd payout-management
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your MongoDB Atlas connection string:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/payout-management?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
```

### 3. Seed the Database

```bash
npm run seed
```

This creates:
- 2 users (OPS + FINANCE)
- 3 sample vendors

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Credentials

| Role    | Email              | Password |
|---------|-------------------|----------|
| OPS     | ops@demo.com      | ops123   |
| FINANCE | finance@demo.com  | fin123   |

## Features

- **Login** — JWT-based auth with server-side role enforcement
- **Vendors** — List and create vendors
- **Payouts** — Create, submit, approve/reject with proper status transitions
- **Filters** — Filter payouts by status and vendor
- **Audit Trail** — Full history of actions on each payout
- **RBAC** — OPS creates/submits, FINANCE approves/rejects (enforced server-side)

## API Endpoints

| Method | Endpoint                  | Description          | Access    |
|--------|--------------------------|----------------------|-----------|
| POST   | /api/auth/login          | Login                | Public    |
| GET    | /api/vendors             | List vendors         | Auth      |
| POST   | /api/vendors             | Create vendor        | Auth      |
| GET    | /api/payouts             | List payouts         | Auth      |
| POST   | /api/payouts             | Create payout        | OPS       |
| GET    | /api/payouts/:id         | Payout detail        | Auth      |
| POST   | /api/payouts/:id/submit  | Submit payout        | OPS       |
| POST   | /api/payouts/:id/approve | Approve payout       | FINANCE   |
| POST   | /api/payouts/:id/reject  | Reject payout        | FINANCE   |

## Assumptions

- Passwords are hashed with bcrypt (not stored in plain text)
- JWT tokens expire after 24 hours
- Only active vendors can receive payouts
- Status transitions are strictly enforced (no skipping states)
- Both roles can view all payouts, but actions are role-restricted
- Vendor creation is available to both roles

## Deployment

Deploy to Vercel:

```bash
npm i -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `MONGODB_URI`
- `JWT_SECRET`
# payout-management-task
