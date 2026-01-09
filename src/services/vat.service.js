/**
 * Helper: calculate VAT amount
 */
const calculateVATHelper = ({ amount, type, rate }) => {
	let result;

	if (type === "add") {
		// Add VAT
		result = amount * (1 + rate);
	}

	if (type === "remove") {
		// Do NOT apply VAT (amount already net)
		result = amount;
	}

	if (result === undefined) {
		throw new Error("Invalid calculation type, must be 'add' or 'remove'");
	}

	// Round to 2 decimal places
	return Math.round(result * 100) / 100;
};

/**
 * Default VAT rates by transaction type
 */
const VAT_RATES = {
	"Domestic sale/Purchase": 0.075,
	"Digital Services": 0.075,
	"Export/International": 0,
	Exempt: 0,
};

/**
 * Main VAT calculation service
 */
const calculateVATService = ({
	transactionAmount,
	calculationType,
	rate,
	transactionType,
}) => {
	const vatRate = rate !== undefined ? rate : VAT_RATES[transactionType];

	if (vatRate < 0 || vatRate > 1) {
		throw new Error("VAT rate must be between 0 and 1");
	}

	const result = calculateVATHelper({
		amount: transactionAmount,
		type: calculationType,
		rate: vatRate,
	});

	return {
		transactionAmount,
		calculationType,
		transactionType,
		// Only include vatRate when VAT is added
		...(calculationType === "add" && { vatRate }),
		result,
	};
};

module.exports = { calculateVATService };
