# AvailMed API Documentation

Base URL: `http://localhost:5000/api`

All responses follow the format:
```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

## Authentication

Most endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "password": "securepassword",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "John Doe", "role": "user" },
    "accessToken": "eyJ...",
    "refreshToken": "uuid-token"
  }
}
```

---

### POST /auth/login
Login with email/password.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

---

### POST /auth/otp/send
Send OTP to phone number.

**Body:**
```json
{ "phone": "+919876543210" }
```

**Rate limit:** 3 per minute

---

### POST /auth/otp/verify
Verify OTP and login/register.

**Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

---

### POST /auth/refresh
Refresh access token.

**Body:**
```json
{ "refreshToken": "uuid-token" }
```

---

### GET /auth/profile
Get current user profile. **Requires auth.**

---

### PUT /auth/profile
Update user profile. **Requires auth.**

**Body:**
```json
{
  "name": "New Name",
  "location_lat": 28.6139,
  "location_lng": 77.2090
}
```

---

## Medicine Endpoints

### GET /medicines/search
Search medicines.

**Query params:**
- `q` — Search term (medicine name, generic name, composition)
- `category` — Filter by category
- `page` — Page number (default: 1)
- `limit` — Results per page (default: 20)

**Example:** `GET /medicines/search?q=paracetamol&category=Analgesic`

---

### GET /medicines/categories
Get all medicine categories.

---

### GET /medicines/:id
Get medicine details by ID.

---

### GET /medicines/:id/alternatives
Get alternative medicines (same generic name/composition).

---

### GET /medicines/:id/availability
Get pharmacy availability for a medicine.

**Query params:**
- `lat` — User latitude
- `lng` — User longitude
- `radius` — Search radius in km (default: 10)

---

### POST /medicines
Create medicine. **Admin only.**

**Body:**
```json
{
  "medicine_name": "Aspirin 500mg",
  "generic_name": "Aspirin",
  "composition": "Aspirin 500mg",
  "manufacturer": "Bayer",
  "category": "Analgesic"
}
```

---

## Pharmacy Endpoints

### POST /pharmacies/register
Register a new pharmacy. **Requires auth.**

**Body:**
```json
{
  "name": "City Pharmacy",
  "license_no": "MH-2024-001",
  "gst_no": "27AAPFU0939F1ZV",
  "address": "123 Main Street, Mumbai",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "phone": "+912212345678"
}
```

---

### GET /pharmacies/nearby
Get nearby pharmacies.

**Query params:**
- `lat` — Latitude (required)
- `lng` — Longitude (required)
- `radius` — Radius in km (default: 10)
- `page`, `limit` — Pagination

---

### GET /pharmacies/my
Get current user's pharmacy. **Requires pharmacy_owner role.**

---

### GET /pharmacies/:id
Get pharmacy details.

---

### GET /pharmacies/:id/inventory
Get pharmacy inventory.

**Query params:**
- `search` — Search by medicine name
- `page`, `limit` — Pagination

---

## Inventory Endpoints

### POST /inventory
Add or update inventory item. **Requires pharmacy_owner role.**

**Body:**
```json
{
  "pharmacy_id": "uuid",
  "medicine_id": "uuid",
  "stock": 100,
  "price": 25.50,
  "expiry_date": "2025-12-31"
}
```

---

### POST /inventory/bulk
Bulk upload inventory via CSV. **Requires pharmacy_owner role.**

**Form data:**
- `file` — CSV file
- `pharmacy_id` — Pharmacy UUID

**CSV format:**
```csv
medicine_name,generic_name,stock,price,expiry_date
Paracetamol 500mg,Acetaminophen,100,25.50,2025-12-31
```

---

### DELETE /inventory/:id
Delete inventory item. **Requires pharmacy_owner role.**

---

## Reservation Endpoints

### POST /reservations
Create a reservation. **Requires auth.**

**Body:**
```json
{
  "pharmacy_id": "uuid",
  "medicine_id": "uuid",
  "quantity": 2,
  "notes": "Please keep aside"
}
```

---

### GET /reservations/user
Get current user's reservations.

**Query params:**
- `status` — Filter by status
- `page`, `limit` — Pagination

---

### GET /reservations/pharmacy/:pharmacy_id
Get pharmacy reservations. **Requires pharmacy_owner role.**

---

### GET /reservations/:id
Get reservation by ID.

---

### PATCH /reservations/:id/status
Update reservation status. **Requires pharmacy_owner or admin.**

**Body:**
```json
{ "status": "confirmed" }
```

**Status values:** `pending` → `confirmed` → `ready` → `completed` | `cancelled`

---

## Admin Endpoints

All admin endpoints require the `admin` role.

### GET /admin/dashboard
Get platform statistics and recent activity.

### GET /admin/users
Get all users with pagination and filters.

### PUT /admin/users/:id/role
Update user role.

### DELETE /admin/users/:id
Delete user.

### GET /admin/pharmacies
Get all pharmacies.

### GET /admin/pharmacies/pending
Get pharmacies pending approval.

### PATCH /admin/pharmacies/:id/approve
Approve or reject a pharmacy.

**Body:**
```json
{ "action": "approve" }
```
