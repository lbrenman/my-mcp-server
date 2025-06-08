# Hybrid MCP Server Setup Guide

This setup provides both **stdio** (for Claude Desktop) and **HTTP** (for web interfaces) support for your MCP server.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Directory Structure
```
your-project/
├── server.js          # Your hybrid MCP server
├── package.json       # Dependencies
├── public/            # Web client files
│   └── index.html     # Web client interface
└── README.md          # This file
```

### 3. Save the Web Client
Save the HTML web client as `public/index.html` in your project directory.

## 🔧 Running the Server

### For Claude Desktop (stdio mode)
```bash
# Default mode - runs in stdio mode for Claude Desktop
npm start

# Or explicitly specify stdio mode
npm run start:stdio
```

### For Web Development (HTTP mode)
```bash
# Run in HTTP mode for web clients
npm run start:http

# Or with auto-reload for development
npm run dev
```

### Auto-Detection Mode
```bash
# Automatically detects mode based on environment
# Uses HTTP if PORT env var is set, otherwise stdio
PORT=3000 npm start
```

## 🌐 Claude Desktop Configuration

Add this to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["/path/to/your/server.js"],
      "env": {}
    }
  }
}
```

## 🔗 Web Client Usage

1. **Start HTTP server**: `npm run start:http`
2. **Open web client**: Navigate to `http://localhost:3000` 
3. **Connect**: The client will automatically connect to `http://localhost:3000/mcp`
4. **Test tools**: Use the quick actions or execute tools manually

## 📡 API Endpoints

When running in HTTP mode, the server exposes these endpoints:

- `GET /health` - Health check
- `POST /mcp` - Main MCP endpoint (handles all MCP methods)
- `POST /mcp/initialize` - Initialize MCP session
- `POST /mcp/tools/list` - List available tools
- `POST /mcp/tools/call` - Execute a tool
- `GET /` - Serves the web client

## 🛠️ Available Tools

Your server includes these built-in tools:

- **hello** - Test greeting with personalized message
- **get_weather** - Weather data (requires API key setup)
- **get_joke** - Random programming jokes
- **fetch_url** - Fetch content from any URL
- **calculate_tip** - Tip calculator
- **nasa_apod** - NASA Astronomy Picture of the Day
- **fetch_json_enhanced** - Enhanced JSON fetcher with formatting

## 🔑 API Key Setup

For weather data, replace `'your_api_key_here'` in `server.js` with your OpenWeatherMap API key:

1. Get free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Replace the placeholder in the `getWeather` function

## 🌍 GitHub Codespaces

This hybrid approach works perfectly in GitHub Codespaces:

### For Web Development:
```bash
PORT=3000 npm run start:http
```
Then use the web client through the Codespaces port forwarding.

### For Claude Desktop:
Use VS Code Desktop with the Codespaces extension to connect via stdio.

## 🐛 Troubleshooting

### Connection Issues
- **Web client can't connect**: Ensure server is running in HTTP mode
- **Claude Desktop issues**: Verify stdio mode and file paths
- **CORS errors**: Check that `cors()` middleware is enabled

### Port Issues in Codespaces
- Make sure port 3000 is public in Codespaces
- Use HTTPS URLs (`https://your-codespace-url.app.github.dev`)
- Check Codespaces port forwarding settings

### Tool Execution Errors
- Check tool arguments format (must be valid JSON)
- Verify required parameters are provided
- Check server logs for detailed error messages

## 📝 Example Usage

### Using the Web Client
```javascript
// Connect to server
await mcpClient.connect('http://localhost:3000/mcp');

// List tools
const tools = await mcpClient.listTools();

// Call a tool
const result = await mcpClient.callTool('hello', { name: 'World' });
```

### Direct HTTP Requests
```bash
# Initialize session
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}}}}'

# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# Call a tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"hello","arguments":{"name":"World"}}}'
```

## 🚢 Deployment

### Local Development
```bash
npm run dev  # Auto-reload enabled
```

### Production
```bash
npm run start:http
```

### Environment Variables
- `PORT` - HTTP server port (default: 3000)
- `NODE_ENV` - Environment mode

## 🔄 Extending the Server

To add new tools:

1. Add tool definition to `TOOLS` array
2. Add case in `executeTool` function
3. Implement tool logic
4. Update web client examples if needed

Example:
```javascript
// Add to TOOLS array
{
  name: 'my_new_tool',
  description: 'Does something cool',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'Input parameter' }
    },
    required: ['input']
  }
}

// Add to executeTool function
case 'my_new_tool':
  return await myNewToolFunction(args.input);
```

Your MCP server now supports both Claude Desktop and web development workflows! 🎉