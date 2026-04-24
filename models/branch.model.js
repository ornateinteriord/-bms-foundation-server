const mongoose = require("mongoose");

const branchSchema = mongoose.Schema(
  {
    branch_id: {
      type: String,
      required: true,
    },
    branch_name: {
      type: String,
      default: null,
    },
    address1: {
      type: String,
      default: null,
    },
    address2: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    state: {
      type: String,
      default: null,
    },
    pincode: {
      type: Number,
      default: null,
    },
    contact_no1: {
      type: String,
      default: null,
    },
    contact_no2: {
      type: String,
      default: null,
    },
    contact_no3: {
      type: String,
      default: null,
    },
    website: {
      type: String,
      default: null,
    },
    date_of_operation: {
      type: Date,
      default: null,
    },
    branch_prefix: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: "active",
    },
  },
  { timestamps: true, collection: "branch_tbl" }
);

const BranchModel = mongoose.model("branch_tbl", branchSchema);
module.exports = BranchModel;

