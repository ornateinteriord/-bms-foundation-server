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
    // Check it from Authorization header or URL query parameter (?secret=...)
    const authHeader = req.headers.authorization;
    const querySecret = req.query.secret;
    const cronSecret = process.env.CRON_SECRET;

    // Log the incoming request for Vercel diagnostics
    console.log(`⏰ [CRON] [${new Date().toISOString()}] ROI Trigger received.`);
    
    const isAuthorized = (authHeader === `Bearer ${cronSecret}`) || (querySecret === cronSecret);

    if (cronSecret && !isAuthorized) {
        console.warn("⚠️ [CRON] Unauthorized ROI trigger attempt. Check Vercel CRON_SECRET environment variable.");
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log("🚀 [CRON] Vercel Trigger: Starting Daily ROI Distribution...");
    
    const startTime = Date.now();
    try {
        const result = await processDailyROI();
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ [CRON] Vercel ROI Payout completed in ${duration}s:`, result);
        
        return res.status(200).json({ 
            success: true, 
            message: "ROI processing completed", 
            duration: `${duration}s`,
            data: result 
        });
    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ [CRON] Vercel ROI Error after ${duration}s:`, error.message);
        
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error", 
            duration: `${duration}s`, 
            error: error.message 
        });
    }
});

module.exports = router;
