# FindersNotKeepers - Render Deployment Guide

## Overview
This guide explains how to deploy the FindersNotKeepers application to Render at **https://findersnotkeepers.onrender.com/**

## Architecture
- **Frontend**: Static Site (React/Vite) - https://findersnotkeepers.onrender.com
- **Backend API**: Node.js/Express Server - https://findersnotkeepers-backend.onrender.com
- **Database**: PostgreSQL (Render managed database)

## Prerequisites
1. GitHub account with this repository
2. Render account (sign up at https://render.com with your GitHub)
3. Gmail account for email notifications (optional)

## Deployment Steps

### Option 1: Deploy from Dashboard (Recommended for existing service)

Since your service is already created at https://findersnotkeepers.onrender.com, you just need to update it:

1. **Update Your Code**
   ```bash
   git add .
   git commit -m "Configure for Render deployment"
   git push origin main
   ```

2. **Trigger Manual Deploy** (if auto-deploy is off)
   - Go to https://dashboard.render.com
   - Find your `findersnotkeepers` service
   - Click "Manual Deploy" → "Deploy latest commit"

### Option 2: Deploy from Blueprint (Fresh Start)

If you want to start fresh with the new render.yaml configuration:

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click "New +" → "Blueprint"

2. **Connect Repository**
   - Select your GitHub repository: `FindersNotKeepersSite`
   - Render will detect the `render.yaml` file automatically

3. **Configure Services**
   Render will create 3 services:
   - ✅ `findersnotkeepers-backend` (Node.js server)
   - ✅ `findersnotkeepers-frontend` (Static site)
   - ✅ `findersnotkeepers-db` (PostgreSQL database)

4. **Set Environment Variables**
   Go to the backend service and add these environment variables:

   ```
   EMAIL_ADDRESS=miniepe321@gmail.com
   EMAIL_PASSWORD=idrbserztfrermdd
   ```

   Note: All other variables are auto-configured via render.yaml

5. **Deploy**
   - Click "Apply" to create all services
   - Wait 5-10 minutes for initial deployment

## Configuration Files

### render.yaml (Root Level)
Located at `/render.yaml`, this configures all services:
- Backend API server
- Frontend static site
- PostgreSQL database
- Environment variables
- CORS settings

### Frontend Environment
Located at `LiveSite/.env`:
```env
VITE_API_URL=https://findersnotkeepers-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=257643953276-8su4c8tr824kok0k40jd2rbgp5ek6roa.apps.googleusercontent.com
```

### Backend Environment
Automatically configured by Render from render.yaml:
- Database credentials (from PostgreSQL service)
- JWT_SECRET (auto-generated)
- CORS origins (includes Render URLs)

## Google OAuth Configuration

### Update Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Navigate to "APIs & Services" → "Credentials"
3. Find your OAuth 2.0 Client ID
4. Add Authorized JavaScript origins:
   ```
   https://findersnotkeepers.onrender.com
   https://findersnotkeepers-frontend.onrender.com
   ```
5. Add Authorized redirect URIs:
   ```
   https://findersnotkeepers.onrender.com
   https://findersnotkeepers.onrender.com/signup
   https://findersnotkeepers.onrender.com/login
   ```
6. Save changes

## Testing the Deployment

### 1. Check Backend Health
```bash
curl https://findersnotkeepers-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "FindersNotKeepers server with chat is running",
  "timestamp": "2025-10-27T..."
}
```

### 2. Check Frontend
Visit: https://findersnotkeepers.onrender.com

### 3. Test Google Authentication
1. Go to https://findersnotkeepers.onrender.com/signup
2. Click "Sign up with Google"
3. Select your Google account
4. You should:
   - Be redirected to `/listings` page
   - See a welcome alert
   - Receive a welcome email
   - Token stored in localStorage

## Troubleshooting

### Backend Returns 502 Bad Gateway
**Cause**: Backend service crashed or not running

**Solutions**:
1. Check backend logs in Render dashboard
2. Verify DATABASE_URL environment variable is set
3. Ensure PostgreSQL database is running
4. Check if build command succeeded

### CORS Errors
**Cause**: Frontend origin not allowed by backend

**Solution**:
Server/server.js already includes these origins:
- https://findersnotkeepers.onrender.com
- https://findersnotkeepers-frontend.onrender.com

### Google Auth Not Working
**Causes**:
1. Redirect URIs not configured in Google Cloud Console
2. Backend API URL incorrect in frontend
3. CORS blocking the request

**Solutions**:
1. Update Google Cloud Console (see above)
2. Verify `LiveSite/.env` has correct `VITE_API_URL`
3. Check browser console for CORS errors

### Database Connection Errors
**Cause**: PostgreSQL not accessible or wrong credentials

**Solutions**:
1. Check database is running in Render dashboard
2. Verify `DB_*` environment variables in backend service
3. Database should auto-connect via `fromDatabase` in render.yaml

### Build Failures

**Frontend Build Fails**:
```bash
# Check Node version (Render uses Node 20)
# Verify package.json exists in LiveSite/
# Check build command: cd LiveSite && npm install && npm run build
```

**Backend Build Fails**:
```bash
# Verify package.json exists in Server/
# Check build command: cd Server && npm install
# Ensure all dependencies are in package.json
```

## Environment Variables Reference

### Backend (Auto-configured)
- `NODE_ENV=production`
- `PORT=10000` (Render assigns this)
- `FRONTEND_URL=https://findersnotkeepers.onrender.com`
- `DB_HOST` (from database service)
- `DB_PORT` (from database service)
- `DB_NAME` (from database service)
- `DB_USER` (from database service)
- `DB_PASSWORD` (from database service)
- `JWT_SECRET` (auto-generated)
- `GOOGLE_CLIENT_ID=257643953276-8su4c8tr824kok0k40jd2rbgp5ek6roa.apps.googleusercontent.com`

### Backend (Manual - Add in Dashboard)
- `EMAIL_ADDRESS=miniepe321@gmail.com`
- `EMAIL_PASSWORD=idrbserztfrermdd`

### Frontend (Build-time)
- `VITE_API_URL=https://findersnotkeepers-backend.onrender.com`
- `VITE_GOOGLE_CLIENT_ID=257643953276-8su4c8tr824kok0k40jd2rbgp5ek6roa.apps.googleusercontent.com`

## Costs

### Free Tier Limits
- **Frontend (Static Site)**: FREE forever, no limits
- **Backend (Web Service)**: FREE with limitations:
  - Spins down after 15 minutes of inactivity
  - 750 hours/month free (enough for 1 service 24/7)
  - First request after spin-down takes ~30 seconds
- **Database (PostgreSQL)**: FREE with limitations:
  - 90 days data retention
  - Limited storage (256 MB)
  - Expires after 90 days (can recreate)

### Upgrading (Optional)
- **Starter Plan** ($7/month): No spin-down, more resources
- **Standard Plan** ($25/month): Better database, more storage

## Monitoring

### Check Logs
1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab
4. View real-time logs

### Check Metrics
1. Go to service page
2. Click "Metrics" tab
3. View:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

## Updating the Application

### Method 1: Auto-Deploy (Recommended)
1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update application"
   git push origin main
   ```
3. Render auto-deploys within 1-2 minutes

### Method 2: Manual Deploy
1. Go to Render dashboard
2. Select service
3. Click "Manual Deploy"
4. Choose "Deploy latest commit"

## Database Management

### Access Database
1. Go to Render dashboard
2. Select `findersnotkeepers-db`
3. Click "Connect" → "External Connection"
4. Use provided connection string with tools like pgAdmin or psql

### Run SQL Commands
```bash
# Get connection string from Render dashboard
psql <CONNECTION_STRING>

# Example: Check users
SELECT * FROM users;

# Example: Reset database
DROP TABLE IF EXISTS users CASCADE;
```

### Backup Database
1. Go to database service in Render
2. Click "Backups" tab (paid plans only)
3. For free tier, manually export:
   ```bash
   pg_dump <CONNECTION_STRING> > backup.sql
   ```

## Support

### Render Documentation
- Getting Started: https://render.com/docs/web-services
- Static Sites: https://render.com/docs/static-sites
- PostgreSQL: https://render.com/docs/databases

### Common Issues
- 502 Bad Gateway: https://render.com/docs/troubleshooting-deploys#502-bad-gateway
- Build Failures: https://render.com/docs/troubleshooting-deploys#build-failures
- CORS Issues: Check Server/server.js CORS configuration

### Contact
- Render Support: https://render.com/support
- Community Forum: https://community.render.com/

## Security Notes

1. **Environment Variables**: Never commit sensitive data to Git
2. **Database**: Free tier expires after 90 days - set reminder
3. **Gmail Password**: Using app-specific password (not main password)
4. **JWT Secret**: Auto-generated by Render, rotates on redeploy
5. **HTTPS**: All Render services use HTTPS by default

## Next Steps

After deployment:
1. ✅ Test Google authentication flow
2. ✅ Create a test listing
3. ✅ Test messaging functionality
4. ✅ Verify email notifications work
5. ✅ Set up monitoring/alerts
6. ✅ Document API endpoints
7. ✅ Create user guide

---

**Live URLs:**
- Frontend: https://findersnotkeepers.onrender.com
- Backend API: https://findersnotkeepers-backend.onrender.com
- Health Check: https://findersnotkeepers-backend.onrender.com/api/health
