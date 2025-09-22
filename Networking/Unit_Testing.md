# FNK Networking Service (standalone / pluggable)

This service exposes a stable, minimal API your UI and other back-ends can consume.  
It runs standalone for demos and swaps drivers later without changing the API.

---

## 🚀 Quick Start

```bash
cp .env.example .env
npm i
npm run dev
```

---

## 🔎 Test Flow

1. **Health**  
   `GET http://localhost:8080/api/public/health`

2. **Register**  
   `POST /api/auth/register`  
   JSON body:  
   ```json
   { "email": "a@b.com", "password": "pass" }
   ```

3. **Login**  
   `POST /api/auth/login` → copy `access`

4. **Presign Upload**  
   `POST /api/public/uploads/presign`  
   JSON body:  
   ```json
   { "contentType": "image/jpeg", "ext": "jpg" }
   ```
   Response: `{ url, headers, key }`

5. **Upload File (local dev)**  
   `PUT http://localhost:8080${url}`  
   Headers: `x-local-upload-token: <headers.token>`  
   Body: binary file data

6. **Create Listing**  
   `POST /api/listings`  
   Headers: `Authorization: Bearer <access>`  
   JSON body:  
   ```json
   { "title": "Red backpack", "imageKey": "<key>" }
   ```

7. **Get Listing**  
   `GET /api/listings/<id>`

---

## 🔁 Swap Drivers Later

- `STORAGE_DRIVER=s3` → real presigned URLs + CDN public URL  
- `EMAIL_DRIVER=smtp` → real SMTP provider  

---

## 🔒 Security & Limits

- CORS restricted to `ALLOWED_ORIGINS`  
- Helmet + CSP + HSTS  
- Rate limiting + body size caps  
- JWT access/refresh tokens  

---

## 🧪 One-Time Setup for Unit Testing (Windows)

1. Install Node.js (see troubleshooting below).  
2. Ensure project folder (`fnk-networking-service`) has all subfolders and files.  
3. Set up environment variables:  
   ```bash
   cp .env.example .env
   ```
   (Creates `.env` with default local drivers.)  
4. Open `.env` in Notepad or VS Code and confirm:
   ```
   STORAGE_DRIVER=local
   EMAIL_DRIVER=console
   ```
5. Install dependencies:  
   ```bash
   npm install
   ```

---

## ▶️ Run the Service

**Development (auto-reload with tsx):**
```bash
npm run dev
```
Expected console output:
```json
{"level":30,"port":8080,"env":"development","msg":"Networking service started"}
```

**Production build/run:**
```bash
npm run build
npm start
```

**Quick smoke test (Health endpoint):**
```bash
curl http://localhost:8080/api/public/health
```
Expected JSON:
```json
{"status":"ok","env":"development","time":"2025-09-22T09:00:00.000Z"}
```

---

## 🔄 End-to-End Flow on Windows

**Register user:**
```bash
curl -X POST http://localhost:8080/api/auth/register `
  -H "Content-Type: application/json" `
  -d "{""email"":""you@example.com"",""password"":""pass""}"
```

**Login for tokens:**
```bash
curl -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{""email"":""you@example.com"",""password"":""pass""}"
```
Output:  
```json
{ "access": "...", "refresh": "..." }
```

**Presign upload:**
```bash
curl -X POST http://localhost:8080/api/public/uploads/presign `
  -H "Content-Type: application/json" `
  -d "{""contentType"":""image/jpeg"",""ext"":""jpg""}"
```
Response:  
```json
{ "key": "...", "url": "...", "headers": { "x-local-upload-token": "..." } }
```

**Upload a file (ensure `sample.jpg` exists):**
```bash
curl -X PUT "http://localhost:8080/uploads/local/<encoded-key>?token=<token>" `
  -H "x-local-upload-token: <token>" `
  --data-binary "@sample.jpg"
```

**Create listing:**
```bash
curl -X POST http://localhost:8080/api/listings `
  -H "Authorization: Bearer <access>" `
  -H "Content-Type: application/json" `
  -d "{""title"":""Red backpack"",""imageKey"":""<key>""}"
```

**Fetch listings:**
```bash
curl http://localhost:8080/api/listings
```

---

## 🛠 Troubleshooting

- **Check if Node.js is installed**
  ```bash
  node -v
  npm -v
  ```

- **Install Node.js + npm if missing**  
  - Using Homebrew:  
    ```bash
    brew install node
    ```
  - Or download from [Node.js website](https://nodejs.org)

- **Verify installation**
  ```bash
  node -v
  npm -v
  ```

- **Common pitfalls**  
  - Double quotes in JSON must be escaped as `""`.  
  - `--data-binary "@file.jpg"` requires the file in your current folder (`dir` to confirm).  
