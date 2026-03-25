const MemberModel = require("../../../models/Users/Member");
const PayoutModel = require("../../../models/Payout/Payout");
const TransactionModel = require("../../../models/Transaction/Transaction");
const moment = require("moment");
const mongoose = require("mongoose");

/**
 * Check if the given date is a weekend (Saturday or Sunday)
 */
const isWeekend = (date) => {
    const day = moment(date).day();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

/**
 * Calculate the number of working days (Mon-Fri) in a given window
 */
const getWorkingDaysInWindow = (startDate, calendarDays) => {
    let count = 0;
    const start = moment(startDate);
    for (let i = 0; i < calendarDays; i++) {
        const current = moment(start).add(i, "days");
        const day = current.day();
        if (day !== 0 && day !== 6) {
            count++;
        }
    }
    return count;
};

/**
 * Process daily ROI for all eligible members
 */
const processDailyROI = async () => {
    try {
        const today = moment().format("YYYY-MM-DD");

        // 1. Skip weekends
        if (isWeekend(today)) {
            console.log(`📅 Skipping ROI Payout: Today (${today}) is a weekend.`);
            return { success: true, message: "Skipping weekends", count: 0 };
        }

        // 2. Find eligible active members
        const eligibleMembers = await MemberModel.find({
            status: "active",
            roi_status: "Active",
            roi_last_payout_date: { $ne: today } // Prevent double payout on same day
        });

        console.log(`🚀 Processing ROI for ${eligibleMembers.length} members...`);

        let processedCount = 0;

        for (const member of eligibleMembers) {
            try {
                // Determine ROI Window and Fixed 300 Day Logic
                const totalTarget = member.roi_payout_target || (member.package_value * 2) || 0;
                if (totalTarget <= 0) {
                    console.log(`⚠️ Member ${member.Member_id} (${member.Name}) has no ROI target set. Skipping.`);
                    continue;
                }

                const dailyAmount = parseFloat((totalTarget / 300).toFixed(2));

                // 4. DB-Driven Count (Audit-safe)
                const lastPayout = await PayoutModel.findOne({ memberId: member.Member_id })
                    .sort({ createdAt: -1 });
                const nextCount = (lastPayout && typeof lastPayout.count === 'number') ? (lastPayout.count + 1) : 1;

                // Create Payout Record
                const payoutId = Date.now() + Math.floor(Math.random() * 1000);
                const payout = new PayoutModel({
                    payout_id: payoutId,
                    date: new Date(),
                    memberId: member.Member_id,
                    payout_type: "ROI",
                    ref_no: `ROI-${member.Member_id}-${nextCount}`,
                    amount: dailyAmount,
                    count: nextCount,
                    days: 300, // Total calendar window
                    status: "Approved",
                    description: "ROI payout"
                });

                // Create Transaction Record (for wallet/passbook)
                const transaction = new TransactionModel({
                    transaction_id: `ROI-TX-${payoutId}`,
                    transaction_date: today,
                    member_id: member.Member_id,
                    Name: member.Name,
                    mobileno: member.mobileno,
                    description: `Daily ROI Payout (Day ${nextCount}/300)`,
                    transaction_type: "ROI Payout",
                    ew_credit: dailyAmount.toString(),
                    ew_debit: "0",
                    status: "Completed",
                    benefit_type: "ROI",
                    reference_no: payout.ref_no
                });

                // Update Member Metadata and Balance atomically
                member.roi_payout_count = nextCount;
                member.roi_last_payout_date = today;
                member.wallet_balance = (member.wallet_balance || 0) + dailyAmount;

                if (nextCount >= 300) {
                    member.roi_status = "Completed";
                }

                await Promise.all([
                    payout.save(),
                    transaction.save(),
                    member.save()
                ]);

                console.log(`💰 [%] [Day ${nextCount}/${workingDaysLimit}] Credited ₹${dailyAmount} to ${member.Member_id} (${member.Name}). Status: ${member.roi_status}`);
                processedCount++;
            } catch (memberError) {
                console.error(`❌ Error processing ROI for member ${member.Member_id}:`, memberError.message);
            }
        }

        console.log(`✅ ROI Processing Complete. Processed: ${processedCount}/${eligibleMembers.length}`);
        return { success: true, processedCount, totalEligible: eligibleMembers.length };

  } catch (error) {
    console.error("❌ Error in processDailyROI:", error);
    throw error;
  }
};

/**
 * Process ROI for a single member (usually called during activation)
 */
const processMemberROI = async (member) => {
    try {
        const today = moment().format("YYYY-MM-DD");
        
        // Skip if weekend
        if (isWeekend(today)) return { success: false, message: "Weekend" };
        
        // Skip if already paid today
        if (member.roi_last_payout_date === today) return { success: false, message: "Already paid" };

        const totalTarget = member.roi_payout_target || (member.package_value * 2) || 0;
        if (totalTarget <= 0) return { success: false, message: "No target" };

        const dailyAmount = parseFloat((totalTarget / 300).toFixed(2));
        
        // DB-Driven Count (Audit-safe)
        const lastPayout = await PayoutModel.findOne({ memberId: member.member_id || member.Member_id })
            .sort({ createdAt: -1 });
        const nextCount = (lastPayout && typeof lastPayout.count === 'number') ? (lastPayout.count + 1) : 1;

        const payoutId = Date.now() + Math.floor(Math.random() * 1000);
        const payout = new PayoutModel({
            payout_id: payoutId,
            date: new Date(),
            memberId: member.Member_id,
            payout_type: "ROI",
            ref_no: `ROI-${member.Member_id}-${nextCount}`,
            amount: dailyAmount,
            count: nextCount,
            days: 300,
            status: "Approved",
            description: "ROI payout"
        });

        const transaction = new TransactionModel({
            transaction_id: `ROI-TX-${payoutId}`,
            transaction_date: today,
            member_id: member.Member_id,
            Name: member.Name,
            mobileno: member.mobileno,
            description: `Daily ROI Payout (Day ${nextCount}/300)`,
            transaction_type: "ROI Payout",
            ew_credit: dailyAmount.toString(),
            ew_debit: "0",
            status: "Completed",
            benefit_type: "ROI",
            reference_no: payout.ref_no
        });

        member.roi_payout_count = nextCount;
        member.roi_last_payout_date = today;
        member.wallet_balance = (member.wallet_balance || 0) + dailyAmount;
        if (nextCount >= 300) member.roi_status = "Completed";

        await Promise.all([payout.save(), transaction.save(), member.save()]);
        return { success: true, amount: dailyAmount };
    } catch (error) {
        console.error(`❌ Error in processMemberROI for ${member.Member_id}:`, error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { processDailyROI, processMemberROI, isWeekend };
