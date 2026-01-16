require("dotenv").config();
const { google } = require("googleapis");
const readline = require("readline");

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error("Missing GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, or GMAIL_REDIRECT_URI in env.");
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

(async () => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("Authorize this app by visiting this url:\n", authUrl);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("\nPaste the code (or full redirect URL) here: ", async (input) => {
    rl.close();

    const trimmed = String(input || "").trim();
    const code = trimmed.includes("code=") ? new URL(trimmed).searchParams.get("code") : trimmed;

    if (!code) {
      console.error("No code found. Paste the OAuth code or the full redirected URL containing ?code=...");
      process.exit(1);
    }

    const { tokens } = await oAuth2Client.getToken(code);
    console.log("\nTOKENS:\n", tokens);
    console.log("\nSave refresh_token securely (Render env var).");
  });
})().catch((e) => {
  console.error(e.response?.data || e.message);
  process.exit(1);
});
