import "dotenv/config";

import http from "node:http";
import crypto from "node:crypto";

const CLIENT_ID = process.env.CLERK_OAUTH_CLIENT_ID;
const CLERK_ISSUER = process.env.CLERK_ISSUER;

if (!CLIENT_ID) {
  throw new Error("CLERK_OAUTH_CLIENT_ID is not set");
}

if (!CLERK_ISSUER) {
  throw new Error("CLERK_ISSUER is not set");
}

const REDIRECT_URI = "http://localhost:3333/callback";

function base64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

const codeVerifier = base64Url(
  crypto.randomBytes(32),
);

const codeChallenge = base64Url(
  crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest(),
);

const state = base64Url(
  crypto.randomBytes(16),
);

const authorizeUrl = new URL(
  `${CLERK_ISSUER}/oauth/authorize`,
);

authorizeUrl.searchParams.set(
  "response_type",
  "code",
);

authorizeUrl.searchParams.set(
  "client_id",
  CLIENT_ID,
);

authorizeUrl.searchParams.set(
  "redirect_uri",
  REDIRECT_URI,
);

authorizeUrl.searchParams.set(
  "scope",
  "notes:read notes:write",
);

authorizeUrl.searchParams.set(
  "code_challenge",
  codeChallenge,
);

authorizeUrl.searchParams.set(
  "code_challenge_method",
  "S256",
);

authorizeUrl.searchParams.set(
  "state",
  state,
);

const server = http.createServer(
  async (req, res) => {
    const url = new URL(
      req.url ?? "/",
      REDIRECT_URI,
    );

    if (url.pathname !== "/callback") {
      res.statusCode = 404;
      res.end("Not Found");
      return;
    }

    const returnedState =
      url.searchParams.get("state");

    if (returnedState !== state) {
      res.statusCode = 400;
      res.end("Invalid state");
      return;
    }

    const code =
      url.searchParams.get("code");

    if (!code) {
      res.statusCode = 400;
      res.end("Authorization code missing");
      return;
    }

    const tokenResponse = await fetch(
      `${CLERK_ISSUER}/oauth/token`,
      {
        method: "POST",

        headers: {
          "content-type":
            "application/x-www-form-urlencoded",
        },

        body: new URLSearchParams({
          grant_type:
            "authorization_code",

          client_id:
            CLIENT_ID,

          code,

          redirect_uri:
            REDIRECT_URI,

          code_verifier:
            codeVerifier,
        }),
      },
    );

    const tokenData =
      await tokenResponse.json();

    console.log("\nToken response:");
    console.log(tokenData);

    res.statusCode = 200;
    res.setHeader(
      "content-type",
      "text/plain; charset=utf-8",
    );

    res.end(
      "Authorization completed. You can close this tab.",
    );

    server.close();
  },
);

server.listen(3333, () => {
  console.log(
    "\nOpen this URL in your browser:\n",
  );

  console.log(authorizeUrl.href);
});