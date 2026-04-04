const express = require("express");
const { requestAddOn, getAllRequests, getMemberAddOns, evaluateRequest } = require("../controllers/Packages/AddOnPackageController");
const router = express.Router();

// User Route -> creates an addOn Request
router.post("/request", requestAddOn);

// Admin Route -> Gets all pending/approved requests
router.get("/requests", getAllRequests);

// User Route -> Gets all APPROVED addons for a specific member
router.get("/member/:member_id", getMemberAddOns);

// Admin Route -> Evaluates request PENDING -> APPROVED | REJECTED 
router.put("/requests/:request_id/evaluate", evaluateRequest);

module.exports = router;
