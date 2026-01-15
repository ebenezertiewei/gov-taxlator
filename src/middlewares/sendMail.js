// src/middlewares/sendMail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 587,
	secure: false,
	auth: {
		user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
		pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
	},

	// 🔍 SMTP-level debugging
	logger: true,
	debug: true,
});

transporter.verify((err, success) => {
	if (err) {
		console.error("❌ Email transporter setup failed:", err);
	} else {
		console.log("✅ Email transporter ready");
	}
});

module.exports = transporter;
