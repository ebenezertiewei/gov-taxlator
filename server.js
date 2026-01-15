require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

const { PORT = 8000, MONGO_URI } = process.env;

/**
 * ENV sanity checks (booleans only — no secrets leaked)
 * Put this in the entry point so it runs once at startup.
 */
console.log("MAIL USER:", !!process.env.NODE_CODE_SENDING_EMAIL_ADDRESS);
console.log("MAIL PASS:", !!process.env.NODE_CODE_SENDING_EMAIL_PASSWORD);

// Optional but recommended: fail fast if critical env vars are missing
if (!MONGO_URI) {
	console.error("❌ Missing MONGO_URI in environment variables");
	process.exit(1);
}

// If email is required for core flows like signup verification, fail fast as well.
// If you want to allow running without email in dev, remove this block.
if (
	!process.env.NODE_CODE_SENDING_EMAIL_ADDRESS ||
	!process.env.NODE_CODE_SENDING_EMAIL_PASSWORD
) {
	console.error(
		"❌ Missing email environment variables (NODE_CODE_SENDING_EMAIL_ADDRESS / NODE_CODE_SENDING_EMAIL_PASSWORD)"
	);
	process.exit(1);
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
