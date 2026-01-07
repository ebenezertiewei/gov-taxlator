/**
 * Normalize income to annual value
 */
const normalizeAnnualIncome = (amount, frequency = "annual") => {
	if (frequency === "monthly") {
		return amount * 12;
	}
	return amount;
};

module.exports = {
	normalizeAnnualIncome,
};
