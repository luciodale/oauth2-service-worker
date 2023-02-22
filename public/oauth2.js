// Generate a secure random string using the browser crypto functions
function generateRandomString() {
  const array = new Uint32Array(28);
  window.crypto.getRandomValues(array);
  return Array.from(array, (dec) => ("0" + dec.toString(16)).substr(-2)).join(
    ""
  );
}

// Calculate the SHA256 hash of the input text.
// Returns a promise that resolves to an ArrayBuffer
function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
}

// Base64-urlencodes the input string
function base64urlencode(str) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Return the base64-urlencoded sha256 hash for the PKCE
// challenge
async function pkceChallengeFromVerifier(v) {
  const hashed = await sha256(v);
  return base64urlencode(hashed);
}

export async function authCodeRequest({
  client_id,
  redirect_uri,
  authorization_endpoint,
  requested_scopes,
}) {
  // Create and store a random "state" value
  const initState = generateRandomString();
  localStorage.setItem("pkce_state", initState);
  console.log("initState:", initState);

  // Create and store a new PKCE code_verifier (the plaintext random secret)
  const code_verifier = generateRandomString();
  localStorage.setItem("pkce_code_verifier", code_verifier);

  // Hash and base64-urlencode the secret to use as the challenge
  const code_challenge = await pkceChallengeFromVerifier(code_verifier);

  // Build the authorization URL
  const url =
    authorization_endpoint +
    "?response_type=code" +
    "&client_id=" +
    encodeURIComponent(client_id) +
    "&state=" +
    encodeURIComponent(initState) +
    "&scope=" +
    encodeURIComponent(requested_scopes) +
    "&redirect_uri=" +
    encodeURIComponent(redirect_uri) +
    "&code_challenge=" +
    encodeURIComponent(code_challenge) +
    "&code_challenge_method=S256" +
    "&username=admin";

  window.location = url;
}
