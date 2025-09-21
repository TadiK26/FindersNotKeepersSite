# FNK Networking Service (No‑Mermaid Version)

A standalone, pluggable networking/API layer for **FindersNotKeepers**. This README avoids Mermaid so it renders on Git hosting that doesn’t support Mermaid.

> Tech: TypeScript, Express, JWT, Helmet/CORS, rate‑limits, pluggable **Storage** (local→S3) & **Email** (console→SMTP) drivers.

---

## Table of Contents
- Architecture (ASCII)
- Quick Start
- Configuration
- Security Posture
- API Overview
- OpenAPI Spec
- Request Flows (ASCII)
- Data Model (ASCII)
- Production Swaps
- License

---

## Architecture (ASCII)
```
[Clients]
  ├─ Browser / UI
  └─ Mobile / Script
        │
        ▼
[Edge: CDN/WAF/Reverse Proxy]
  (TLS termination, CORS, rate‑limits, security headers)
        │
        ▼
[Networking Service]
  ├─ Express API (Auth / Public / Listings)
  ├─ Security Middleware (Helmet, CORS, Rate‑limit)
  ├─ JWT Service
  ├─ Storage Driver  (local → S3)
  └─ Email Driver    (console → SMTP)
        │                 │
        │                 └──────────────► [SMTP Relay]
        │
        └────────────────────────────────► [Object Storage]

Data: In‑memory Users & Listings (swap to Postgres later)
```

---

## Quick Start
```bash
cp .env.example .env
npm i
npm run dev
# Smoke test
curl -s http://localhost:8080/api/public/health | jq
```

**Typical Dev Flow**
1. Register → Login (get tokens)
2. Presign upload → PUT file to returned URL
3. Create listing with `imageKey`
4. Get listing (optionally returns `imageUrl` if storage supports it)

---

## Configuration

| Variable | Default | Notes |
|---|---:|---|
| `PORT` | `8080` | HTTP port |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | CORS allowlist (CSV) |
| `HSTS_ENABLED` | `true` | Strict‑Transport‑Security (dev simulates) |
| `REQUEST_BODY_LIMIT_MB` | `6` | Caps JSON/form bodies |
| `JWT_ISSUER` / `JWT_AUDIENCE` | `fnk.network` / `fnk.web` | Token claims |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | `3600` / `1209600` | Seconds |
| `JWT_SECRET` | `dev_only_replace_me` | Use a strong secret in prod |
| `STORAGE_DRIVER` | `local` | `local` or `s3` |
| `LOCAL_STORAGE_DIR` | `.uploads` | Private dev storage |
| `EMAIL_DRIVER` | `console` | `console` or `smtp` |
| `SMTP_*` | – | Required when `EMAIL_DRIVER=smtp` |
| `ADMIN_IP_ALLOWLIST` | `127.0.0.1/32` | For future admin routes |

---

## Security Posture
- TLS/HSTS at edge (prod); Helmet in dev
- CORS allowlist via `ALLOWED_ORIGINS`
- Security headers: CSP, X‑Content‑Type‑Options, Referrer‑Policy, etc.
- Rate‑limits (`express-rate-limit`)
- Body size caps (`REQUEST_BODY_LIMIT_MB`)
- JWT (short‑lived access, long‑lived refresh)
- Presigned uploads (API never handles file bytes)

---

## API Overview
Base URL (dev): `http://localhost:8080`

**Public**
- `GET /api/public/health` → service status
- `POST /api/public/uploads/presign` → presigned PUT target `{ contentType, ext? }`

**Auth**
- `POST /api/auth/register` → create user & send verification email
- `POST /api/auth/login` → `{ access, refresh }`
- `POST /api/auth/refresh` → `{ access }`

**Listings**
- `GET /api/listings` → list all (demo)
- `POST /api/listings` *(Bearer)* → create
- `GET /api/listings/{id}` → detail (+`imageUrl` if supported)
- `DELETE /api/listings/{id}` *(owner)* → delete

**cURL examples**
```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"pass"}'

# Login → capture access token
ACCESS=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"pass"}' | jq -r .access)

# Presign upload
PS=$(curl -s -X POST http://localhost:8080/api/public/uploads/presign \
  -H 'Content-Type: application/json' \
  -d '{"contentType":"image/jpeg","ext":"jpg"}')
URL=$(echo "$PS" | jq -r .url); TOKEN=$(echo "$PS" | jq -r .headers["x-local-upload-token"]); KEY=$(echo "$PS" | jq -r .key)

# Dev-only upload (pseudo-presign)
curl -X PUT "http://localhost:8080$URL" -H "x-local-upload-token: $TOKEN" --data-binary @sample.jpg

# Create listing
curl -s -X POST http://localhost:8080/api/listings \
  -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d "{\"title\":\"Red backpack\",\"imageKey\":\"$KEY\"}"
```

---

## OpenAPI Spec (YAML)
```yaml
openapi: 3.1.0
info:
  title: FNK Networking API
  version: 0.1.0
servers:
  - url: http://localhost:8080
paths:
  /api/public/health:
    get:
      summary: Liveness/health
      responses:
        '200': { description: OK }
  /api/public/uploads/presign:
    post:
      summary: Get a presigned PUT target for object upload
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [contentType]
              properties:
                contentType: { type: string }
                ext: { type: string, description: File extension without dot }
      responses:
        '200': { description: Presigned info }
  /api/auth/register:
    post:
      summary: Register a user (sends verification email)
      responses:
        '201': { description: Created }
        '409': { description: Email exists }
  /api/auth/login:
    post:
      summary: Login and get tokens
      responses:
        '200': { description: Tokens }
        '401': { description: Invalid credentials }
  /api/auth/refresh:
    post:
      summary: Exchange refresh for a new access token
      responses:
        '200': { description: New access token }
        '401': { description: Invalid refresh }
  /api/listings:
    get:
      summary: List listings
      responses:
        '200': { description: OK }
    post:
      summary: Create a listing (requires Bearer access)
      responses:
        '201': { description: Created }
        '400': { description: Bad request }
        '401': { description: Unauthorized }
  /api/listings/{id}:
    get:
      summary: Get single listing
      responses:
        '200': { description: OK }
        '404': { description: Not found }
    delete:
      summary: Delete listing (owner only)
      responses:
        '204': { description: Deleted }
        '403': { description: Forbidden }
        '404': { description: Not found }
```

---

## Request Flows (ASCII)
**Register/Login**
```
UI → POST /api/auth/register {email, password}
API → create user (bcrypt); send verification email → 201 {id, email}
UI → POST /api/auth/login {email, password} → 200 {access, refresh}
```

**Presigned Upload**
```
UI → POST /api/public/uploads/presign {contentType, ext}
API → returns {url, headers, key}
UI → PUT file bytes to url with headers → 201
```

**Create/Get Listing**
```
UI → POST /api/listings (Bearer) {title, imageKey} → 201 {listing}
UI → GET /api/listings/{id} → 200 {listing, imageUrl?}
```

---

## Data Model (ASCII)
```
USER (PK: id)
  id, email, passwordHash, emailVerified, createdAt
        1  owns  *
        │         \
        ▼          \
LISTING (PK: id)
  id, ownerId(FK→USER.id), title, description?, imageKey?, createdAt
```

---

## Production Swaps
- **Storage Driver** → S3 presign + CDN `getPublicUrl`
- **Email Driver** → SMTP provider with SPF/DKIM
- **Persistence** → Postgres repositories (same REST API)
- **Edge** → CORS/rate‑limit/WAF at CDN/Ingress

---

## License
MIT (or your team’s chosen license).

