// app.js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./src/routers/auth.routes");
const taxRoutes = require("./src/routers/tax.routes");
const vatRoutes = require("./src/routers/vat.routes");

// test log
console.log(
	"BOOT: app.js loaded - build",
	process.env.RENDER_GIT_COMMIT || "local"
);

const app = express();

// Environment-based CORS
const allowedOrigins =
	process.env.NODE_ENV === "production"
		? [process.env.CLIENT_URL].filter(Boolean)
		: [
				"http://localhost:5173",
				"http://localhost:3000",
				"http://localhost:8000",
		  ];

app.use(
	cors({
		origin: (origin, cb) => {
			// allow server-to-server / Postman (no origin)
			if (!origin) return cb(null, true);

			if (allowedOrigins.includes(origin)) return cb(null, true);
			return cb(new Error(`CORS blocked origin: ${origin}`));
		},
		credentials: true,
	})
);

// Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Serve static docs (PDFs)
app.use("/docs", express.static(path.join(__dirname, "/public/docs")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tax", taxRoutes);
app.use("/api/vat", vatRoutes);

// Health check endpoint
app.get("/health", (req, res) => res.json({ status: "ok" }));

// OAuth callback endpoint (Gmail / Google OAuth)
app.get("/oauth2callback", (req, res) => {
	const { code, error } = req.query;

	if (error) {
		return res.status(400).send(`OAuth error: ${error}`);
	}

	if (!code) {
		return res.status(400).send("Missing ?code= in callback URL.");
	}

	return res
		.status(200)
		.send(
			"Authorization received. Copy the code from the URL and paste it into your terminal."
		);
});

// Root endpoint
app.get("/", (req, res) => {
	res.send(
		"✅ Gov-Taxlator API is running. Available routes: /api/auth, /api/tax, /api/vat, /health"
	);
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(err.status || 500).json({
		success: false,
		message: err.message || "Internal Server Error",
	});
});

module.exports = app;
