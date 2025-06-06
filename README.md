# Nodejs MCP Server Example

## To run the server
* Clone project locally
* Run `npm install`
* Run `node server.js`

## To connect to Claude Desktop
* Open Claude Desktop
* Click on the Claude menu → Settings
* Go to the "Developer" tab
* Add your MCP server configuration:

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["/full/path/to/your/project/server.js"]
    }
  }
}
```

For example:

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "/Users/leorbrenman/.nvm/versions/node/v20.15.0/bin/node",
      "args": ["/Users/leorbrenman/AI/MCP/Nodejs_Tutorial/my-mcp-server/server.js"]
    }
  }
}
```

## Ask Questions

* Can you say hello to me using the MCP server?
* Get me a programming joke using the server
* Fetch some data from https://jsonplaceholder.typicode.com/posts/1
* Can you get the url for the nasa picture of the day?
* What should the tip be for a 15% tip on a $3000 bill?