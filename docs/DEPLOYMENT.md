# Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL 15+ (if not using Docker)

## Local Development

### Quick Start with Docker

```bash
# Start all services
docker-compose up --build

# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# PostgreSQL: localhost:5432
```

### Manual Setup

**1. Database:**
```bash
createdb available_medicine
psql available_medicine -f backend/migrations/001_initial_schema.sql
```

**2. Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm install
npm run dev    # Development with hot reload
```

**3. Frontend:**
```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
npm install
npm run dev
```

## Production Deployment

### Environment Variables for Production

**Backend (set as secrets):**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<generate-with: openssl rand -base64 64>
JWT_REFRESH_SECRET=<generate-with: openssl rand -base64 64>
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_PHONE_NUMBER=<your-twilio-number>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASS=<your-app-password>
FRONTEND_URL=https://yourdomain.com
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### Deploy to Railway

```bash
# Backend
cd backend
railway login
railway init
railway add --database postgresql
railway up

# Frontend
cd frontend
railway init
railway up
```

### Deploy to Vercel (Frontend)

```bash
cd frontend
npm install -g vercel
vercel
# Set NEXT_PUBLIC_API_URL in Vercel dashboard
```

### Deploy Backend to Fly.io

```bash
cd backend
fly auth login
fly launch
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set JWT_SECRET="..."
fly deploy
```

### Docker Production Build

```bash
# Build production images
docker build -t availmed-backend ./backend
docker build -t availmed-frontend ./frontend

# Push to registry
docker tag availmed-backend registry.example.com/availmed-backend:latest
docker push registry.example.com/availmed-backend:latest
```

## Database Migrations

For subsequent migrations, create numbered SQL files:

```bash
# Apply migration
psql $DATABASE_URL -f backend/migrations/002_add_ratings_table.sql

# Using npm script
cd backend
DATABASE_URL=postgresql://... npm run migrate
```

## Health Checks

| Endpoint | Expected Response |
|----------|------------------|
| `GET /health` | `{"status": "ok"}` |
| `GET /api/medicines/categories` | List of categories |

## Monitoring

Add these to production:

1. **Logging**: Replace `console.log` with Winston or Pino
2. **APM**: Add Sentry for error tracking
3. **Metrics**: Prometheus + Grafana
4. **Uptime**: UptimeRobot or Pingdom

## SSL/HTTPS

Use a reverse proxy (nginx or Caddy) for SSL termination:

**Caddyfile:**
```
yourdomain.com {
  reverse_proxy frontend:3000
}

api.yourdomain.com {
  reverse_proxy backend:5000
}
```

## Backup Strategy

```bash
# Daily backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20240101.sql
```
