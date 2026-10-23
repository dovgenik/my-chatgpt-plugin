import http from "node:http";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpServer } from "./mcpServer.js";
import { prisma } from "./lib/prisma.js";
const PORT = Number(process.env.PORT ?? 3000);
const mcpHandler = createMcpHandler(() => {
    return createMcpServer();
});
const nodeHandler = toNodeHandler(mcpHandler);
const httpServer = http.createServer(async (req, res) => {
    if (req.url === "/health" && req.method === "GET") {
        res.statusCode = 200;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ status: "ok" }));
        return;
    }
    if (req.url === "/mcp") {
        await nodeHandler(req, res);
        return;
    }
    res.statusCode = 404;
    res.end("Not Found");
});
httpServer.listen(PORT, () => {
    console.error(`MCP HTTP server listening on port ${PORT}`);
});
async function shutdown() {
    console.error("Shutting down HTTP MCP server...");
    try {
        await new Promise((resolve, reject) => {
            httpServer.close((error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
        await mcpHandler.close();
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
