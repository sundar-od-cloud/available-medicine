# AvailMed System Architecture

## Overview

AvailMed is a full-stack monorepo with a clear separation between frontend and backend services, communicating via a RESTful API.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────┐
│                    Next.js Frontend (Port 3000)              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  App Router │  │   Components  │  │   State (Zustand) │   │
│  │  (Pages)    │  │  UI/Medicine/ │  │   + React Query  │   │
│  │             │  │  Pharmacy/    │  │                  │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API (Axios)
┌─────────────────────────▼───────────────────────────────────┐
│                  Express Backend (Port 5000)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Middleware Layer                    │   │
│  │  Helmet │ CORS │ Rate Limiter │ JWT Auth │ Error Handler│  │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │  Auth    │ │ Medicine │ │ Pharmacy │ │  Reservation  │   │
│  │  Routes  │ │  Routes  │ │  Routes  │ │   Routes      │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│  ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐ ┌──────▼───────┐   │
│  │  Auth    │ │ Medicine │ │ Pharmacy │ │  Reservation  │   │
│  │ Controller│ │Controller│ │Controller│ │  Controller   │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│  ┌────▼─────────────▼─────────────▼──────────────▼───────┐   │
│  │                    Services Layer                       │   │
│  │  OTPService │ EmailService │ NotificationService │ CSV │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ pg (node-postgres)
┌─────────────────────────▼───────────────────────────────────┐
│                    PostgreSQL Database                        │
│  users │ pharmacies │ medicines │ inventory │ reservations   │
│  otp_tokens │ refresh_tokens │ search_history               │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Entity Relationships

```
users ──────── pharmacies (one to many via owner_id)
users ──────── reservations (one to many via user_id)
pharmacies ─── inventory (one to many via pharmacy_id)
pharmacies ─── reservations (one to many via pharmacy_id)
medicines ──── inventory (one to many via medicine_id)
medicines ──── reservations (one to many via medicine_id)
```

### Key Design Decisions

1. **UUID primary keys** — Better for distributed systems, no sequential ID leakage
2. **JSONB for alternatives** — Flexible storage for medicine alternatives list
3. **Enum types** — Enforced at DB level for roles and statuses
4. **Full-text search index** — GIN index on medicines for fast text search
5. **Composite unique constraint** — (pharmacy_id, medicine_id) in inventory prevents duplicates
6. **Soft inventory management** — Stock is updated when reservation is confirmed, not when created

## Authentication Flow

```
1. Register/Login → Generate Access Token (15min) + Refresh Token (7days)
2. API Requests → Include Access Token in Authorization header
3. Token Expired → Use Refresh Token to get new Access Token
4. Logout → Revoke Refresh Token from DB
5. OTP Flow → Generate OTP → Store in DB → Send via Twilio → Verify → Issue tokens
```

## Medicine Search Algorithm

1. User types in search bar (debounced 400ms)
2. Query hits `/medicines/search?q={query}`
3. Backend uses PostgreSQL full-text search with `plainto_tsquery`
4. Falls back to ILIKE for partial matches
5. Results include pharmacy count and price range from joined inventory
6. Search term logged to `search_history` for analytics

## Geolocation & Distance

The app uses the **Haversine formula** to calculate distances:

```
distance = 2R × arcsin(√(sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)))
```

This is computed in PostgreSQL using inline SQL for efficient database-level filtering, rather than loading all pharmacies and filtering in application code.

## Rate Limiting Strategy

| Endpoint | Limit | Window |
|----------|-------|--------|
| General | 100 req | 15 min |
| Auth (login/register) | 10 req | 15 min |
| OTP send | 3 req | 1 min |
| Search | 60 req | 1 min |

## Security Measures

1. **Helmet.js** — Sets secure HTTP headers
2. **CORS** — Restricted to frontend domain
3. **bcryptjs** — Password hashing with salt rounds=12
4. **JWT** — Short-lived access tokens + rotated refresh tokens
5. **Input validation** — Zod schemas on all API inputs
6. **SQL injection prevention** — Parameterized queries via `pg` library
7. **Rate limiting** — Prevents brute force and abuse

## Caching Strategy

Currently, caching is handled by React Query on the frontend:
- Medicine search: 5 minute stale time
- Pharmacy details: 5 minute stale time
- User reservations: Invalidated on mutations

For production, consider adding Redis for:
- OTP storage (replacing DB table)
- Search result caching
- Session storage

## Deployment Architecture

```
Internet → Load Balancer → Frontend (Next.js) → Backend API → PostgreSQL
                       → Backend API (multiple instances) → Redis (sessions)
```

### Recommended Production Setup

- **Frontend**: Vercel or Netlify (edge-optimized Next.js)
- **Backend**: AWS ECS / Google Cloud Run / Railway (containerized)
- **Database**: AWS RDS PostgreSQL / Supabase
- **Email**: AWS SES (replace SMTP)
- **SMS**: Twilio (already integrated)
- **File Storage**: AWS S3 (for CSV uploads in production)
