//src\server.ts
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { createMcpServer } from "./mcpServer.js";
import { prisma } from "./lib/prisma.js";
const server = createMcpServer();
const transport = new StdioServerTransport();
async function shutdown() {
    console.error("Shutting down MCP server...");
    try {
        await server.close();
        await prisma.$disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error("Shutdown error:", error);
        process.exit(1);
    }
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
await server.connect(transport);
