const mongoose = require('mongoose');
require('dotenv').config();

const MemberModel = require("./models/Users/Member");
const PayoutModel = require("./models/Payout/Payout");
const TransactionModel = require("./models/Transaction/Transaction");

const fixROI = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to DB");

        const fromDate = new Date("2026-09-01T19:00:00.000Z");

        // 1. Fix Base & Add-On ROI Payouts
        const basePayouts = await PayoutModel.find({
            createdAt: { $gte: fromDate },
            payout_type: { $in: ["ROI", "ROI (Add-On)"] },
            days: 100
        });

        console.log(`Found ${basePayouts.length} base/add-on payouts to fix.`);

        let walletDeductions = {}; // { memberId: amount }

        for (const payout of basePayouts) {
            const originalAmount = payout.amount;
            const correctAmount = parseFloat((originalAmount / 3).toFixed(2));
            const diff = originalAmount - correctAmount;

            walletDeductions[payout.memberId] = (walletDeductions[payout.memberId] || 0) + diff;

            // Fix payout
            payout.amount = correctAmount;
            payout.days = 300;
            payout.description = payout.description ? payout.description.replace("/100", "/300") : payout.description;
            await payout.save();

            // Fix transaction
            const tx = await TransactionModel.findOne({ reference_no: payout.ref_no, transaction_type: "ROI Payout" });
            if (tx) {
                tx.ew_credit = correctAmount.toString();
                tx.description = tx.description ? tx.description.replace("/100", "/300") : tx.description;
                await tx.save();
            }
        }

        // 2. Fix ROI Level Benefits
        const levelPayouts = await PayoutModel.find({
            createdAt: { $gte: fromDate },
            payout_type: "ROI Level Benefit",
        });

        console.log(`Found ${levelPayouts.length} level payouts to fix.`);

        for (const payout of levelPayouts) {
            // Check if this payout is actually 3x larger than it should be.
            // Since it was generated today alongside the bad 100 days ROI, it is.
            const originalAmount = payout.amount;
            const correctAmount = parseFloat((originalAmount / 3).toFixed(2));
            const diff = originalAmount - correctAmount;

            walletDeductions[payout.memberId] = (walletDeductions[payout.memberId] || 0) + diff;

            payout.amount = correctAmount;
            if (payout.description) {
                // e.g. "ROI Level 1 benefit (5%) from member BMS000100's ROI (₹3000)"
                payout.description = payout.description.replace(/₹(\d+(\.\d+)?)/, (match, p1) => {
                    return `₹${parseFloat((parseFloat(p1) / 3).toFixed(2))}`;
                });
            }
            await payout.save();

            const tx = await TransactionModel.findOne({ reference_no: payout.payout_id.toString(), transaction_type: "ROI Level Benefit" });
            if (tx) {
                tx.ew_credit = correctAmount.toString();
                await tx.save();
            }
        }

        // 3. Deduct differences from wallets
        let updatedMembers = 0;
        for (const [memberId, deduction] of Object.entries(walletDeductions)) {
            if (deduction > 0) {
                await MemberModel.updateOne({ Member_id: memberId }, { $inc: { wallet_balance: -deduction } });
                updatedMembers++;
                console.log(`Deducted ₹${deduction.toFixed(2)} from ${memberId}`);
            }
        }
        
        console.log(`Successfully fixed ROIs. Updated ${updatedMembers} members' wallets.`);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

fixROI();
