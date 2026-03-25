const cron = require("node-cron");
const { processDailyROI } = require("../controllers/Users/roiService/roiService");

/**
 * Initialize all cron jobs for the application
 */
const initCronJobs = () => {
    // 1. Daily ROI Payout at 12:00 AM every day
    // Cron schedule: minute hour dayOfMonth month dayOfWeek
    // 00 00 * * * = 12:00 AM every day
    cron.schedule("00 00 * * *", async () => {
        console.log("⏰ [CRON] Triggering Daily ROI Distribution at 12:00 AM...");
        try {
            const result = await processDailyROI();
            console.log("✅ [CRON] Daily ROI Payout completed:", result);
        } catch (error) {
            console.error("❌ [CRON] Error in Daily ROI Payout:", error.message);
        }
    });

    console.log("📅 [CRON] Scheduler initialized: Daily ROI at 12:00 AM.");
};

module.exports = { initCronJobs };
