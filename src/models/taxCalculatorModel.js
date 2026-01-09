const mongoose = require("mongoose");

const TaxCalculationSchema = new mongoose.Schema(
	{
		// required: PAYE, PIT, FREELANCER, CIT
		taxType: {
			type: String,
			enum: ["PAYE/PIT", "FREELANCER", "CIT"],
			required: true,
			index: true,
		},

		// Used for PAYE/PIT, FREELANCER
		grossIncome: {
			type: Number,
			min: 0,
			required: function () {
				return this.taxType !== "CIT";
			},
		},

		// deductions options for PAYE/PIT
		// PAYE/PIT 20% annual rent
		rentRelief: {
			type: Number,
			min: 0,
			default: 0,
		},

		otherDeductions: {
			type: Number,
			min: 0,
			default: 0,
		},

		// Used for CIT (company turnover)
		revenue: {
			type: Number,
			min: 0,
			required: function () {
				return this.taxType === "CIT";
			},
		},

		// income frequency: monthly or annual
		frequency: {
			type: String,
			enum: ["monthly", "annual"],
			default: "annual",
		},

		// deductions options
		// FREELANCER, just plain deductions
		pension: {
			type: Boolean,
			default: true,
		},

		// Freelancer-only deductions
		expenses: {
			type: Number,
			min: 0,
			required: function () {
				return this.taxType === "FREELANCER";
			},
		},

		// CIT is calculated on profit
		profit: {
			type: Number,
			required: function () {
				return this.taxType === "CIT";
			},
		},

		// computed / result fields
		taxableIncome: Number,
		taxAmount: Number,
		effectiveTaxRate: Number,
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("TaxCalculation", TaxCalculationSchema);
