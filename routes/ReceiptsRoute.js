const express = require("express");
const router = express.Router();
const {
    createReceipt,
    getReceipts,
    getReceiptById,
    updateReceipt,
    deleteReceipt
} = require("../controllers/Admin/Banking/receipts");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");


// Receipts endpoints
router.post("/receipts", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), createReceipt);
router.get("/receipts", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getReceipts);
router.get("/receipts/:receiptId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getReceiptById);
router.put("/receipts/:receiptId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), updateReceipt);
router.delete("/receipts/:receiptId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), deleteReceipt);

module.exports = router;
