import { generateRandomString, pkceChallengeFromVerifier } from "./utils.js";

// to immediately install the service worker
addEventListener("install", (event) => {
  // install on all site tabs without waiting for them to be opened
  skipWaiting();
});

// to immediately activate the service worker
addEventListener("activate", (event) => {
  // activate on all tabs without waiting for them to be opened
  event.waitUntil(clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data.type === "update") {
    const data = event.data.data;
    console.log("data:", data);
  }
});

const tokenStore = new Map();

const config = [
  {
    origin: "https://home.juxt.site",
    client_id: "surveyor",
    token_endpoint: "https://auth.home.juxt.site/oauth/token",
    authorization_endpoint: "https://auth.home.juxt.site/oauth/authorize",
    redirect_uri: "http://localhost:3000/index.html",
    requested_scopes: "",
  },
];

async function createAuthorizationRequest({
  client_id,
  redirect_uri,
  authorization_endpoint,
  requested_scopes,
}) {
  // Create and store a random "state" value
  const state = generateRandomString();

  // Create and store a new PKCE code_verifier (the plaintext random secret)
  const codeVerifier = generateRandomString();

  // Build the authorization URL
  const queryParams = new URLSearchParams({
    response_type: "code",
    client_id,
    state,
    scope: requested_scopes,
    redirect_uri,
    code_challenge: await pkceChallengeFromVerifier(codeVerifier),
    code_challenge_method: "S256",
  });

  const url = `${authorization_endpoint}?${queryParams.toString()}`;

  return {
    request: new Request(url, { method: "GET", credentials: "include" }),
    codeVerifier,
    state,
  };
}

function createAccessTokenRequest({
  token_endpoint,
  client_id,
  redirect_uri,
  code,
  codeVerifier,
}) {
  return new Request(token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id,
      redirect_uri,
      code_verifier: codeVerifier,
    }),
    credentials: "include",
  });
}

function getConfigForOrigin(request) {
  const { origin } = new URL(request.url);
  return config.find((item) => item.origin === origin);
}

async function sendMessage({ type, data, info }) {
  console.log("clientId:", clientId);

  if (!clientId) return;
  // Get the client.
  const client = await clients.get(clientId);
  // Exit early if we don't get the client.
  // Eg, if it closed.
  if (!client) return;
  // Send a message to the client.
  client.postMessage({ type, data, info });
}

// to intercept the request and add the access token to the Authorization header when hitting the protected resource URL.
async function attachBearerToken(request, clientId) {
  console.log("in request handler service worker");

  const configItem = getConfigForOrigin(request);
  if (!configItem) {
    return request;
  }

  const { access_token } = tokenStore.get(configItem.origin) || {};

  if (access_token) {
    const headers = new Headers(request.headers);
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${access_token}`);
    }
    return new Request(request, { headers });
  }

  const authorizationRequest = await createAuthorizationRequest(configItem);
  console.log("Authorization Request", authorizationRequest);

  const authorizationResponse = await fetch(authorizationRequest.request);
  console.log("Authorization Response", authorizationResponse);
  const { location } = { ...authorizationResponse.headers };

  const locationUrl = new URL(location);
  const redirectUrl = new URL(configItem.redirect_uri);

  if (locationUrl.origin !== redirectUrl.origin) {
    await sendMessage({
      type: "redirect",
      data: { url: locationUrl },
      info: "redirecting to auth server",
    });
    // TODO: how to stop the request from going through?
    // google how to abort request
  }

  const queryParams = new URLSearchParams(locationUrl.search);
  const state = queryParams.get("state");

  if (state !== authorizationRequest.state) {
    throw new Error("State mismatch");
  }

  const code = queryParams.get("code");

  const accessTokenRequest = createAccessTokenRequest({
    token_endpoint: configItem.token_endpoint,
    client_id: configItem.client_id,
    redirect_uri: configItem.redirect_uri,
    code,
    codeVerifier: authorizationRequest.codeVerifier,
  });
  console.log("AuthToken Request", accessTokenRequest);

  const authTokenResponse = await fetch(accessTokenRequest);
  console.log("AuthToken Response", authTokenResponse);
}

const modifyResponse = (response) => {
  return response;
};

async function fetchWithBearerToken({ request, clientId }) {
  const newRequest =
    request instanceof Request ? request : new Request(request);
  const attachBearerTokenFn = await attachBearerToken(newRequest, clientId);
  return fetch(attachBearerTokenFn).then(modifyResponse);
}

addEventListener("fetch", (event) => {
  event.respondWith(fetchWithBearerToken(event));
});
