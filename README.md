# IntelliHire

IntelliHire is a full-stack, microservices-based job platform for **job seekers** and **recruiters**. It combines job discovery, profile management, recruiter workflows, AI-assisted career tooling, and paid subscriptions.

At a high level:
- The **frontend** is built with Next.js (App Router).
- The backend is split into independent **Node.js/Express + TypeScript services**.
- Data is stored in **PostgreSQL (Neon driver)**.
- Async email workflows are handled through **Kafka**.
- File assets are uploaded to **Cloudinary**.
- Payments are handled through **Razorpay**.
- AI features (career guide + resume ATS analyzer) use **Google Gemini**.

---

## Table of Contents

- [Project Architecture](#project-architecture)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Services and Ports](#services-and-ports)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Running with Docker](#running-with-docker)
- [API Overview](#api-overview)
- [Authentication Flow](#authentication-flow)
- [Event-Driven Email Flow (Kafka)](#event-driven-email-flow-kafka)
- [AI Features](#ai-features)
- [Payment & Subscription Flow](#payment--subscription-flow)
- [Database Notes](#database-notes)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)

---

## Project Architecture

IntelliHire follows a service-oriented design. Each backend service owns a focused domain:

1. **Auth Service** (`services/auth`)
   - Registration/login.
   - Password reset token issuance.
   - Publishes email tasks to Kafka.
   - Initializes `users`, `skills`, and `user_skills` DB entities.

2. **User Service** (`services/user`)
   - Profile read/update.
   - Resume/profile image updates.
   - Skill add/remove.
   - Job applications for jobseekers.

3. **Job Service** (`services/job`)
   - Company CRUD for recruiters.
   - Job posting and updates.
   - Job listing/filtering and details.
   - Application review/status updates.
   - Publishes status emails to Kafka.

4. **Payment Service** (`services/payment`)
   - Razorpay checkout creation.
   - Signature verification.
   - Subscription activation (30 days).

5. **Utils Service** (`services/utils`)
   - Cloudinary upload endpoint.
   - Kafka consumer for sending emails via SMTP.
   - AI endpoints (career guidance + ATS resume analysis).

6. **Frontend** (`frontend`)
   - Next.js UI for users and recruiters.
   - Client-side API orchestration with shared app context.

---

## Core Features

### For Job Seekers
- Register/login with JWT auth.
- Create and maintain profile.
- Upload and update resume.
- Add/remove skills.
- Browse and filter active jobs.
- One-click apply to jobs.
- Track applied jobs.
- Use AI career guidance.
- Use AI ATS resume analysis.

### For Recruiters
- Register/login as recruiter.
- Create and manage company profiles.
- Post, update, and close jobs.
- View applicants per job.
- Update application status (Submitted/Rejected/Hired).

### Platform Features
- Password reset with tokenized email flow.
- Kafka-based asynchronous email processing.
- Cloudinary file storage.
- Razorpay subscription flow.
- Centralized CORS + JSON API design.

---

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix/shadcn UI
- Axios + js-cookie

### Backend
- Node.js + Express 5
- TypeScript
- PostgreSQL (via `@neondatabase/serverless`)
- JWT auth
- Multer (file uploads)
- KafkaJS
- Redis (password reset token cache)
- Nodemailer
- Cloudinary
- Razorpay

### AI
- `@google/genai` with Gemini model integration

---

## Repository Structure

```text
IntelliHire/
├── frontend/
│   ├── src/app/                # Next.js app routes
│   ├── src/components/         # UI + feature components
│   ├── src/context/            # Shared app context/state/actions
│   └── example-env             # Frontend env template
├── services/
│   ├── auth/                   # Auth + password reset publisher
│   ├── user/                   # User profile + applications
│   ├── job/                    # Company, jobs, applications
│   ├── payment/                # Razorpay checkout/verify
│   └── utils/                  # Upload + mail consumer + AI tools
└── package.json                # Root dependency stub
```

---

## Services and Ports

Default local ports from the provided env samples:

- Frontend: `3000`
- Auth service: `5000`
- Utils service: `5001`
- User service: `5002`
- Job service: `5003`
- Payment service: `5004`

---

## Prerequisites

Install and configure the following before running locally:

- Node.js 22+
- npm 10+
- PostgreSQL-compatible DB URL(s) (Neon or equivalent)
- Kafka broker (default expected: `localhost:9092`)
- Redis instance
- Cloudinary credentials
- SMTP credentials (Gmail SMTP is configured)
- Razorpay keys
- Gemini API key

---

## Environment Variables

Each service ships an `example-env` file.

> Recommended approach: copy each `example-env` to `.env` in the same folder and fill real secrets.

### Frontend (`frontend/.env`)

```env
RAZORPAY_KEY=
UTILS_SERVICE=http://localhost:5001
AUTH_SERVICE=http://localhost:5000
USER_SERVICE=http://localhost:5002
JOB_SERVICE=http://localhost:5003
PAYMENT_SERVICE=http://localhost:5004
```

### Auth Service (`services/auth/.env`)

```env
PORT=5000
NEON_DB_URL=
UPLOAD_SERVICE=http://localhost:5001
JWT_SEC=
KAFKA_BROKER=localhost:9092
FRONTEND_URL=http://localhost:3000
REDIS_URL=
```

### User Service (`services/user/.env`)

```env
PORT=5002
DB_URL=
UPLOAD_SERVICE=http://localhost:5001
JWT_SEC=
```

### Job Service (`services/job/.env`)

```env
PORT=5003
DB_URL=
UPLOAD_SERVICE=http://localhost:5001
JWT_SEC=
KAFKA_BROKER=localhost:9092
```

### Payment Service (`services/payment/.env`)

```env
PORT=5004
RAZORPAY_KEY=
RAZORPAY_SECRET=
DB_URL=
JWT_SEC=
```

### Utils Service (`services/utils/.env`)

```env
PORT=5001
CLOUD_NAME=
API_KEY=
API_SECRET=
KAFKA_BROKER=localhost:9092
SMTP_USER=
SMTP_PASS=
REDIS_URL=
API_KEY_GEMINI=
```

---

## Local Development Setup

Open multiple terminals (or use a process manager) and run each service.

### 1) Install dependencies

```bash
cd frontend && npm install
cd ../services/auth && npm install
cd ../user && npm install
cd ../job && npm install
cd ../payment && npm install
cd ../utils && npm install
```

### 2) Start backend services

```bash
cd services/utils && npm run dev
cd services/auth && npm run dev
cd services/user && npm run dev
cd services/job && npm run dev
cd services/payment && npm run dev
```

### 3) Start frontend

```bash
cd frontend && npm run dev
```

Visit: `http://localhost:3000`

---

## Running with Docker

Every app folder includes a Dockerfile. Build images per service from its folder:

```bash
cd frontend && docker build -t intellihire-frontend .
cd ../services/auth && docker build -t intellihire-auth .
cd ../user && docker build -t intellihire-user .
cd ../job && docker build -t intellihire-job .
cd ../payment && docker build -t intellihire-payment .
cd ../utils && docker build -t intellihire-utils .
```

> There is currently no top-level `docker-compose.yml` in this repository, so containers must be wired manually.

---

## API Overview

Base prefixes by service:

- Auth: `/api/auth`
- User: `/api/user`
- Job: `/api/job`
- Payment: `/api/payment`
- Utils: `/api/utils`

### Auth
- `POST /register`
- `POST /login`
- `POST /forgot`
- `POST /reset/:token`

### User
- `GET /me`
- `GET /:userId`
- `PUT /update/profile`
- `PUT /update/pic`
- `PUT /update/resume`
- `POST /skill/add`
- `PUT /skill/delete`
- `POST /apply/job`
- `GET /application/all`

### Job
- `POST /company/new`
- `DELETE /company/:companyId`
- `POST /new`
- `PUT /:jobId`
- `GET /company/all`
- `GET /company/:id`
- `GET /all`
- `GET /:jobId`
- `GET /application/:jobId`
- `PUT /application/update/:id`

### Payment
- `POST /checkout`
- `POST /verify`

### Utils
- `POST /upload`
- `POST /career`
- `POST /resume-analyser`

---

## Authentication Flow

- JWTs are issued by Auth service after register/login.
- Frontend stores token in cookies.
- Protected routes pass `Authorization: Bearer <token>`.
- Service middleware validates token and enriches request user data.

---

## Event-Driven Email Flow (Kafka)

Two main producers currently publish to `send-mail`:
- Auth service (password reset).
- Job service (application status notifications).

Utils service runs a Kafka consumer that:
1. Subscribes to `send-mail`.
2. Parses message payload (`to`, `subject`, `html`).
3. Sends mail via Nodemailer/SMTP.

---

## AI Features

Implemented in Utils service:

1. **Career Guide** (`POST /api/utils/career`)
   - Accepts a skill list.
   - Requests structured role recommendations from Gemini.
   - Returns strict JSON sections (summary, job options, skills to learn, learning approach).

2. **Resume ATS Analyzer** (`POST /api/utils/resume-analyser`)
   - Accepts base64 PDF data.
   - Prompts Gemini for ATS scoring + recommendations.
   - Returns JSON with score breakdown, suggestions, strengths, and summary.

---

## Payment & Subscription Flow

- Payment service creates a Razorpay order for a fixed amount.
- On verification, it validates signature with HMAC SHA-256.
- If valid, user subscription is set to now + 30 days in DB.
- Application records store whether the applicant was subscribed at apply time.

---

## Database Notes

- Auth service bootstraps user + skill tables and a `user_role` enum.
- Job service bootstraps company/job/application tables and enums.
- Shared `users` table is referenced by other services for auth/profile/subscription behavior.

Because services initialize portions of schema at startup, startup order and DB connectivity are important for first run.

---
If you are extending IntelliHire, start by documenting new endpoints and env vars in this README to keep onboarding fast for new contributors.
