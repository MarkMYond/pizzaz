# Fly.io Deployment Guide for Pizzaz MCP Server

## 🚀 Automated CI/CD Deployment via GitHub

### Prerequisites

1. **Fly.io Account**: Sign up at https://fly.io
2. **GitHub Repository**: Your code pushed to GitHub
3. **Fly.io CLI**: Installed locally (for initial setup)

### Initial Setup (One-time)

#### 1. Install Fly.io CLI (if not already)

```bash
# macOS
brew install flyctl

# Or via shell script
curl -L https://fly.io/install.sh | sh
```

#### 2. Login to Fly.io

```bash
flyctl auth login
```

#### 3. Create the Fly.io App (First time only)

```bash
cd /Users/merry/Documents/projects/Sandpit/Glamp/Pizzaz
flyctl launch --no-deploy
```

When prompted:
- App name: `pizzaz-mcp` (or your preferred name)
- Region: Choose closest to you (e.g., `lhr` for London)
- Skip database setup
- Skip adding any services

#### 4. Get Your Fly.io API Token

```bash
flyctl auth token
```

This will output your API token. Copy it!

#### 5. Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `FLY_API_TOKEN`
5. Value: Paste your Fly.io token
6. Click "Add secret"

### 🎉 Deployment

Once setup is complete, deployment is automatic:

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Deploy to Fly.io"
   git push origin main
   ```

2. **Watch the deployment**:
   - Go to your GitHub repository → Actions tab
   - You'll see the "Deploy to Fly.io" workflow running
   - Takes about 2-3 minutes

3. **Check the deployed app**:
   ```bash
   flyctl status
   flyctl logs
   ```

### 📍 Your MCP Server URL

After deployment, your server will be available at:
```
https://pizzaz-mcp.fly.dev/mcp
```

Use this URL in ChatGPT to connect to your MCP server!

### Manual Deployment (Alternative)

If you prefer to deploy manually without GitHub Actions:

```bash
cd /Users/merry/Documents/projects/Sandpit/Glamp/Pizzaz
flyctl deploy
```

### Useful Commands

```bash
# Check app status
flyctl status

# View logs in real-time
flyctl logs

# SSH into the running container
flyctl ssh console

# Check app info
flyctl info

# Scale the app
flyctl scale count 1

# Stop the app
flyctl scale count 0

# Restart the app
flyctl apps restart pizzaz-mcp
```

### Configuration Files

- **fly.toml**: Fly.io configuration (app name, region, ports)
- **Dockerfile**: Multi-stage build for the MCP server
- **.github/workflows/deploy.yml**: GitHub Actions CI/CD pipeline

### Troubleshooting

**Build fails?**
```bash
# Check logs
flyctl logs

# Try building locally first
docker build -t pizzaz-mcp .
docker run -p 8000:8000 pizzaz-mcp
```

**Health check fails?**
- The health check pings `/mcp` endpoint every 30s
- Make sure your server responds to GET /mcp

**Need to update secrets?**
```bash
flyctl secrets set KEY=value
```

### Cost

- Fly.io free tier includes:
  - 3 shared-cpu VMs with 256MB RAM
  - 160GB bandwidth
  - Auto-scaling to 0 when not in use (saves costs!)

Your MCP server should stay well within free tier limits! 🎉

### Next Steps

1. Complete the initial setup above
2. Push your code to GitHub
3. Watch it deploy automatically!
4. Use the Fly.io URL in ChatGPT
