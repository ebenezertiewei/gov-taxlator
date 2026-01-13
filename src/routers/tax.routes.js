// src/routers/tax.routes.js
const express = require("express");
const { calculateTax } = require("../controllers/tax.controller");
const handleCalculation = require("../utils/calcHandler");

const router = express.Router();

// Use dual-purpose handler
router.post("/calculate", handleCalculation(calculateTax));

module.exports = router;
