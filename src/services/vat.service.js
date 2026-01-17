// gov-taxlatorAPI/src/services/vat.service.js

/**
 * Default VAT rates by transaction type
 */
const VAT_RATES = {
	"Domestic sale/Purchase": 0.075,
	"Digital Services": 0.075,
	"Export/International": 0,
	Exempt: 0,
};

function round2(n) {
	return Math.round(n * 100) / 100;
}

/**
 * Main VAT calculation service
 *
 * transactionAmount:
 *  - if calculationType === "add": amount is EXCLUDING VAT
 *  - if calculationType === "remove": amount is INCLUDING VAT
 */
const calculateVATService = ({
	transactionAmount,
	calculationType,
	transactionType,
	rate,
}) => {
	const vatRate = rate !== undefined ? rate : VAT_RATES[transactionType];

	if (vatRate < 0 || vatRate > 1) {
		throw new Error("VAT rate must be between 0 and 1");
	}

	const amount = Number(transactionAmount || 0);

	let excludingVat = amount;
	let includingVat = amount;
	let vatAmount = 0;

	if (calculationType === "add") {
		// amount is EXCLUDING VAT
		excludingVat = amount;
		vatAmount = amount * vatRate;
		includingVat = amount + vatAmount;
	} else if (calculationType === "remove") {
		// amount is INCLUDING VAT
		includingVat = amount;

		if (vatRate === 0) {
			excludingVat = amount;
			vatAmount = 0;
		} else {
			excludingVat = amount / (1 + vatRate);
			vatAmount = amount - excludingVat;
		}
	} else {
		throw new Error("Invalid calculation type, must be 'add' or 'remove'");
	}

	excludingVat = round2(excludingVat);
	includingVat = round2(includingVat);
	vatAmount = round2(vatAmount);

	return {
		transactionAmount: amount,
		calculationType,
		transactionType,
		vatRate,
		excludingVat,
		includingVat,
		vatAmount,
		// Backward compatibility (if any older UI reads `result`)
		result: includingVat,
	};
};

module.exports = { calculateVATService };
