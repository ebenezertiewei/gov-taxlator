// src/services/gmailApiMailer.js
const { google } = require("googleapis");

function base64UrlEncode(str) {
	return Buffer.from(str)
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
}

function buildRawEmail({ from, to, subject, html, text }) {
	const boundary = "taxlator_boundary_" + Date.now();

	const safeSubject = String(subject || "")
		.replace(/\r|\n/g, " ")
		.trim();
	const safeTo = String(to || "")
		.replace(/\r|\n/g, " ")
		.trim();
	const safeFrom = String(from || "")
		.replace(/\r|\n/g, " ")
		.trim();

	const lines = [
		`From: ${safeFrom}`,
		`To: ${safeTo}`,
		`Subject: ${safeSubject}`,
		"MIME-Version: 1.0",
		`Content-Type: multipart/alternative; boundary="${boundary}"`,
		"",
		`--${boundary}`,
		'Content-Type: text/plain; charset="UTF-8"',
		"Content-Transfer-Encoding: 7bit",
		"",
		text || "",
		"",
		`--${boundary}`,
		'Content-Type: text/html; charset="UTF-8"',
		"Content-Transfer-Encoding: 7bit",
		"",
		html || "",
		"",
		`--${boundary}--`,
		"",
	];

	return base64UrlEncode(lines.join("\r\n"));
}

function extractGoogleError(err) {
	// googleapis errors can be nested in a few places
	const data = err?.response?.data || err?.errors?.[0] || err?.cause || err;

	const error = data?.error || err?.message || "Gmail API request failed";

	const description = data?.error_description || data?.message || "";

	const status = err?.code || err?.response?.status || data?.code || 500;

	return {
		status,
		error: typeof error === "string" ? error : JSON.stringify(error),
		description:
			typeof description === "string"
				? description
				: JSON.stringify(description),
	};
}

// Create OAuth client once (module-level)
const {
	GMAIL_CLIENT_ID,
	GMAIL_CLIENT_SECRET,
	GMAIL_REFRESH_TOKEN,
	GMAIL_SENDER,
} = process.env;

if (
	!GMAIL_CLIENT_ID ||
	!GMAIL_CLIENT_SECRET ||
	!GMAIL_REFRESH_TOKEN ||
	!GMAIL_SENDER
) {
	// Don't throw at import-time in case some environments boot without mail.
	// We'll throw inside sendGmail instead.
}

const oauth2Client =
	GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET
		? new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET)
		: null;

if (oauth2Client && GMAIL_REFRESH_TOKEN) {
	oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
}

async function sendGmail({ to, subject, html, text }) {
	const env = process.env;

	if (
		!env.GMAIL_CLIENT_ID ||
		!env.GMAIL_CLIENT_SECRET ||
		!env.GMAIL_REFRESH_TOKEN ||
		!env.GMAIL_SENDER
	) {
		const e = new Error(
			"Missing Gmail API environment variables (GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN / GMAIL_SENDER)"
		);
		e.status = 500;
		throw e;
	}

	// If env changed after boot (Render can restart), rebuild client safely
	const client =
		oauth2Client &&
		env.GMAIL_CLIENT_ID === GMAIL_CLIENT_ID &&
		env.GMAIL_CLIENT_SECRET === GMAIL_CLIENT_SECRET
			? oauth2Client
			: new google.auth.OAuth2(env.GMAIL_CLIENT_ID, env.GMAIL_CLIENT_SECRET);

	client.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });

	const gmail = google.gmail({ version: "v1", auth: client });

	const raw = buildRawEmail({
		from: `Taxlator <${env.GMAIL_SENDER}>`,
		to,
		subject,
		html,
		text,
	});

	try {
		const resp = await gmail.users.messages.send({
			userId: "me",
			requestBody: { raw },
		});

		return resp;
	} catch (err) {
		const gErr = extractGoogleError(err);
		const e = new Error(
			gErr.description
				? `Gmail API error: ${gErr.error} (${gErr.description})`
				: `Gmail API error: ${gErr.error}`
		);
		e.status = gErr.status;
		e.code = gErr.error;
		throw e;
	}
}

module.exports = { sendGmail };
