import {
  createMcpExpressApp,
  requireBearerAuth,
  type OAuthTokenVerifier,
} from "@modelcontextprotocol/express";

import { toNodeHandler } from "@modelcontextprotocol/node";

import {
  createMcpHandler,
  type AuthInfo,
  OAuthError,
  OAuthErrorCode,
} from "@modelcontextprotocol/server";

import { createMcpServer } from "./mcpServer.js";
import { prisma } from "./lib/prisma.js";

const PORT = Number(process.env.PORT ?? 3000);

const verifier: OAuthTokenVerifier = {
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    if (token === "read-token") {
      return {
        token,
        clientId: "vadim-readonly",
        scopes: ["mcp", "notes:read"],
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
    }

    if (token === "full-token") {
      return {
        token,
        clientId: "vadim",
        scopes: [
          "mcp",
          "notes:read",
          "notes:write",
        ],
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
    }

    throw new OAuthError(
      OAuthErrorCode.InvalidToken,
      "Invalid access token",
    );
  },
};

const auth = requireBearerAuth({
  verifier,
  requiredScopes: ["mcp"],
});

const mcpHandler = createMcpHandler(() => {
  return createMcpServer();
});

const nodeHandler = toNodeHandler(mcpHandler);

const app = createMcpExpressApp();

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.all("/mcp", auth, (req, res) => {
  void nodeHandler(req, res, req.body);
});

const httpServer = app.listen(PORT, () => {
  console.error(`OAuth test MCP server listening on port ${PORT}`);
});

async function shutdown() {
  console.error("Shutting down authenticated MCP server...");

  try {
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    await mcpHandler.close();
    await prisma.$disconnect();

    process.exit(0);
  } catch (error) {
    console.error("Shutdown error:", error);
    process.exit(1);
  }
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
