import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
    const server = new McpServer({
        name: "trading-signals-mcp",
        version: "1.0.0"
    });

    // registerBinanceSpotTools(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main();
