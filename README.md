# AvailMed — Medicine Availability Search Platform

A production-ready full-stack platform to search medicine availability across pharmacies, reserve medicines online, and manage pharmacy inventory.

## Features

- **Medicine Search** — Full-text search with autocomplete across medicine name, generic name, and composition
- **Real-time Availability** — See which pharmacies near you have your medicine in stock, with prices
- **Online Reservation** — Reserve medicines and get email/SMS notifications
- **Geolocation** — Find nearby pharmacies sorted by distance using Haversine formula
- **Role-based Access** — User, Pharmacy Owner, and Admin roles with separate dashboards
- **Pharmacy Management** — Inventory management with bulk CSV upload
- **Admin Dashboard** — Platform analytics, pharmacy approval workflow, user management
- **OTP Authentication** — Phone-based OTP login via Twilio (with console fallback for development)
- **Dark Mode** — Full dark/light theme support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| State Management | Zustand, React Query |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL with full-text search |
| Auth | JWT (access + refresh tokens), OTP via Twilio |
| Email | Nodemailer (SMTP) |
| Maps | OpenStreetMap (embedded iframe) |
| Forms | React Hook Form + Zod validation |
| Rate Limiting | express-rate-limit |
| Security | Helmet, CORS, bcrypt |

## Project Structure

```
available-medicine/
├── backend/          # Node.js + Express API
├── frontend/         # Next.js application
├── docs/             # Documentation
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or Docker)

### 1. Clone & Setup

```bash
cd available-medicine
```

### 2. Database Setup

**With Docker (recommended):**
```bash
docker-compose up -d postgres
```

**Without Docker:**
```bash
createdb available_medicine
psql available_medicine -f backend/migrations/001_initial_schema.sql
```

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

### 4. Frontend Setup

```bash
cd frontend
# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
npm install
npm run dev
```

### 5. Access the App

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| API Health | http://localhost:5000/health |

## Docker (Full Stack)

```bash
docker-compose up --build
```

## Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | No (console fallback) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | No |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | No |
| `SMTP_HOST` | SMTP server host | No (console fallback) |
| `SMTP_USER` | SMTP username | No |
| `SMTP_PASS` | SMTP password | No |

### Frontend (.env.local)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## API Overview

See [docs/API.md](docs/API.md) for full API documentation.

**Base URL:** `http://localhost:5000/api`

Key endpoints:
- `GET /medicines/search?q={query}` — Search medicines
- `GET /medicines/{id}/availability` — Get availability by location
- `GET /pharmacies/nearby?lat={lat}&lng={lng}` — Nearby pharmacies
- `POST /reservations` — Create reservation
- `POST /auth/register` — Register user
- `POST /auth/otp/send` — Send OTP

## User Roles

| Role | Capabilities |
|------|-------------|
| `user` | Search medicines, view availability, create reservations |
| `pharmacy_owner` | All user permissions + manage inventory, view pharmacy reservations |
| `admin` | All permissions + approve pharmacies, manage users, view analytics |

## Development Notes

- OTP is logged to console when Twilio is not configured
- Email is logged to console when SMTP is not configured
- Seeded medicines are inserted on first DB migration
- Rate limiting: 100 req/15min general, 10 req/15min auth, 3 req/min OTP

## License

MIT
