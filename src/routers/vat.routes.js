// src/routers/vat.routes.js
const express = require("express");
const { calculateVAT } = require("../controllers/vat.controller");
const handleCalculation = require("../utils/calcHandler");

const router = express.Router();

// Use dual-purpose handler
router.post("/calculate", handleCalculation(calculateVAT));

module.exports = router;
