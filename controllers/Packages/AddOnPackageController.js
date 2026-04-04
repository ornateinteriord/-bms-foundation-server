const AddOnRequestModel = require("../../models/Packages/AddOnRequest");
const AddOnPackageModel = require("../../models/Packages/AddOnPackage");
const MemberModel = require("../../models/Users/Member");
const mlmService = require("../Users/mlmService/mlmService");
const { processAddOnROI, processMemberROI } = require("../Users/roiService/roiService");
const PayoutModel = require("../../models/Payout/Payout");
const TransactionModel = require("../../models/Transaction/Transaction");


// User requests a new addon package layer
const requestAddOn = async (req, res) => {
  try {
    const { member_id, requested_amount } = req.body;

    if (!member_id || !requested_amount) {
      return res.status(400).json({ success: false, message: "Member ID and Amount are required" });
    }

    const member = await MemberModel.findOne({ Member_id: member_id });
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const request_id = `AOR${Date.now()}`;
    const newRequest = new AddOnRequestModel({
      request_id,
      member_id,
      requested_amount: Number(requested_amount)
    });

    await newRequest.save();

    res.status(201).json({ success: true, message: "Add-On request submitted successfully", request: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin gets list of ALL requests 
const getAllRequests = async (req, res) => {
  try {
    const requests = await AddOnRequestModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all approved add-ons for a specific member (user dashboard)
const getMemberAddOns = async (req, res) => {
  try {
    const { member_id } = req.params;
    const addons = await AddOnPackageModel.find({
      member_id
    }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, addons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Approves/Rejects the request
const evaluateRequest = async (req, res) => {
  try {
    const { request_id } = req.params;
    const { status, admin_id } = req.body; // 'APPROVED' or 'REJECTED'

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const request = await AddOnRequestModel.findOne({ request_id });
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Request already evaluated" });
    }

    request.status = status;
    request.admin_audit = {
      admin_id: admin_id || "SYSTEM",
      timestamp: new Date()
    };

    if (status === "APPROVED") {
      const member = await MemberModel.findOne({ Member_id: request.member_id });
      if (!member) {
        return res.status(404).json({ success: false, message: "Member not found" });
      }

      // ✅ CASE A: Primary Package (First Package for this Member)
      if (!member.package_value || member.package_value === 0) {
        console.log(`💎 [Package] First package detected for ${member.Member_id}. Storing in member_tbl.`);
        
        member.package_value = request.requested_amount;
        member.spackage = `PKG-${request.requested_amount}`; // Generic tag
        member.status = "active";
        member.roi_status = "Active";
        member.roi_start_date = new Date().toISOString().split('T')[0];
        member.roi_payout_target = request.requested_amount * 2;
        member.roi_payout_count = 0;

        await member.save();

        // Trigger immediate first ROI payout for Primary Package
        await processMemberROI(member);
      } 
      // ✅ CASE B: Add-On Package (Subsequent Packages)
      else {
        console.log(`📦 [Package] Add-on package detected for ${member.Member_id}. Storing in add_on_package_tbl.`);

        // 1. Create the new AddOnPackage record
        const newAddOn = new AddOnPackageModel({
          package_id: `PKG-A-${Date.now()}`,
          member_id: request.member_id,
          amount: request.requested_amount,
          roi_status: "Active",
          roi_payout_target: request.requested_amount * 2,
          roi_payout_count: 0,
          roi_start_date: new Date().toISOString().split('T')[0],
          request_id: request.request_id,
          admin_id: admin_id || "SYSTEM"
        });

        await newAddOn.save();

        // 2. Trigger immediate first ROI payout for this Add-On
        await processAddOnROI(newAddOn, member);
      }

      // ✅ Trigger MLM level commissions for the Package amount (same for both Primary/Add-On)
      try {
        const commissions = await mlmService.calculateCommissions(
          request.member_id,
          member.sponsor_id,
          request.requested_amount, 
          "Add-On" // We can keep type "Add-On" or differentiate if needed
        );
        if (commissions.length > 0) {
          await mlmService.processCommissions(commissions);
          console.log(`✅ MLM commissions distributed for Package ${request_id} (₹${request.requested_amount})`);
        }
      } catch (commErr) {
        console.error(`⚠️ Commission distribution failed for Package ${request_id}:`, commErr.message);
      }
    }

    await request.save();

    res.status(200).json({ success: true, message: `Request successfully ${status.toLowerCase()}`, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  requestAddOn,
  getAllRequests,
  getMemberAddOns,
  evaluateRequest
};

