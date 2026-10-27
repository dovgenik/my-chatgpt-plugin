import {
  createMcpExpressApp,
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthMetadataRouter,
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



import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from "jose";

import { createMcpServer } from "./mcpServer.js";
import { prisma } from "./lib/prisma.js";

const PORT = Number(process.env.PORT ?? 3000);

const CLERK_ISSUER = process.env.CLERK_ISSUER;

const MCP_SERVER_URL = new URL(
  process.env.MCP_SERVER_URL ?? "http://localhost:3000/mcp",
);

if (!CLERK_ISSUER) {
  throw new Error("CLERK_ISSUER is not set");
}

const jwks = createRemoteJWKSet(
  new URL(`${CLERK_ISSUER}/.well-known/jwks.json`),
);

function getScopes(payload: JWTPayload): string[] {
  const scope = payload.scope;

  if (typeof scope === "string") {
    return scope
      .split(/\s+/)
      .filter(Boolean);
  }

  return [];
}

const verifier: OAuthTokenVerifier = {
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: CLERK_ISSUER,
      });

      if (!payload.sub) {
        throw new Error("Token has no sub claim");
      }

      if (!payload.exp) {
        throw new Error("Token has no exp claim");
      }

      const scopes = getScopes(payload);

      return {
        token,
        clientId: payload.sub,
        scopes,
        expiresAt: payload.exp,
      };
    } catch {
      throw new OAuthError(
        OAuthErrorCode.InvalidToken,
        "Invalid access token",
      );
    }
  },
};

const auth = requireBearerAuth({
  verifier,
  resourceMetadataUrl:
    getOAuthProtectedResourceMetadataUrl(
      MCP_SERVER_URL,
    ),
});

const mcpHandler = createMcpHandler(() => {
  return createMcpServer();
});

const nodeHandler = toNodeHandler(mcpHandler);

//**************************************************************
const metadataResponse = await fetch(
  `${CLERK_ISSUER}/.well-known/oauth-authorization-server`,
);

if (!metadataResponse.ok) {
  throw new Error(
    `Failed to load Clerk OAuth metadata: ${metadataResponse.status}`,
  );
}

const oauthMetadata =
  await metadataResponse.json();

  //***************************************************************

const app = createMcpExpressApp();
//***************************************
app.use(
  mcpAuthMetadataRouter({
    oauthMetadata,
    resourceServerUrl: MCP_SERVER_URL,
  }),
);


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
