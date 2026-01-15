// gov-taxlatorAPI/server.js
require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

const { PORT = 8000, MONGO_URI } = process.env;

/**
 * ENV sanity checks (booleans only — no secrets leaked)
 * Runs once at startup.
 */
console.log("MONGO_URI:", !!MONGO_URI);
console.log("TOKEN_SECRET:", !!process.env.TOKEN_SECRET);

console.log("GMAIL_CLIENT_ID:", !!process.env.GMAIL_CLIENT_ID);
console.log("GMAIL_CLIENT_SECRET:", !!process.env.GMAIL_CLIENT_SECRET);
console.log("GMAIL_REFRESH_TOKEN:", !!process.env.GMAIL_REFRESH_TOKEN);
console.log("GMAIL_SENDER:", !!process.env.GMAIL_SENDER);

// Fail fast if critical env vars are missing
if (!MONGO_URI) {
	console.error("❌ Missing MONGO_URI in environment variables");
	process.exit(1);
}

if (!process.env.TOKEN_SECRET) {
	console.error("❌ Missing TOKEN_SECRET in environment variables");
	process.exit(1);
}

// Email is required for signup verification flows.
// If you want to allow the API to run without email in some environments,
// change this to a warning instead of process.exitC.
const hasGmailEnv =
	!!process.env.GMAIL_CLIENT_ID &&
	!!process.env.GMAIL_CLIENT_SECRET &&
	!!process.env.GMAIL_REFRESH_TOKEN &&
	!!process.env.GMAIL_SENDER;

if (!hasGmailEnv) {
	console.warn(
		"⚠️ Gmail API env vars missing. Email sending will fail until configured."
	);
}

let server;

// Connect to MongoDB
mongoose
	.connect(MONGO_URI)
	.then(() => {
		console.log("✅ Successfully connected to MongoDB");

		server = app.listen(PORT, () => {
			console.log(`🚀 Tax service running on port ${PORT}`);
		});
	})
	.catch((err) => {
		console.error("❌ Error connecting to MongoDB:", err.message);
		process.exit(1);
	});

/**
 * Graceful shutdown handler
 */
const shutdown = async (signal) => {
	console.log(`🛑 ${signal} received. Shutting down gracefully...`);

	// Stop accepting new requests
	if (server) {
		server.close(() => {
			console.log("✅ HTTP server closed");
		});
	}

	try {
		await mongoose.connection.close(false);
		console.log("✅ MongoDB connection closed");
		process.exit(0);
	} catch (err) {
		console.error("❌ Error during shutdown:", err);
		process.exit(1);
	}
};

// Termination signals
process.on("SIGINT", shutdown); // Ctrl + C
process.on("SIGTERM", shutdown); // Docker / PM2
process.on("SIGQUIT", shutdown);

// Crash protection
process.on("unhandledRejection", (reason) => {
	console.error("❌ Unhandled Rejection:", reason);
	shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
	console.error("❌ Uncaught Exception:", err);
	shutdown("uncaughtException");
});
