const express = require("express");
const router = express.Router();
console.log("TransactionRoute.js loaded"); // DEBUG LOG

router.get('/test-route', (req, res) => {
    res.json({ message: "Transaction route is working" });
});
const { getTransactions, addTransaction, getAllTransactions, createPaymentOrder, handleCashfreeWebhook, checkPaymentStatus, transferMoney, requestWithdraw, triggerTestWebhook, testPaymentStatus } = require("../controllers/Transaction_Nidhi/TransactionController");
const { withdrawCommission, getWithdrawalRequests, approveWithdrawal } = require("../controllers/Transaction_Nidhi/WithdrawalController");
const { submitKYC, getKycSubmissions } = require("../controllers/KYC_Nidhi/KycController");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// Unified Transaction Routes
router.post('/add', Authenticated, addTransaction); // /transaction/add
router.get('/member/:id', Authenticated, getTransactions); // /transaction/member/:id
router.get('/all', Authenticated, getAllTransactions); // /transaction/all (Admin)

// Money Transfer
router.post('/transfer-money', Authenticated, transferMoney); // /transaction/transfer-money

// Withdraw Request
router.post('/withdraw-request', Authenticated, requestWithdraw); // /transaction/withdraw-request
router.post('/withdraw-commission', Authenticated, authorizeRoles(["USER", "AGENT"]), withdrawCommission);

// Admin Withdrawal Management
router.get('/withdrawal-requests', Authenticated, authorizeRoles(["ADMIN", "ADMIN_01"]), getWithdrawalRequests);
router.post('/approve-withdrawal', Authenticated, authorizeRoles(["ADMIN", "ADMIN_01"]), approveWithdrawal);

// Cashfree Routes
router.post('/create-order', createPaymentOrder);
// ⚠️ WEBHOOK ROUTE REMOVED - Handled in index.js (BEFORE other middleware for raw body)
// Webhook is at: POST /transaction/webhook/cashfree (defined in index.js line 29)
router.get('/status/:orderId', Authenticated, checkPaymentStatus);

// Test Webhook Routes
router.post('/test/webhook', Authenticated, triggerTestWebhook);
router.put('/test/payment/:orderId/success', Authenticated, testPaymentStatus);

// KYC Routes
router.post('/kyc/submit', submitKYC); // /transaction/kyc/submit
// router.post('/kyc/approve', Authenticated, authorizeRoles(["ADMIN"]), approveKYC); // /transaction/kyc/approve
// router.get('/kyc/submissions', Authenticated, authorizeRoles(["ADMIN"]), getKycSubmissions); // /transaction/kyc/submissions

// Diagnostic endpoint to check Cashfree configuration
router.get('/cashfree-config', Authenticated, (req, res) => {
    const cashfreeConfig = require("../utils/cashfree");
    res.json({
        environment: cashfreeConfig.NODE_ENV,
        isProduction: cashfreeConfig.IS_PRODUCTION,
        isSandbox: cashfreeConfig.IS_SANDBOX,
        baseUrl: cashfreeConfig.CASHFREE_BASE_URL,
        appIdConfigured: !!cashfreeConfig.CASHFREE_APP_ID,
        appIdLength: cashfreeConfig.CASHFREE_APP_ID?.length || 0,
        secretKeyConfigured: !!cashfreeConfig.CASHFREE_SECRET_KEY,
        secretKeyLength: cashfreeConfig.CASHFREE_SECRET_KEY?.length || 0,
        webhookSecretConfigured: !!cashfreeConfig.WEBHOOK_SECRET,
        apiVersion: cashfreeConfig.X_API_VERSION
    });
});

module.exports = router;