
# FNK Networking Service (standalone / pluggable)

This service exposes a stable, minimal API your UI and other back-ends can consume. It runs standalone for demos and swaps drivers later without changing API.

## Quick start

```bash
cp .env.example .env
npm i
npm run dev
```

### Test flow
1. Health: `GET http://localhost:8080/api/public/health`
2. Register: `POST /api/auth/register` JSON `{ "email": "a@b.com", "password": "pass" }`
3. Login: `POST /api/auth/login` → copy `access`
4. Presign: `POST /api/public/uploads/presign` JSON `{ "contentType": "image/jpeg", "ext": "jpg" }`
   - Returns `{ url, headers, key }`
5. Upload file (local dev): `PUT http://localhost:8080${url}` with header `x-local-upload-token: <headers.token>` and binary body
6. Create listing: `POST /api/listings` with `Authorization: Bearer <access>` body `{ "title": "Red backpack", "imageKey": "<key>" }`
7. Get listing: `GET /api/listings/<id>`

## Swap drivers later
- STORAGE_DRIVER=s3 → implement real presigned URLs and CDN public URL
- EMAIL_DRIVER=smtp → real SMTP provider

## Security & limits
- CORS allows only ALLOWED_ORIGINS
- Helmet + CSP + HSTS
- Rate limiting and body size caps
- JWT access/refresh tokens

## One-time setup for unit testing (Windows)
-  Install Node.js (see below)
-  ensure project folder (fnk-networking-service) has all subfolders and files
-  set up environment variables:
      copy .env.example .env
      (That creates .env with default values (local drivers).)
-  Open .env in Notepad or VS Code and confirm:
      STORAGE_DRIVER=local
      EMAIL_DRIVER=console
-  Install dependencies:
      npm install
-  Run the service
   Development (auto-reload with tsx):
      npm run dev
   Expected console output:
      {"level":30,"port":8080,"env":"development","msg":"Networking service started"}
   Production build/run:
      npm run build
      npm start
-  Quick smoke test (Health endpoint)
   In a new terminal window:
      curl http://localhost:8080/api/public/health
   Expected JSON:
      {"status":"ok","env":"development","time":"2025-09-22T09:00:00.000Z"}
-  End-to-end flow on Windows
   Register user:
      curl -X POST http://localhost:8080/api/auth/register `
      -H "Content-Type: application/json" `
      -d "{""email"":""you@example.com"",""password"":""pass""}"
   Login for tokens:
      curl -X POST http://localhost:8080/api/auth/login `
      -H "Content-Type: application/json" `
      -d "{""email"":""you@example.com"",""password"":""pass""}"
   Output: { "access": "...", "refresh": "..." }
   Presign upload:
      curl -X POST http://localhost:8080/api/public/uploads/presign `
      -H "Content-Type: application/json" `
      -d "{""contentType"":""image/jpeg"",""ext"":""jpg""}"
   Response: { "key": "...", "url": "...", "headers": { "x-local-upload-token": "..." } }
   Upload a file:
      (ENSURE sample.jpg is in folder)
      curl -X PUT "http://localhost:8080/uploads/local/<encoded-key>?token=<token>" `
      -H "x-local-upload-token: <token>" `
      --data-binary "@sample.jpg"
   Create listing:
      curl -X POST http://localhost:8080/api/listings `
      -H "Authorization: Bearer <access>" `
      -H "Content-Type: application/json" `
      -d "{""title"":""Red backpack"",""imageKey"":""<key>""}"
   Fetch listing:
      curl http://localhost:8080/api/listings

## Troubleshooting
-  Check if Node.js is installed
-- Run:
      node -v
      and
      npm -v
-- Install Node.js + npm (if not installed)
      brew install node (using Homebrew)
      else, download from Node.js website
-- After installation, Run:
      node -v
      and
      npm -v

-  Double quotes inside JSON must be escaped as "".
-  --data-binary "@file.jpg" needs the file in your current folder. Use dir to confirm.