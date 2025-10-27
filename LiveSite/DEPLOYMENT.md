# Render Deployment Guide - FindNotKeep Frontend

## Prerequisites
- GitHub account
- Render account (free tier available at render.com)
- Your code pushed to GitHub

## Step 1: Push to GitHub

Make sure your latest code is pushed to GitHub:

```bash
# From the root of your project
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. Go to https://render.com and sign in
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select the repository: `EDITING_Findnotkeep`
5. Render will automatically detect the `render.yaml` file in `Frontend/findnotkeep/`
6. Click "Apply" to start deployment

### Option B: Manual Setup

1. Go to https://render.com and sign in
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure the following:
   - **Name**: `findnotkeep` (or any name you prefer)
   - **Root Directory**: `Frontend/findnotkeep`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Click "Create Static Site"

## Step 3: Wait for Deployment

- First deployment takes 2-5 minutes
- Render will install dependencies and build your app
- You'll get a free subdomain: `https://findnotkeep-xxxxx.onrender.com`

## Step 4: Verify Deployment

1. Click the URL provided by Render
2. Test navigation (all routes should work thanks to the `_redirects` file)
3. Test creating a listing (localStorage will work)
4. Check all pages load correctly

## For Your Demo (October 20, 2025)

### Current Setup (Recommended for Demo)
- **Frontend**: Deployed on Render (always available)
- **Backend**: Run locally on your laptop
- **Database**: MySQL running locally

### Connecting Frontend to Local Backend During Demo

If you want the deployed frontend to talk to your local backend:

1. **Start your backend locally** with CORS enabled for your Render domain
2. **Use ngrok** to expose your local backend:
   ```bash
   ngrok http 5000
   ```
3. **Update frontend** to use the ngrok URL (you can do this via environment variable)

### Alternative: Run Everything Locally
If Render has issues during demo, you can always run:
```bash
cd Frontend/findnotkeep
npm run dev
```
And demo from `http://localhost:5173`

## Free Tier Limitations

Render free tier includes:
- ✅ Static sites don't sleep (unlike backend services)
- ✅ Global CDN distribution
- ✅ Automatic SSL certificate
- ✅ Unlimited bandwidth (reasonable use)
- ✅ Very reliable for static content

## Troubleshooting

### Build Fails
- Check that `package.json` and `package-lock.json` are committed
- Verify Node version compatibility (Render uses Node 20 by default)

### Routes Don't Work (404 errors)
- Verify `_redirects` file exists in `public/` folder
- Check that it was copied to `dist/` during build

### Custom Domain (Optional)
1. In Render dashboard → Settings → Custom Domain
2. Add your domain and follow DNS instructions

## Cost Considerations

**FREE OPTION (Current Setup):**
- Frontend on Render: **$0/month** ✅
- Run backend locally during demo
- No ongoing costs

**PAID OPTION (If you want backend deployed too):**
- Frontend: $0/month
- Backend Web Service: $7/month
- Database: $7/month for PostgreSQL (or use external MySQL)
- **Total: ~$14/month**

## Recommendation for Your Demo

Stick with the **FREE** option:
1. Deploy frontend to Render (done!)
2. Run backend + MySQL locally during demo
3. No risk of backend service sleeping during demo
4. Full control over database and API

Your Render URL will always be live and fast!
