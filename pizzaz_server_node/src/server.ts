import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

import { queryGlampsites } from "./db.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ListResourceTemplatesRequest,
  type ListResourcesRequest,
  type ListToolsRequest,
  type ReadResourceRequest,
  type Resource,
  type ResourceTemplate,
  type Tool
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

type PizzazWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  responseText: string;
};

function widgetMeta(widget: PizzazWidget, structuredContent?: any) {
  const meta: Record<string, any> = {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true
  };
  
  return meta;
}

// Get base URL for assets from environment or use relative path
const baseUrl = process.env.BASE_URL || "";
const assetsUrl = `${baseUrl}/assets`;

// Function to get the current request's base URL
function getBaseUrl(req: IncomingMessage): string {
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  return `${protocol}://${host}`;
}

// Function to generate widget HTML with dynamic asset URLs
function generateWidgetHtml(widgetType: string, baseUrl: string, data?: any): string {
  const assetsUrl = `${baseUrl}/assets`;
  
  switch (widgetType) {
    case "pizza-map":
      return `
<div id="pizzaz-root"></div>
<link rel="stylesheet" href="${assetsUrl}/pizzaz-2d2b.css">
<script type="module" src="${assetsUrl}/pizzaz-2d2b.js"></script>
      `.trim();
    
    case "pizza-carousel":
      return `
<div id="pizzaz-carousel-root"></div>
<link rel="stylesheet" href="${assetsUrl}/pizzaz-carousel-2d2b.css">
<script type="module" src="${assetsUrl}/pizzaz-carousel-2d2b.js"></script>
      `.trim();
    
    case "pizza-albums":
      return `
<div id="pizzaz-albums-root"></div>
<link rel="stylesheet" href="${assetsUrl}/pizzaz-albums-2d2b.css">
<script type="module" src="${assetsUrl}/pizzaz-albums-2d2b.js"></script>
      `.trim();
    
    case "pizza-list":
      return `
<div id="pizzaz-list-root"></div>
<link rel="stylesheet" href="${assetsUrl}/pizzaz-list-2d2b.css">
<script type="module" src="${assetsUrl}/pizzaz-list-2d2b.js"></script>
      `.trim();
    
    case "todo":
      return `
<div id="todo-root"></div>
<link rel="stylesheet" href="${assetsUrl}/todo-2d2b.css">
<script type="module" src="${assetsUrl}/todo-2d2b.js"></script>
      `.trim();

    case "glampsite-search":
      return `
<div id="glampsite-carousel-root" style="min-height: 400px;"></div>
<link rel="stylesheet" href="${assetsUrl}/glampsite-carousel-2d2b.css">
<script type="module" src="${assetsUrl}/glampsite-carousel-2d2b.js"></script>
      `.trim();

    case "glampskele-carousel":
      return `
<div id="root" style="min-height: 400px;"></div>
<link rel="stylesheet" href="${assetsUrl}/glampskele-carousel-2d2b.css">
<script type="module" src="${assetsUrl}/glampskele-carousel-2d2b.js"></script>
      `.trim();

    default:
      return `<div>Widget not found</div>`;
  }
}

const widgets: PizzazWidget[] = [
  {
    id: "pizza-map",
    title: "Show Pizza Map",
    templateUri: "ui://widget/pizza-map.html",
    invoking: "Hand-tossing a map",
    invoked: "Take a look",
    html: "", // Will be generated dynamically
    responseText: "Take a look and ask anything"
  },
  {
    id: "pizza-carousel",
    title: "Show Pizza Carousel",
    templateUri: "ui://widget/pizza-carousel.html",
    invoking: "Finding pizza spots",
    invoked: "Take a look",
    html: "", // Will be generated dynamically
    responseText: "Take a look and ask anything"
  },
  {
    id: "pizza-albums",
    title: "Show Pizza Album",
    templateUri: "ui://widget/pizza-albums.html",
    invoking: "Finding albums",
    invoked: "Take a look",
    html: "", // Will be generated dynamically
    responseText: "Take a look and ask anything"
  },
  {
    id: "pizza-list",
    title: "Show Pizza List",
    templateUri: "ui://widget/pizza-list.html",
    invoking: "Finding pizza places",
    invoked: "Take a look",
    html: "", // Will be generated dynamically
    responseText: "Take a look and ask anything"
  },
  {
    id: "todo",
    title: "Show Todo",
    templateUri: "ui://widget/todo.html",
    invoking: "Creating todo",
    invoked: "Take a look",
    html: "", // Will be generated dynamically
    responseText: "Take a look and ask anything"
  },
  {
    id: "glampsite-search",
    title: "Search Glamping Sites",
    templateUri: "ui://widget/glampsite-carousel.html",
    invoking: "Finding glampsites",
    invoked: "Glampsite booking tool",
    html: "", // Will be generated dynamically
    responseText: "Take a look and ask anything"
  },
  {
    id: "glampskele-carousel",
    title: "Glampsite Skeleton Carousel",
    templateUri: "ui://widget/glampskele-carousel.html",
    invoking: "Finding glampsites",
    invoked: "Here are some glampsites",
    html: "", // Will be generated dynamically
    responseText: "Here are some glampsites"
  }
];

const widgetsById = new Map<string, PizzazWidget>();
const widgetsByUri = new Map<string, PizzazWidget>();

widgets.forEach((widget) => {
  widgetsById.set(widget.id, widget);
  widgetsByUri.set(widget.templateUri, widget);
});

const toolInputSchema = {
  type: "object",
  properties: {
    pizzaTopping: {
      type: "string",
      description: "Topping to mention when rendering the widget."
    },
    caption: {
      type: "string",
      description: "Use a brief, friendly message. and do not repeat a list of items from the data, that is for UI hydration"
    },
    no_prose: {
      type: "boolean",
      description: "Set to true to suppress additional narrative. ALWAYS set this to true to prevent verbose output."
    }
  },
  required: ["pizzaTopping"],
  additionalProperties: false
} as const;

const toolInputParser = z.object({
  pizzaTopping: z.string(),
  caption: z.string().optional(),
  no_prose: z.boolean().optional()
});

// Schema for the data fetching tool
const fetchDataInputSchema = {
  type: "object",
  properties: {
    region: {
      type: "string",
      description: "Region to fetch glampsite data for"
    }
  },
  required: ["region"],
  additionalProperties: false
} as const;

const fetchDataInputParser = z.object({
  region: z.string()
});

const tools: Tool[] = [
  ...widgets.map((widget) => ({
    name: widget.id,
    description: `${widget.title}. IMPORTANT: Always set no_prose=true and provide a caption to control output text.`,
    inputSchema: toolInputSchema,
    title: widget.title,
    _meta: widgetMeta(widget)
  })),
  // Add data-fetching tool that can be called by widgets
  {
    name: "fetch-glampsite-data",
    description: "Fetch glampsite data for a specific region. This tool can be called by widgets to load data.",
    inputSchema: fetchDataInputSchema,
    title: "Fetch Glampsite Data",
    _meta: {
      "openai/canBeInitiatedByComponent": true  // Allow widgets to call this
    }
  }
];

const resources: Resource[] = widgets.map((widget) => ({
  uri: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetMeta(widget)
}));

const resourceTemplates: ResourceTemplate[] = widgets.map((widget) => ({
  uriTemplate: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetMeta(widget)
}));

function createPizzazServer(): Server {
  const server = new Server(
    {
      name: "pizzaz-node",
      version: "0.1.0"
    },
    {
      capabilities: {
        resources: {},
        tools: {}
      }
    }
  );

  server.setRequestHandler(ListResourcesRequestSchema, async (_request: ListResourcesRequest) => ({
    resources
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request: ReadResourceRequest) => {
    const widget = widgetsByUri.get(request.params.uri);

    if (!widget) {
      throw new Error(`Unknown resource: ${request.params.uri}`);
    }

    // Use the production URL for Fly.io deployment
    const productionUrl = process.env.FLY_APP_NAME 
      ? `https://${process.env.FLY_APP_NAME}.fly.dev`
      : "https://pizzaz-mcp.fly.dev";
    
    const defaultHtml = generateWidgetHtml(widget.id, productionUrl);
    
    console.log(`📄 Serving widget HTML for ${widget.id} with URL: ${productionUrl}`);

    return {
      contents: [
        {
          uri: widget.templateUri,
          mimeType: "text/html+skybridge",
          text: defaultHtml,
          _meta: widgetMeta(widget)
        }
      ]
    };
  });

  server.setRequestHandler(ListResourceTemplatesRequestSchema, async (_request: ListResourceTemplatesRequest) => ({
    resourceTemplates
  }));

  server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => ({
    tools
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const widget = widgetsById.get(request.params.name);

    if (!widget) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    const args = toolInputParser.parse(request.params.arguments ?? {});

    // For SSE, use default localhost URL
    const defaultHtml = generateWidgetHtml(widget.id, "http://localhost:8000");

    return {
      content: [
        {
          type: "text",
          text: defaultHtml
        }
      ],
      structuredContent: {
        pizzaTopping: args.pizzaTopping
      },
      _meta: widgetMeta(widget)
    };
  });

  return server;
}

type SessionRecord = {
  server: Server;
  transport: SSEServerTransport;
};

const sessions = new Map<string, SessionRecord>();

const ssePath = "/mcp";
const postPath = "/mcp/messages";

async function handleStreamableHttpRequest(req: IncomingMessage, res: ServerResponse) {
  console.log("Streamable HTTP: Processing JSON-RPC request");
  
  try {
    // Read the request body first
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    console.log("Streamable HTTP: Received request body:", body);
    
    // Parse the JSON-RPC request
    const request = JSON.parse(body);
    console.log("Streamable HTTP: Parsed request:", request);

    // Handle the request based on method
    let response;
    
    if (request.method === "initialize") {
      response = {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          protocolVersion: "2025-06-18",
          capabilities: {
            tools: {},
            resources: {}
          },
          serverInfo: {
            name: "Pizzaz MCP Server",
            version: "1.0.0"
          }
        }
      };
    } else if (request.method === "notifications/initialized") {
      // This is a notification, no response needed
      console.log("Streamable HTTP: Received initialized notification");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);
      res.end();
      return;
    } else if (request.method === "tools/list") {
      // Create server to get tools list
      const server = createPizzazServer();
      response = {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          tools: tools
        }
      };
    } else if (request.method === "tools/call") {
      // Handle tool calls
      const server = createPizzazServer();
      try {
        const toolName = request.params?.name;
        const toolArgs = request.params?.arguments || {};
        
        // Handle data-fetching tool separately
        if (toolName === "fetch-glampsite-data") {
          console.log(`\n🔧 Data fetch tool called`);
          const fetchArgs = fetchDataInputParser.parse(toolArgs);
          console.log(`📦 Fetching data for region:`, fetchArgs.region);
          
          try {
            const dbResults = await queryGlampsites(fetchArgs.region);
            console.log(`📊 DB returned ${dbResults.length} sites`);
            
            const places = dbResults.map(site => ({
              id: site._id?.toString() || site.id || 'unknown',
              name: site.name,
              coords: site.location?.coordinates || [0, 0],
              description: site.description || '',
              city: site.region || site.city || 'UK',
              rating: site.rating || 4.5,
              price: site.priceRange || '$$',
              thumbnail: site.images?.[0] || site.thumbnail || 'https://picsum.photos/400/400'
            }));
            
            response = {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                content: [{
                  type: "text",
                  text: `Fetched ${places.length} glampsites`
                }],
                structuredContent: { places }
              }
            };
          } catch (error) {
            console.error('Data fetch error:', error);
            response = {
              jsonrpc: "2.0",
              id: request.id,
              error: {
                code: -32603,
                message: String(error)
              }
            };
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(response));
          return;
        }
        
        // Handle regular widget tools
        const widget = widgetsById.get(toolName);
        if (!widget) {
          throw new Error(`Unknown tool: ${toolName}`);
        }

        const args = toolInputParser.parse(toolArgs);

        // Use caption and no_prose from request - these control ChatGPT's display behavior
        const caption = args.caption ?? "";
        const no_prose = args.no_prose ?? true;

        // Generate appropriate structured content based on widget type
        let structuredContent;

        // LOG which tool was called
        console.log(`\n🔧 Tool called: ${toolName}`);
        console.log(`📦 Args:`, JSON.stringify(args, null, 2));
        console.log(`📝 Caption: "${caption}", no_prose: ${no_prose}`);

        if (toolName === "glampsite-search") {
          console.log(`✅ glampsite-search executing...`);
          const searchQuery = args.pizzaTopping;
          console.log(`🔍 Querying glampsites for: ${searchQuery}`);
          
          try {
            const dbResults = await queryGlampsites(searchQuery);
            console.log(`📊 DB returned ${dbResults.length} sites`);
            
            // Return data immediately with _loading: false
            structuredContent = {
              places: dbResults.map(site => ({
                id: site._id?.toString() || site.id || 'unknown',
                name: site.name,
                thumbnail: site.images?.[0] || site.thumbnail || 'https://picsum.photos/400/300',
                location: site.region || site.city || 'UK',
                rating: site.rating || 4.5,
                description: site.description || ''
              })),
              _loading: false
            };
            console.log(`🏕️ Returning ${structuredContent.places.length} glampsites with _loading: false`);
          } catch (error) {
            console.error('❌ Error querying glampsites:', error);
            structuredContent = {
              places: [],
              _loading: false
            };
          }
          
        } else if (toolName === "pizza-list") {
          // Pizza list expects an array of places/items
          const toppings = args.pizzaTopping.split(',').map(t => t.trim()).filter(Boolean);
          structuredContent = {
            places: toppings.map((topping, i) => ({
              id: i + 1,
              name: `${topping} Pizza Place`,
              location: "New York, NY",
              rating: (4.0 + Math.random()).toFixed(1),
              description: `Delicious ${topping.toLowerCase()} pizza served fresh`
            }))
          };
        } else if (toolName === "pizza-albums") {
          // Albums widget expects album data
          const toppings = args.pizzaTopping.split(',').map(t => t.trim()).filter(Boolean);
          structuredContent = {
            albums: toppings.map((topping, i) => ({
              id: i + 1,
              title: `${topping} Pizza Collection`,
              artist: "Pizza Chef",
              year: 2024,
              genre: "Culinary",
              imageUrl: `https://picsum.photos/300/300?random=${i}`,
              description: `A delicious collection featuring ${topping.toLowerCase()} pizza`
            }))
          };
        } else if (toolName === "pizza-carousel") {
          // Carousel expects places/locations
          const toppings = args.pizzaTopping.split(',').map(t => t.trim()).filter(Boolean);
          structuredContent = {
            places: toppings.map((topping, i) => ({
              id: i + 1,
              name: `${topping} Pizza Spot`,
              image: `https://picsum.photos/400/300?random=${i + 10}`,
              location: ["NYC", "LA", "Chicago", "Miami", "Seattle"][i % 5],
              rating: (4.0 + Math.random()).toFixed(1),
              specialty: `${topping} Pizza`
            }))
          };
        } else if (toolName === "pizza-map") {
          // Map widget expects markers/places with coordinates
          const toppings = args.pizzaTopping.split(',').map(t => t.trim()).filter(Boolean);
          structuredContent = {
            places: toppings.map((topping, i) => ({
              id: i + 1,
              name: `${topping} Pizza Place`,
              lat: 40.7589 + (Math.random() - 0.5) * 0.1,
              lng: -73.9851 + (Math.random() - 0.5) * 0.1,
              address: `${100 + i} ${topping} Street, NYC`,
              rating: (4.0 + Math.random()).toFixed(1),
              specialty: `${topping} Pizza`
            }))
          };
        } else if (toolName === "glampskele-carousel") {
          // Glampskele-carousel - return empty places immediately for instant skeletons
          // Widget always starts with 5 skeleton cards
          console.log(`✅ glampskele-carousel executing (instant widget with skeletons)...`);
          const searchQuery = args.pizzaTopping;
          
          // Return empty places array immediately - skeletons will show
          structuredContent = {
            places: []
          };
          console.log(`🏕️ Widget ready with skeletons, search: ${searchQuery}`);
        } else {
          // Default structured content for other widgets
          structuredContent = {
            pizzaTopping: args.pizzaTopping,
            items: args.pizzaTopping.split(',').map(t => t.trim()).filter(Boolean).map(topping => ({
              title: topping,
              description: `Delicious ${topping.toLowerCase()} topping`
            }))
          };
        }

        const baseUrl = getBaseUrl(req);
        const dynamicHtml = generateWidgetHtml(toolName, baseUrl);

        // Add caption and no_prose to suppress ChatGPT verbosity
        const result = {
          content: [
            {
              type: "text",
              text: dynamicHtml
            }
          ],
          structuredContent: structuredContent,
          caption: caption || "",           // Use provided caption or empty string
          no_prose: no_prose ?? true,       // Default to true to suppress verbose output
          _meta: widgetMeta(widget, null)
        };

        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: result
        };
      } catch (error) {
        response = {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32603,
            message: String(error)
          }
        };
      }
    } else if (request.method === "resources/list") {
      response = {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          resources: resources
        }
      };
    } else if (request.method === "resources/read") {
      // Handle resource reads
      try {
        const resourceUri = request.params?.uri;
        const widget = widgetsByUri.get(resourceUri);
        
        if (!widget) {
          throw new Error(`Unknown resource: ${resourceUri}`);
        }

        const baseUrl = getBaseUrl(req);
        const dynamicHtml = generateWidgetHtml(widget.id, baseUrl);

        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            contents: [
              {
                uri: resourceUri,
                mimeType: "text/html",
                text: dynamicHtml
              }
            ]
          }
        };
      } catch (error) {
        response = {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32603,
            message: String(error)
          }
        };
      }
    } else if (request.method === "resources/templates/list") {
      // Resource templates are not used in this server
      response = {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          resourceTemplates: []
        }
      };
    } else {
      response = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`
        }
      };
    }

    console.log("Streamable HTTP: Sending response:", response);
    
    // Set headers and send response
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Type", "application/json");
    res.writeHead(200);
    res.end(JSON.stringify(response));
    
  } catch (error) {
    console.error("Streamable HTTP error:", error);
    const errorResponse = {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32603,
        message: "Internal error",
        data: String(error)
      }
    };
    
    if (!res.headersSent) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json");
      res.writeHead(500);
    }
    res.end(JSON.stringify(errorResponse));
  }
}

async function handleSseRequest(res: ServerResponse) {
  console.log("SSE connection: Starting SSE request handler");
  
  // Set CORS and connection headers before transport takes over
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx/proxy buffering
  
  console.log("SSE connection: Creating MCP server");
  const server = createPizzazServer();
  
  console.log("SSE connection: Creating SSE transport (this will set SSE headers)");
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  console.log(`SSE connection: Session ID ${sessionId}`);
  sessions.set(sessionId, { server, transport });

  transport.onclose = async () => {
    console.log(`SSE connection closed: Session ${sessionId}`);
    sessions.delete(sessionId);
    await server.close();
  };

  transport.onerror = (error) => {
    console.error("SSE transport error", error);
  };

  try {
    console.log(`SSE connection: Connecting server to transport for session ${sessionId}`);
    await server.connect(transport);
    console.log(`SSE connection: Successfully connected session ${sessionId}`);
  } catch (error) {
    sessions.delete(sessionId);
    console.error("Failed to start SSE session", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to establish SSE connection");
    }
  }
}

async function handlePostMessage(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  const sessionId = url.searchParams.get("sessionId");

  console.log(`POST message received for session: ${sessionId}`);

  if (!sessionId) {
    console.error("POST message missing sessionId");
    res.writeHead(400).end("Missing sessionId query parameter");
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    console.error(`POST message: Session ${sessionId} not found`);
    res.writeHead(404).end("Session not found");
    return;
  }

  console.log(`POST message: Processing for session ${sessionId}`);
  await session.transport.handlePostMessage(req, res);
}

const portEnv = Number(process.env.PORT ?? 8000);
const port = Number.isFinite(portEnv) ? portEnv : 8000;

// Get the directory paths - assets are in the parent directory of pizzaz_server_node
const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const assetsDir = join(__dirname, "..", "..", "assets");

console.log("Assets directory:", assetsDir);

// MIME types for static files
const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

async function serveStaticFile(filePath: string, res: ServerResponse) {
  try {
    console.log("Attempting to serve:", filePath);
    const content = await readFile(filePath);
    const ext = extname(filePath);
    const mimeType = mimeTypes[ext] || "application/octet-stream";
    
    res.writeHead(200, {
      "Content-Type": mimeType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=31536000"
    });
    res.end(content);
  } catch (error) {
    console.error("File not found:", filePath, error);
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
}

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
  
  console.log(`${req.method} ${url.pathname} from ${req.headers.origin || req.headers.host}`);

  if (req.method === "OPTIONS" && (url.pathname === ssePath || url.pathname === postPath)) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, authorization, x-requested-with",
      "Access-Control-Max-Age": "86400"
    });
    res.end();
    return;
  }

  // Handle new Streamable HTTP protocol: POST to /mcp
  if (req.method === "POST" && url.pathname === ssePath) {
    console.log("Streamable HTTP POST request to /mcp from:", req.headers.origin || req.headers.host);
    await handleStreamableHttpRequest(req, res);
    return;
  }

  // Handle old HTTP+SSE protocol: GET to /mcp
  if (req.method === "GET" && url.pathname === ssePath) {
    console.log("Legacy SSE (GET) connection request from:", req.headers.origin || req.headers.host);
    await handleSseRequest(res);
    return;
  }

  if (req.method === "POST" && url.pathname === postPath) {
    await handlePostMessage(req, res, url);
    return;
  }

  // Serve static assets
  if (req.method === "GET" && url.pathname.startsWith("/assets/")) {
    const fileName = url.pathname.replace("/assets/", "");
    const filePath = join(assetsDir, fileName);
    await serveStaticFile(filePath, res);
    return;
  }

  // API endpoint for fetching glampsite data
  if (req.method === "GET" && url.pathname === "/api/glampsites") {
    const region = url.searchParams.get("region") || "UK";
    console.log(`🔍 API request for glampsites in region: ${region}`);
    
    try {
      const dbResults = await queryGlampsites(region);
      console.log(`📊 API returned ${dbResults.length} sites`);
      
      const places = dbResults.map(site => ({
        id: site._id?.toString() || site.id || 'unknown',
        name: site.name,
        coords: site.location?.coordinates || [0, 0],
        description: site.description || '',
        city: site.region || site.city || 'UK',
        rating: site.rating || 4.5,
        price: site.priceRange || '$$',
        thumbnail: site.images?.[0] || site.thumbnail || 'https://picsum.photos/400/400'
      }));
      
      res.writeHead(200, { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      });
      res.end(JSON.stringify({ places }));
    } catch (error) {
      console.error('API error:', error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to fetch glampsites" }));
    }
    return;
  }

  // Root endpoint - health check
  if (url.pathname === "/" || url.pathname === "") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      service: "Pizzaz MCP Server",
      endpoints: {
        mcp: "/mcp",
        messages: "/mcp/messages",
        assets: "/assets/*"
      }
    }));
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.on("clientError", (err: Error, socket) => {
  console.error("HTTP client error", err);
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

// Set longer timeout for SSE connections
httpServer.timeout = 0; // Disable timeout for SSE
httpServer.keepAliveTimeout = 0;
httpServer.headersTimeout = 0;


// Listen only on port 8000
httpServer.listen(8000, "0.0.0.0", () => {
  console.log(`Pizzaz MCP server listening on http://0.0.0.0:8000`);
  console.log(`  SSE stream: GET http://0.0.0.0:8000${ssePath}`);
  console.log(`  Message post endpoint: POST http://0.0.0.0:8000${postPath}?sessionId=...`);
});
