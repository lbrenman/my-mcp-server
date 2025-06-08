#!/usr/bin/env node

// Load environment variables from .env file
import 'dotenv/config';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create server instance
const server = new Server(
  {
    name: 'my-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const TOOLS = [
  {
    name: 'hello',
    description: 'Say hello with a personalized message',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name to greet',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_weather',
    description: 'Get current weather for a city using OpenWeatherMap API',
    inputSchema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'City name to get weather for',
        },
        units: {
          type: 'string',
          description: 'Temperature units (metric, imperial, kelvin)',
          enum: ['metric', 'imperial', 'kelvin'],
          default: 'metric',
        },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_joke',
    description: 'Fetch a random programming joke from an API',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'fetch_url',
    description: 'Fetch content from any public URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to fetch content from',
        },
        method: {
          type: 'string',
          description: 'HTTP method',
          enum: ['GET', 'POST'],
          default: 'GET',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'calculate_tip',
    description: 'Calculate tip amount for a bill',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Bill amount',
        },
        percentage: {
          type: 'number',
          description: 'Tip percentage (default 15)',
          default: 15,
        },
      },
      required: ['amount'],
    },
  },
  {
    name: 'nasa_apod',
    description: 'Get NASA Astronomy Picture of the Day with image display',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (optional, defaults to today)',
        },
        api_key: {
          type: 'string',
          description: 'NASA API key (optional, defaults to DEMO_KEY)',
          default: 'DEMO_KEY',
        },
      },
    },
  },
  {
    name: 'fetch_json_enhanced',
    description: 'Fetch and parse JSON from URL with better formatting',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to fetch JSON from',
        },
      },
      required: ['url'],
    },
  },
];

// Helper functions
async function getWeather(city, units = 'metric') {
  try {
    // Get API key from environment variable
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      return {
        content: [
          {
            type: 'text',
            text: `Weather service not configured. To use this feature, get a free API key from OpenWeatherMap and add OPENWEATHER_API_KEY=your_key to your .env file. For now, here's a demo response: ${city} is probably sunny and 22°C! ☀️`,
          },
        ],
      };
    }

    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        q: city,
        units: units,
        appid: apiKey
      }
    });

    const weather = response.data;
    const temp = weather.main.temp;
    const description = weather.weather[0].description;
    const unitSymbol = units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K';

    return {
      content: [
        {
          type: 'text',
          text: `Weather in ${city}: ${temp}${unitSymbol}, ${description}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Weather service unavailable. To use this feature, get a free API key from OpenWeatherMap and replace 'your_api_key_here' in the code. For now, here's a demo response: ${city} is probably sunny and 22°C! ☀️`,
        },
      ],
    };
  }
}

async function getJoke() {
  try {
    const response = await axios.get('https://official-joke-api.appspot.com/jokes/programming/random');
    const joke = response.data[0];
    
    return {
      content: [
        {
          type: 'text',
          text: `${joke.setup}\n\n${joke.punchline} 😄`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Couldn't fetch a joke right now, but here's one for you: Why do programmers prefer dark mode? Because light attracts bugs! 🐛`,
        },
      ],
    };
  }
}

async function fetchUrl(url, method = 'GET') {
  try {
    const response = await axios({
      method: method,
      url: url,
      timeout: 10000,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Response from ${url}:\nStatus: ${response.status}\nContent Type: ${response.headers['content-type']}\n\nContent Preview:\n${JSON.stringify(response.data).substring(0, 500)}...`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error fetching ${url}: ${error.message}`,
        },
      ],
    };
  }
}

function calculateTip(amount, percentage = 15) {
  const tipAmount = (amount * percentage) / 100;
  const total = amount + tipAmount;
  
  return {
    content: [
      {
        type: 'text',
        text: `Bill: $${amount.toFixed(2)}\nTip (${percentage}%): $${tipAmount.toFixed(2)}\nTotal: $${total.toFixed(2)}`,
      },
    ],
  };
}

async function getNasaApod(date, apiKey = 'DEMO_KEY') {
  try {
    // Allow override from environment variable
    const finalApiKey = apiKey === 'DEMO_KEY' ? (process.env.NASA_API_KEY || 'DEMO_KEY') : apiKey;
    
    console.error(`Fetching NASA APOD with date: ${date}, apiKey: ${finalApiKey}`);
    
    const params = { api_key: finalApiKey };
    if (date) {
      params.date = date;
    }

    const response = await axios.get('https://api.nasa.gov/planetary/apod', { 
      params,
      timeout: 15000 
    });
    
    const apod = response.data;
    console.error(`NASA APOD response:`, JSON.stringify(apod, null, 2));

    if (!apod.title || !apod.explanation || !apod.date) {
      throw new Error('Invalid API response: missing required fields');
    }

    const content = [];

    let mainText = `🚀 **NASA Astronomy Picture of the Day**\n\n`;
    mainText += `**Date:** ${apod.date}\n`;
    mainText += `**Title:** ${apod.title}\n\n`;
    mainText += `**Explanation:** ${apod.explanation}\n\n`;
    
    if (apod.copyright) {
      mainText += `**Copyright:** ${apod.copyright}\n\n`;
    }

    content.push({
      type: 'text',
      text: mainText,
    });

    if (apod.media_type === 'image') {
      const imageUrl = apod.url || apod.hdurl;
      
      if (imageUrl) {
        try {
          content.push({
            type: 'image',
            source: {
              type: 'url',
              url: imageUrl,
            },
            alt_text: apod.title || 'NASA APOD Image'
          });
          
          content.push({
            type: 'text',
            text: `**Image URL:** ${imageUrl}\n**HD URL:** ${apod.hdurl || 'Not available'}`,
          });
        } catch (imageError) {
          console.error('Error adding image:', imageError);
          content.push({
            type: 'text',
            text: `**Image URL:** ${imageUrl}\n**HD URL:** ${apod.hdurl || 'Not available'}\n\n*Note: Image could not be displayed directly, but you can view it at the URL above.*`,
          });
        }
      }
    } else if (apod.media_type === 'video') {
      content.push({
        type: 'text',
        text: `**Video URL:** ${apod.url}\n\n*This is a video - click the link above to view it.*`,
      });
    } else {
      content.push({
        type: 'text',
        text: `**Media Type:** ${apod.media_type}\n**URL:** ${apod.url || 'Not available'}`,
      });
    }

    return { content };

  } catch (error) {
    console.error('NASA APOD Error:', error);
    
    let errorMessage = `Error fetching NASA APOD: ${error.message}`;
    
    if (error.response) {
      errorMessage += `\nHTTP Status: ${error.response.status}`;
      if (error.response.data) {
        errorMessage += `\nAPI Error: ${JSON.stringify(error.response.data)}`;
      }
    }
    
    if (error.message.includes('timeout')) {
      errorMessage += '\n\nThe NASA API is taking too long to respond. Please try again.';
    } else if (error.response?.status === 429) {
      errorMessage += '\n\nAPI rate limit exceeded. The DEMO_KEY has limited usage. Try again in a moment or get a free API key from https://api.nasa.gov/';
    }

    return {
      content: [
        {
          type: 'text',
          text: errorMessage,
        },
      ],
    };
  }
}

async function fetchJsonEnhanced(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    
    const jsonString = JSON.stringify(response.data, null, 2);
    
    return {
      content: [
        {
          type: 'text',
          text: `📊 **JSON Response from ${url}**\n\n**Status:** ${response.status}\n**Content Type:** ${response.headers['content-type']}\n\n**Data:**\n\`\`\`json\n${jsonString}\n\`\`\``,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error fetching JSON from ${url}: ${error.message}`,
        },
      ],
    };
  }
}

// Common tool execution logic
async function executeTool(name, args) {
  try {
    switch (name) {
      case 'hello':
        return {
          content: [
            {
              type: 'text',
              text: `Hello, ${args.name}! 👋 This is a response from your MCP server. The server is working correctly!`,
            },
          ],
        };

      case 'get_weather':
        return await getWeather(args.city, args.units);

      case 'get_joke':
        return await getJoke();

      case 'fetch_url':
        return await fetchUrl(args.url, args.method);

      case 'calculate_tip':
        return calculateTip(args.amount, args.percentage);

      case 'nasa_apod':
        return await getNasaApod(args.date, args.api_key);

      case 'fetch_json_enhanced':
        return await fetchJsonEnhanced(args.url);

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    throw new McpError(ErrorCode.InternalError, `Error executing tool: ${error.message}`);
  }
}

// Set up MCP server handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return await executeTool(name, args);
});

// HTTP Server Setup
function setupHttpServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // MCP Initialize endpoint
  app.post('/mcp/initialize', (req, res) => {
    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'my-mcp-server',
          version: '1.0.0'
        }
      }
    });
  });

  // MCP Tools List endpoint
  app.post('/mcp/tools/list', (req, res) => {
    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        tools: TOOLS
      }
    });
  });

  // MCP Tools Call endpoint
  app.post('/mcp/tools/call', async (req, res) => {
    try {
      const { name, arguments: args } = req.body.params;
      const result = await executeTool(name, args);
      
      res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result: result
      });
    } catch (error) {
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body.id,
        error: {
          code: error.code || -32603,
          message: error.message || 'Internal error'
        }
      });
    }
  });

  // Generic MCP endpoint that handles all MCP methods
  app.post('/mcp', async (req, res) => {
    try {
      const { method, params, id } = req.body;

      let result;
      
      switch (method) {
        case 'initialize':
          result = {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'my-mcp-server',
              version: '1.0.0'
            }
          };
          break;
          
        case 'tools/list':
          result = {
            tools: TOOLS
          };
          break;
          
        case 'tools/call':
          result = await executeTool(params.name, params.arguments);
          break;
          
        default:
          throw new Error(`Unknown method: ${method}`);
      }

      res.json({
        jsonrpc: '2.0',
        id: id,
        result: result
      });
    } catch (error) {
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body.id,
        error: {
          code: error.code || -32603,
          message: error.message || 'Internal error'
        }
      });
    }
  });

  return app;
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'auto';

  if (mode === 'http' || (mode === 'auto' && process.env.PORT)) {
    // HTTP mode
    const app = setupHttpServer();
    const port = process.env.PORT || 3000;
    
    app.listen(port, () => {
      console.error(`MCP HTTP Server running on port ${port}`);
      console.error(`Health check: http://localhost:${port}/health`);
      console.error(`MCP endpoint: http://localhost:${port}/mcp`);
    });
  } else {
    // Stdio mode (for Claude Desktop)
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Enhanced MCP Server started successfully!');
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});