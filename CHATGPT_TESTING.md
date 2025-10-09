# ChatGPT Testing Guide

## Understanding the SSE Endpoint Behavior

The `/mcp` endpoint uses **Server-Sent Events (SSE)**, which is a persistent connection protocol. When you access it in a browser, it will appear to "spin" or "hang" - **this is normal and expected behavior**. 

SSE connections are designed to:
- Stay open indefinitely
- Stream events in real-time
- Allow the server to push data to the client

## Verifying Your Deployment

### 1. Check the Root Endpoint (Health Check)

```bash
curl https://monkfish-app-4uapu.ondigitalocean.app/
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "Pizzaz MCP Server",
  "endpoints": {
    "mcp": "/mcp",
    "messages": "/mcp/messages",
    "assets": "/assets/*"
  }
}
```

### 2. Check an Asset

```bash
curl -I https://monkfish-app-4uapu.ondigitalocean.app/assets/pizzaz-2d2b.css
```

**Expected Response:**
```
HTTP/1.1 200 OK
Content-Type: text/css
Access-Control-Allow-Origin: *
Cache-Control: public, max-age=31536000
```

### 3. Verify SSE Headers (Optional)

```bash
curl -v https://monkfish-app-4uapu.ondigitalocean.app/mcp 2>&1 | grep -E "HTTP|Content-Type|Access-Control"
```

**Expected Response:**
```
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: *
< Content-Type: text/event-stream
```

The connection will hang after this - that's correct! Press Ctrl+C to exit.

## Connecting ChatGPT

### Step 1: Access ChatGPT Settings

1. Open ChatGPT (web or app)
2. Click your profile icon
3. Go to **Settings** → **Integrations** or **Beta Features**

### Step 2: Add MCP Connection

Look for one of these options:
- "Model Context Protocol"
- "Add MCP Server"
- "Connect to External Server"
- "Add Integration"

### Step 3: Enter Your Server URL

**URL to enter:**
```
https://monkfish-app-4uapu.ondigitalocean.app
```

**Important:**
- ✅ Use the base URL (no `/mcp` suffix)
- ✅ Use `https://` (not `http://`)
- ❌ Don't add `/mcp` at the end - ChatGPT adds this automatically

### Step 4: Test the Connection

After adding the connection, try asking ChatGPT:
```
"Can you show me the Pizzaz widget?"
```

or

```
"Use the render_pizzaz tool to show me a map"
```

## Troubleshooting

### ChatGPT says "Connection failed"

1. **Verify your deployment is running:**
   ```bash
   curl https://monkfish-app-4uapu.ondigitalocean.app/
   ```
   Should return JSON with `"status": "ok"`

2. **Check DigitalOcean logs:**
   - Go to your app in DigitalOcean dashboard
   - Click "Logs" tab
   - Look for errors or connection attempts

3. **Verify the URL in ChatGPT:**
   - Make sure it's `https://monkfish-app-4uapu.ondigitalocean.app`
   - No trailing slash
   - No `/mcp` suffix

### Browser shows "spinning" on /mcp endpoint

**This is normal!** SSE connections stay open. If you want to verify it's working:
- Check the response headers show `Content-Type: text/event-stream`
- Check DigitalOcean logs show "SSE connection request from: ..."

### ChatGPT connects but tools don't work

1. Check the MCP server logs in DigitalOcean
2. Look for errors in tool invocation
3. Verify the widgets are listed when you ask ChatGPT "What MCP tools do you have access to?"

## What ChatGPT Should See

When ChatGPT successfully connects, it should have access to these tools:

1. **render_pizzaz** - Interactive map widget
2. **render_pizzaz_carousel** - Image carousel widget  
3. **render_pizzaz_albums** - Photo albums widget
4. **render_pizzaz_list** - List view widget
5. **render_pizzaz_video** - Video player widget (if included)
6. **render_solar_system** - Solar system visualization
7. **render_todo** - Todo list widget

You can verify by asking: *"What widgets can you show me?"*

## Expected Behavior

✅ **Correct:**
- Root endpoint returns JSON health check
- Assets serve with 200 OK
- `/mcp` endpoint returns SSE headers and keeps connection open
- ChatGPT can connect and list available tools

❌ **Incorrect:**
- Root endpoint returns 404
- `/mcp` endpoint returns 404
- Assets return 404
- Connection times out

## Next Steps

Once ChatGPT is connected:
1. Try rendering different widgets
2. Test the interactive features
3. Check that assets load properly in the widgets
4. Verify map markers, images, etc. display correctly

## Support

If you encounter issues:
1. Check DigitalOcean deployment logs
2. Verify all endpoints return expected responses
3. Ensure environment variables are set correctly
4. Check CORS headers are present on all responses
