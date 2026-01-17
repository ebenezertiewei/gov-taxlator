// gov-taxlatorAPI/src/models/vatCalculator.js
const mongoose = require("mongoose");

const VatCalculatorSchema = new mongoose.Schema(
	{
		// transaction amount before VAT
		transactionAmount: {
			type: Number,
			required: true,
			min: 0,
		},

		// Type of calculation: "add" or "remove" VAT
		calculationType: {
			type: String,
			enum: ["add", "remove"],
			required: true,
		},

		// Type of transaction: Domestic, Digital, Export, Exempt
		transactionType: {
			type: String,
			enum: [
				"Domestic sale/Purchase",
				"Digital Services",
				"Export/International",
				"Exempt",
			],
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("VatCalculation", VatCalculatorSchema);
