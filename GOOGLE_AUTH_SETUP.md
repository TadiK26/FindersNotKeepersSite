# Google Authentication Setup Guide

This guide explains how to set up and use Google OAuth authentication in the FindersNotKeepers application.

## Overview

The Google authentication system allows users to:
- **Sign up** with their Google account (creates new account in database)
- **Login** with their Google account (checks database for existing user)
- Receive **email notifications** when creating an account via Google

## Architecture

### Flow Diagram
```
User clicks "Sign in with Google"
  ↓
Google OAuth popup
  ↓
Google returns JWT credential
  ↓
Frontend sends credential to backend (/api/auth/google)
  ↓
Backend decodes credential & extracts user data
  ↓
Backend checks if user exists in PostgreSQL database
  ├─ New User: Creates account + Sends welcome email
  └─ Existing User: Returns user data
  ↓
Backend returns JWT token + user info
  ↓
Frontend stores token in localStorage
  ↓
User redirected to /listings
```

## Setup Instructions

### 1. Backend Setup (Server)

#### Install Dependencies
The required packages are already in package.json:
- `nodemailer` - for sending emails
- `jsonwebtoken` - for JWT authentication
- `pg` - PostgreSQL client

```bash
cd Server
npm install
```

#### Configure Environment Variables
1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and configure:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# PostgreSQL Database
DB_HOST=localhost
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=findersnotkeepers
DB_PORT=5432

# JWT Secret (change this!)
JWT_SECRET=generate_a_random_secret_key_here

# Email Configuration
EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

#### Gmail App Password Setup
To send emails via Gmail:
1. Go to Google Account settings
2. Enable 2-factor authentication
3. Go to "App Passwords" section
4. Generate a new app password for "Mail"
5. Use this password in `EMAIL_PASSWORD`

#### Start the Backend
```bash
npm run dev
```
Server will run on http://localhost:5000

### 2. Frontend Setup

#### Configure Environment Variables
1. Navigate to frontend directory:
   ```bash
   cd Frontend/findnotkeep
   ```

2. Create `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=257643953276-8su4c8tr824kok0k40jd2rbgp5ek6roa.apps.googleusercontent.com
   ```

#### Start the Frontend
```bash
npm install
npm run dev
```
Frontend will run on http://localhost:3000

### 3. Database Setup

Ensure your PostgreSQL database has a `users` table:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## How It Works

### New User Signup with Google

1. User clicks "Sign up with Google" button on `/signup` page
2. Google OAuth popup appears
3. User selects Google account
4. Frontend receives Google JWT credential
5. Frontend sends credential to `POST /api/auth/google`
6. Backend:
   - Decodes Google JWT
   - Extracts email, name, and Google ID
   - Checks if email exists in database
   - **If new user:**
     - Creates user account with Google data
     - Generates random password (user won't need it)
     - Sends welcome email notification
     - Returns JWT token + user data + `isNewUser: true`
   - **If existing user:**
     - Returns JWT token + user data + `isNewUser: false`
7. Frontend stores JWT token in localStorage
8. User redirected to `/listings`
9. Alert message shows:
   - New user: "Welcome to FindersNotKeepers, [name]! Check your email for a welcome message."
   - Existing user: "Welcome back, [name]!"

### Login with Google

Same flow as signup, but:
- Uses `/login` page instead of `/signup`
- Always checks database for existing user
- Shows "Welcome back" message

## API Endpoints

### POST /api/auth/google

**Description:** Handles both Google signup and login

**Request Body:**
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "isNewUser": true
}
```

**Error Response (400/500):**
```json
{
  "error": "Invalid Google token"
}
```

## Email Notifications

### Welcome Email
Sent automatically when a new user signs up via Google.

**Subject:** "Welcome to FindersNotKeepers!"

**Content:**
- Greeting with user's name
- List of features they can use
- Link to browse listings
- Footer with disclaimer

### Implementation
Located in `Server/services/emailService.js`

Functions:
- `sendWelcomeEmail(email, name)` - Sends welcome email to new users
- `sendLoginNotification(email, name)` - Optional login notification

## File Structure

```
├── Server/
│   ├── routes/
│   │   └── auth.js              # Google OAuth endpoint
│   ├── services/
│   │   └── emailService.js      # Email notification service
│   ├── models/
│   │   └── User.js              # User database model
│   └── .env                      # Server environment variables
│
├── Frontend/findnotkeep/
│   ├── src/Pages/
│   │   ├── Login.jsx            # Login page with Google button
│   │   └── Signup.jsx           # Signup page with Google button
│   └── .env                      # Frontend environment variables
```

## Testing

### Test Google Authentication Locally

1. Ensure backend is running on port 5000
2. Ensure frontend is running on port 3000
3. Open http://localhost:3000/signup
4. Click "Sign up with Google"
5. Select a Google account
6. Check:
   - ✓ User created in database
   - ✓ Email sent to user's inbox
   - ✓ Redirected to /listings page
   - ✓ Alert message appears
   - ✓ Token stored in localStorage

### Test Existing User Login

1. Use same Google account to login again
2. Click "Sign in with Google" on /login
3. Check:
   - ✓ No new user created
   - ✓ No email sent
   - ✓ Redirected to /listings
   - ✓ "Welcome back" message appears

## Troubleshooting

### Google Authentication Errors

**Error:** "Failed to decode Google token"
- **Cause:** Invalid or expired Google credential
- **Solution:** Try signing in again

**Error:** "Google credential is required"
- **Cause:** Frontend not sending credential to backend
- **Solution:** Check network tab in browser DevTools

### Email Not Sending

**Error:** "Failed to send welcome email"
- **Cause:** Invalid Gmail credentials or app password
- **Solution:**
  1. Verify EMAIL_ADDRESS and EMAIL_PASSWORD in .env
  2. Ensure Gmail app password is correct
  3. Check Gmail security settings

### Database Errors

**Error:** "User already exists"
- **Cause:** Attempting to create user with existing email
- **Solution:** This is handled by the login flow automatically

**Error:** "Database connection failed"
- **Solution:** Check PostgreSQL is running and DB_ variables in .env are correct

## Security Considerations

1. **JWT Tokens:** 24-hour expiration, store securely in localStorage
2. **Password Storage:** Google users get random hashed passwords they never see
3. **Email Validation:** Google validates emails, so they're trustworthy
4. **HTTPS:** Use HTTPS in production for secure token transmission
5. **App Passwords:** Never commit Gmail app passwords to Git

## Production Deployment

### Environment Variables to Update

**Backend (.env):**
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com
DB_HOST=your-production-db-host
JWT_SECRET=use-a-strong-random-secret
EMAIL_ADDRESS=noreply@your-domain.com
```

**Frontend (.env):**
```env
VITE_API_URL=https://api.your-domain.com
VITE_GOOGLE_CLIENT_ID=your-production-client-id
```

### Google OAuth Production Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select your project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized JavaScript origins:
   - https://your-domain.com
6. Add authorized redirect URIs:
   - https://your-domain.com
   - https://your-domain.com/signup
   - https://your-domain.com/login
7. Update `VITE_GOOGLE_CLIENT_ID` with production client ID

## Support

For issues or questions:
- Check server logs: `npm run dev` output
- Check browser console for frontend errors
- Verify all environment variables are set correctly
- Test database connection separately

## Future Enhancements

- [ ] Add Google profile picture support
- [ ] Implement "Remember me" functionality
- [ ] Add option to link Google account to existing email/password account
- [ ] Send login notification emails (optional)
- [ ] Add logout functionality that clears localStorage
- [ ] Implement token refresh mechanism
