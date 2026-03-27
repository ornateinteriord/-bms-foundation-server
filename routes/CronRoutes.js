const express = require("express");
const { processDailyROI } = require("../controllers/Users/roiService/roiService");

const router = express.Router();

/**
 * @route   GET /api/cron/roi
 * @desc    Trigger Daily ROI Payout (Vercel Cron)
 * @access  Protected (CRON_SECRET)
 */
router.get("/roi", async (req, res) => {
    // 1. Simple Secret Protection
    // Vercel Cron sends a secret in the Authorization header: `Bearer ${CRON_SECRET}` 
    // OR we can use a custom header. For simplicity, we'll check it from headers or query.
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        console.warn("⚠️ [CRON] Unauthorized ROI trigger attempt.");
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log("⏰ [CRON] Vercel Trigger: Starting Daily ROI Distribution...");
    
    try {
        const result = await processDailyROI();
        console.log("✅ [CRON] Vercel ROI Payout completed:", result);
        return res.status(200).json({ 
            success: true, 
            message: "ROI processing completed", 
            data: result 
        });
    } catch (error) {
        console.error("❌ [CRON] Vercel ROI Error:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error", 
            error: error.message 
        });
    }
});

module.exports = router;
