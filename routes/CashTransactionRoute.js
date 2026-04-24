const express = require("express");
const router = express.Router();
const {
    getAllCashTransactions,
    getCashTransactionById,
    createCashTransaction,
    deleteCashTransaction,
    // createMaturityPayment
} = require("../controllers/Admin/Banking/cashTransaction");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");


router.get("/", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getAllCashTransactions);
router.get("/:id", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getCashTransactionById);
router.post("/", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), createCashTransaction);
router.delete("/:id", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), deleteCashTransaction);

// Route for creating maturity payments with Cashfree Payout


module.exports = router;
