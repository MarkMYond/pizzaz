# Testing with MCP Inspector

## Current Status

Your MCP server is running locally on `http://localhost:8000/mcp`

## Test with MCP Inspector

MCP Inspector is the official debugging tool for MCP servers. It will show you exactly what's happening with your server.

### Step 1: Install and Run Inspector

Open a NEW terminal window and run:

```bash
npx @modelcontextprotocol/inspector@latest
```

This will:
1. Start the Inspector web interface
2. Open it in your browser automatically
3. Show you a connection dialog

### Step 2: Connect to Your Server

In the Inspector interface:

1. Select **"HTTP"** as the transport type
2. Enter URL: `http://localhost:8000/mcp`
3. Click **"Connect"**

### Step 3: What to Look For

The Inspector will show you:

#### ✅ **If Connection Works:**
- You'll see "Connected" status
- **Tools tab** will list all your tools:
  - `render_pizzaz`
  - `render_pizzaz_carousel`
  - `render_pizzaz_albums`
  - `render_pizzaz_list`
  - `render_pizzaz_video`
  - `render_solar_system`
  - `render_todo`
- **Resources tab** will show your widget HTML resources
- You can click "Call Tool" to test each one

#### ❌ **If Connection Fails:**
- Inspector will show timeout or connection error
- Check the browser console for error messages
- Check your server terminal for connection attempts

### Step 4: Test a Tool

1. Go to the **Tools** tab
2. Select `render_pizzaz`
3. Enter test input: `{"pizzaTopping": "pepperoni"}`
4. Click **"Call Tool"**
5. You should see:
   - Response text: "Rendered a pizza map!"
   - Structured content with the topping
   - HTML widget in the preview pane

### Step 5: Check Server Logs

While Inspector is connected, watch your server terminal. You should see:

```
GET /mcp from localhost:XXXX
SSE connection request from: localhost:XXXX
SSE connection: Starting SSE request handler
SSE connection: Creating MCP server
SSE connection: Creating SSE transport (this will set SSE headers)
SSE connection: Session ID [uuid]
SSE connection: Connecting server to transport for session [uuid]
SSE connection: Successfully connected session [uuid]
POST /mcp/messages from localhost:XXXX
POST message received for session: [uuid]
POST message: Processing for session [uuid]
```

## What This Tells Us

### If Inspector Works:
- ✅ Your MCP server is correctly implemented
- ✅ The SSE transport is working
- ✅ Tools are properly registered
- ❌ The problem is with DigitalOcean deployment or ChatGPT connection

### If Inspector Fails:
- ❌ There's a bug in the server code
- ❌ The SSE transport isn't working correctly
- ❌ Need to fix the server before deploying

## Next Steps After Inspector Testing

### If Inspector Works Locally:

The issue is likely with DigitalOcean. Check:

1. **Proxy Buffering**: DigitalOcean might be buffering SSE responses
2. **Timeouts**: DigitalOcean might have shorter timeouts than localhost
3. **Headers**: Proxy might be stripping important headers

### If Inspector Fails Locally:

Fix the server first:

1. Check the error messages in Inspector
2. Look at server logs for errors
3. Debug the SSE transport setup
4. Verify tool registration

## Stop the Server

When done testing, stop the server:

```bash
# Find the process
lsof -i:8000

# Kill it
kill -9 [PID]
```

Or just press Ctrl+C in the terminal where the server is running.
