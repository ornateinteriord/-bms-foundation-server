const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

// Standard relative paths for local execution
const MemberModel = require("../models/Users/Member");
const AddOnRequestModel = require("../models/Packages/AddOnRequest");
const AddOnPackageModel = require("../models/Packages/AddOnPackage");
const connectDB = require("../models/db");

async function migrate() {
    try {
        await connectDB();
        console.log("Connected to DB...");

        // Find all approved requests
        const approvedRequests = await AddOnRequestModel.find({ status: "APPROVED" });
        console.log(`Found ${approvedRequests.length} approved requests in add_on_request_tbl.`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const req of approvedRequests) {
            // Check if it already exists in the new table (to avoid duplicates)
            const exists = await AddOnPackageModel.findOne({ request_id: req.request_id });
            if (exists) {
                skippedCount++;
                continue;
            }

            // Create new package entry
            const newPackage = new AddOnPackageModel({
                package_id: `PKG-MIG-${req.request_id}`,
                member_id: req.member_id,
                amount: req.requested_amount,
                roi_status: req.roi_status || "Active",
                roi_payout_count: req.roi_payout_count || 0,
                roi_payout_target: req.roi_payout_target || (req.requested_amount * 2),
                roi_last_payout_date: req.roi_last_payout_date,
                roi_start_date: req.roi_start_date,
                request_id: req.request_id,
                admin_id: req.admin_audit?.admin_id || "MIGRATION"
            });

            await newPackage.save();
            migratedCount++;
        }

        console.log(`Migration complete: ${migratedCount} migrated, ${skippedCount} skipped.`);
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
