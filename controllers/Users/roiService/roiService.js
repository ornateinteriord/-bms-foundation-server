const MemberModel = require("../../../models/Users/Member");
const PayoutModel = require("../../../models/Payout/Payout");
const TransactionModel = require("../../../models/Transaction/Transaction");
const mlmService = require("../mlmService/mlmService");
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

let isROIProcessing = false;

/**
 * Process daily ROI for all eligible members (Smart Catch-up)
 * Handles multi-day gaps automatically with production-grade safety.
 */
const processDailyROI = async () => {
    if (isROIProcessing) {
        console.log("⚠️ [ROI] Process already running. Skipping concurrent trigger.");
        return { success: false, message: "Process already running" };
    }

    isROIProcessing = true;
    try {
        // Fix: Use moment object for robust date comparison
        const today = moment().startOf("day");
        
        // Find all active members
        const activeMembers = await MemberModel.find({
            status: "active",
            roi_status: "Active"
        });

        console.log(`🚀 [ROI] [${today.format("YYYY-MM-DD")}] Starting Smart Processing for ${activeMembers.length} active members...`);

        let totalPayoutsProcessed = 0;
        let membersUpdatedCount = 0;

        for (const member of activeMembers) {
            // Start a new session for each member catch-up to ensure atomicity
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                let startRefDate = member.roi_last_payout_date || member.roi_start_date || moment(member.createdAt).format("YYYY-MM-DD");
                let currentDayPtr = moment(startRefDate).startOf("day").add(1, "days");
                
                let memberPayoutsThisRun = 0;
                const originalTotalCount = member.roi_payout_count || 0;

                // Loop from last payout to Today
                while (currentDayPtr.isSameOrBefore(today, "day")) {
                    const processingDateStr = currentDayPtr.format("YYYY-MM-DD");

                    // Only process on weekdays (Mon-Fri)
                    if (!isWeekend(processingDateStr)) {
                        const totalTargetAmount = member.roi_payout_target || (member.package_value * 2) || 0;
                        
                        if (totalTargetAmount > 0) {
                            const dailyPayoutAmount = parseFloat((totalTargetAmount / 300).toFixed(2));
                            const nextCount = originalTotalCount + memberPayoutsThisRun + 1;

                            if (nextCount <= 300) {
                                const payoutIdNum = Date.now() + Math.floor(Math.random() * 1000);
                                
                                // Create Payout Entry (Historical Date)
                                const payout = new PayoutModel({
                                    payout_id: payoutIdNum,
                                    date: currentDayPtr.toDate(),
                                    memberId: member.Member_id,
                                    payout_type: "ROI",
                                    ref_no: `ROI-${member.Member_id}-${nextCount}`,
                                    amount: dailyPayoutAmount,
                                    count: nextCount,
                                    days: 300,
                                    status: "Approved",
                                    description: "ROI payout"
                                });

                                // Create Transaction Record
                                const transaction = new TransactionModel({
                                    transaction_id: `ROI-TX-${payoutIdNum}`,
                                    transaction_date: processingDateStr,
                                    member_id: member.Member_id,
                                    Name: member.Name,
                                    mobileno: member.mobileno,
                                    description: `Daily ROI Payout (Day ${nextCount}/300)`,
                                    transaction_type: "ROI Payout",
                                    ew_credit: dailyPayoutAmount.toString(),
                                    ew_debit: "0",
                                    status: "Completed",
                                    benefit_type: "ROI",
                                    reference_no: payout.ref_no
                                });

                                // Distribute Level Commissions (MLM)
                                // Pass session if mlmService supports it (currently assuming standard for safety)
                                await mlmService.distributeROICommission(member.Member_id, dailyPayoutAmount);

                                await payout.save({ session });
                                await transaction.save({ session });

                                // Update local state for member
                                member.wallet_balance = (member.wallet_balance || 0) + dailyPayoutAmount;
                                member.roi_payout_count = nextCount;

                                if (nextCount >= 300) {
                                    member.roi_status = "Completed";
                                }

                                memberPayoutsThisRun++;
                                totalPayoutsProcessed++;
                            }
                        }
                    }

                    // Always advance date to mark it as processed
                    member.roi_last_payout_date = processingDateStr;
                    currentDayPtr.add(1, "days");

                    if (member.roi_status === "Completed") break;
                }

                if (memberPayoutsThisRun > 0 || member.isModified('roi_last_payout_date')) {
                    await member.save({ session });
                    await session.commitTransaction();
                    if (memberPayoutsThisRun > 0) {
                        membersUpdatedCount++;
                        console.log(`💰 [%] [Day ${member.roi_payout_count}/300] Credited ₹${memberPayoutsThisRun} days to ${member.Member_id}.`);
                    }
                } else {
                    await session.abortTransaction();
                }

            } catch (memberError) {
                await session.abortTransaction();
                console.error(`❌ ROI Error for ${member.Member_id}:`, memberError.message);
            } finally {
                session.endSession();
            }
        }

        console.log(`✅ [ROI] Smart Processing Complete. Total Payouts: ${totalPayoutsProcessed}.`);
        return { success: true, processedCount: totalPayoutsProcessed, membersUpdated: membersUpdatedCount };

    } catch (globalError) {
        console.error("❌ Global Error in processDailyROI:", globalError);
        throw globalError;
    } finally {
        isROIProcessing = false;
    }
};

/**
 * Process ROI for a single member (typically called during activation)
 */
const processMemberROI = async (member) => {
    // Start session for atomic single run
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const todayStr = moment().format("YYYY-MM-DD");
        
        if (isWeekend(todayStr)) {
            await session.abortTransaction();
            session.endSession();
            return { success: false, message: "Weekend" };
        }

        if (member.roi_last_payout_date === todayStr) {
            await session.abortTransaction();
            session.endSession();
            return { success: false, message: "Already paid" };
        }

        const dailyAmt = parseFloat(((member.roi_payout_target || (member.package_value * 2)) / 300).toFixed(2));
        const nextIdx = (member.roi_payout_count || 0) + 1;

        const pId = Date.now() + Math.floor(Math.random() * 1000);
        const payout = new PayoutModel({
            payout_id: pId, date: new Date(), memberId: member.Member_id,
            payout_type: "ROI", ref_no: `ROI-${member.Member_id}-${nextIdx}`,
            amount: dailyAmt, count: nextIdx, days: 300, status: "Approved"
        });

        const transaction = new TransactionModel({
            transaction_id: `ROI-TX-${pId}`, transaction_date: todayStr,
            member_id: member.Member_id, Name: member.Name, mobileno: member.mobileno,
            description: `Daily ROI Payout (Day ${nextIdx}/300)`, transaction_type: "ROI Payout",
            ew_credit: dailyAmt.toString(), ew_debit: "0", status: "Completed", benefit_type: "ROI"
        });

        member.roi_payout_count = nextIdx;
        member.roi_last_payout_date = todayStr;
        member.wallet_balance = (member.wallet_balance || 0) + dailyAmt;
        if (nextIdx >= 300) member.roi_status = "Completed";

        await Promise.all([payout.save({ session }), transaction.save({ session }), member.save({ session })]);
        await session.commitTransaction();
        await mlmService.distributeROICommission(member.Member_id, dailyAmt);

        return { success: true, amount: dailyAmt };
    } catch (err) {
        await session.abortTransaction();
        console.error(`❌ ROI Single Error for ${member.Member_id}:`, err.message);
        return { success: false, error: err.message };
    } finally {
        session.endSession();
    }
};

module.exports = { processDailyROI, processMemberROI, isWeekend };
