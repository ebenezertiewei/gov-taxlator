const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
		pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
	},
});

// Verify connection (optional)
transporter.verify((err, success) => {
	if (err) {
		console.error("❌ Email transporter setup failed:", err);
	} else {
		console.log("✅ Email transporter ready");
	}
});

module.exports = transporter;
