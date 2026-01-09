const express = require("express");
const router = express.Router();

const { calculateVAT } = require("../controllers/vat.controller");

/**
 * POST /api/vat/calculate
 */
router.post("/calculate", calculateVAT);

module.exports = router;
