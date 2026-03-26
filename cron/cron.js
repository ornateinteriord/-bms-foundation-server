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

    // 2. Immediate check on startup (Catch-up logic)
    // This ensures that if the server was down at 12:00 AM, it triggers ROI distribution as soon as it starts.
    setTimeout(async () => {
        console.log("⏰ [CRON] Running Startup ROI Check (Catch-up)...");
        try {
            const result = await processDailyROI();
            if (result.processedCount > 0) {
                console.log(`✅ [CRON] Startup ROI Catch-up completed. Processed: ${result.processedCount}`);
            } else {
                console.log("📅 [CRON] Startup ROI Check: Already processed or nothing to process for today.");
            }
        } catch (error) {
            console.error("❌ [CRON] Error in Startup ROI Catch-up:", error.message);
        }
    }, 5000); // Wait 5 seconds after startup to ensure everything is initialized
};

module.exports = { initCronJobs };
