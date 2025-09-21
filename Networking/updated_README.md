# FindersNotKeepers Networking — Architecture & API Schema

This document is ready to drop into a `README.md` file for your group repository. It avoids Mermaid (since GitLab preview errors) and instead uses static ASCII diagrams for **Architecture** and **Data Model**. Other sections remain unchanged.

---

## 1) System Overview (at a glance)
- **Clients**: Web UI (React/Next), CLI, Postman.
- **Edge**: CDN/WAF/Reverse Proxy (prod) or Express middleware (dev).
- **Networking Service**: Auth, presigned-upload, listing CRUD.
- **Drivers**: Storage (Local → S3), Email (Console → SMTP).
- **Data**: In-memory demo stores (Users, Listings) → swap to Postgres later.

---

## 2) Context & Container Diagram (ASCII)
```
Clients (Browser, Mobile)
        |
        v
   [ CDN / WAF / TLS ]
        |
        v
   [ Networking Service ]
       |   |     |   |
       |   |     |   +---> Email Driver (Console/SMTP)
       |   |     +-------> Storage Driver (Local/S3)
       |   +-------------> JWT Service
       +-----------------> Security Middleware (Helmet, CORS, Rate-limit)

Data Stores:
- In-memory Users & Listings
- Object Storage (Local/S3)
- SMTP Relay
```

---

## 3) Critical Request Flows

### 3.1 Register/Login
```
UI → POST /api/auth/register {email, password}
  → Networking Service → Users (store bcrypt hash)
  → Networking Service → Email Driver (send verify link)
← 201 Created

UI → POST /api/auth/login {email, password}
  → Networking Service → Users (validate)
← 200 { access, refresh }
```

### 3.2 Presigned Upload
```
UI → POST /api/public/uploads/presign {contentType, ext}
  → Networking Service → Storage Driver (create presigned URL)
← { url, headers, key }

UI → PUT file bytes to returned URL (object storage)
← 201 Created
```

### 3.3 Create & Get Listing
```
UI → POST /api/listings {title, imageKey} (Bearer token)
  → Networking Service → Listings repo (store)
← 201 { listing }

UI → GET /api/listings/:id
  → Networking Service → Storage Driver (public URL lookup)
← 200 { listing, imageUrl }
```

---

## 4) Logical Data Model (ASCII)
```
USER (id PK)
  - email
  - passwordHash
  - emailVerified
  - createdAt
        1  owns  *
        │         \
        ▼          \
LISTING (id PK)
  - ownerId (FK → USER.id)
  - title
  - description
  - imageKey
  - createdAt
```
- A User can own many Listings.
- Listings may reference an uploaded file via `imageKey`.

---

## 5) OpenAPI 3.1 Specification
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
      summary: Get a presigned PUT target
      responses:
        '200': { description: Presigned info }
  /api/auth/register:
    post:
      summary: Register user (sends email)
      responses:
        '201': { description: Created }
        '409': { description: Email exists }
  /api/auth/login:
    post:
      summary: Login & get tokens
      responses:
        '200': { description: Tokens }
        '401': { description: Invalid credentials }
  /api/auth/refresh:
    post:
      summary: Refresh access token
      responses:
        '200': { description: New access token }
        '401': { description: Invalid refresh }
  /api/listings:
    get:
      summary: List listings
      responses:
        '200': { description: OK }
    post:
      summary: Create a listing
      responses:
        '201': { description: Created }
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

## 6) Config & Security Table
| Concern | Where enforced | Notes |
|---|---|---|
| TLS/HSTS | Edge / Helmet | HSTS preloaded in prod |
| CORS | Middleware | `ALLOWED_ORIGINS` per env |
| AuthN | JWT access/refresh | Short-lived access, long-lived refresh |
| Rate limiting | express-rate-limit | Global per-IP cap |
| Body size caps | express.json/urlencoded | Default 6 MB |
| Upload security | Presigned PUT | API never handles file bytes |
| Secrets | .env (dev) | Use Secret Manager in prod |

---

## 7) Production Swaps
- **Storage Driver**: Use S3 presigned URLs behind CDN.
- **Email Driver**: Use SMTP with SPF/DKIM.
- **Persistence**: Swap in Postgres instead of in-memory.
- **Edge**: Move WAF/rate-limit to CDN/Ingress.

---

## 8) Glossary
- **Driver**: pluggable adapter for infra (S3/SMTP).
- **Presigned PUT**: direct client → storage upload.
- **imageKey**: storage key returned from presign, linked in listing.
