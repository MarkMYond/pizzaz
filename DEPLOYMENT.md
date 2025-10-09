# DigitalOcean Deployment Guide

## Prerequisites
- DigitalOcean account
- GitHub repository with this code
- Docker installed locally (for testing)

## Local Testing

The Docker container has been built and tested successfully:

```bash
# Build the image
docker build -t pizzaz-mcp-server .

# Run locally
docker run -p 8000:8000 pizzaz-mcp-server

# Test assets
curl http://localhost:8000/assets/pizzaz-2d2b.css

# Test MCP endpoint
curl http://localhost:8000/mcp
```

## Deployment Steps

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Pizzaz MCP Server"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Deploy to DigitalOcean App Platform

#### Option A: Using the App Spec File

1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Choose "Import from App Spec"
4. Upload `.do/app.yaml`
5. Update the GitHub repo URL in the spec
6. Click "Next" and review settings
7. Click "Create Resources"

#### Option B: Using the UI

1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Select GitHub as source and authorize DigitalOcean
4. Choose your repository and `main` branch
5. Configure the app:
   - **Type**: Web Service
   - **Dockerfile Path**: `Dockerfile`
   - **HTTP Port**: `8000`
   - **Instance Size**: Basic (512 MB RAM / 1 vCPU)
   
6. Set Environment Variables:
   - `BASE_URL`: Will be auto-set to `${APP_URL}` by DigitalOcean
   
7. Configure Health Check (optional but recommended):
   - **HTTP Path**: `/assets/pizzaz-2d2b.css`
   - **Initial Delay**: 30 seconds
   - **Period**: 10 seconds
   
8. Review and click "Create Resources"

### 3. Get Your App URL

After deployment completes (5-10 minutes), you'll get a URL like:
```
https://pizzaz-mcp-server-xxxxx.ondigitalocean.app
```

### 4. Configure ChatGPT

1. Open ChatGPT
2. Go to Settings → Integrations → Add Connection
3. Enter your DigitalOcean App URL (without /mcp suffix)
4. ChatGPT will connect via the `/mcp` endpoint automatically

## Testing the Deployment

```bash
# Replace with your actual URL
APP_URL="https://your-app.ondigitalocean.app"

# Test assets
curl $APP_URL/assets/pizzaz-2d2b.css

# Test MCP endpoint (should return SSE stream)
curl $APP_URL/mcp
```

## Monitoring

- View logs: Go to your app → Logs tab
- View metrics: Go to your app → Insights tab
- Health checks: Automatic via `/assets/pizzaz-2d2b.css`

## Troubleshooting

### Build fails
- Check that all dependencies are in `package.json`
- Verify `pnpm-lock.yaml` is committed

### Server won't start
- Check logs in DigitalOcean dashboard
- Verify port 8000 is exposed in Dockerfile

### Assets 404
- Build may have failed - check build logs
- Verify `pnpm build` runs successfully

### ChatGPT can't connect
- Verify `/mcp` endpoint returns SSE headers
- Check CORS headers are set (Access-Control-Allow-Origin: *)
- Make sure you're using the app URL without /mcp suffix in ChatGPT settings

## Costs

DigitalOcean App Platform pricing (as of 2024):
- **Basic (512 MB RAM)**: ~$5/month
- **Professional (1 GB RAM)**: ~$12/month

Free tier: $0 credit for first month (usually provided to new accounts)

## Updates

To update the deployment:
```bash
git add .
git commit -m "Update description"
git push origin main
```

DigitalOcean will automatically rebuild and redeploy.
