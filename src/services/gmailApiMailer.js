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

	const lines = [
		`From: ${from}`,
		`To: ${to}`,
		`Subject: ${subject}`,
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

async function sendGmail({ to, subject, html, text }) {
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
		throw new Error("Missing Gmail API environment variables");
	}

	const oauth2Client = new google.auth.OAuth2(
		GMAIL_CLIENT_ID,
		GMAIL_CLIENT_SECRET
	);

	oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

	const gmail = google.gmail({ version: "v1", auth: oauth2Client });

	const raw = buildRawEmail({
		from: `Taxlator <${GMAIL_SENDER}>`,
		to,
		subject,
		html,
		text,
	});

	return gmail.users.messages.send({
		userId: "me",
		requestBody: { raw },
	});
}

module.exports = { sendGmail };
