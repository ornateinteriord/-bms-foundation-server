const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    id : {
      type : String,
    },
    user_id: {
      type: String,
      required: true,
    },
    user_name: {
      type: String,
      default: null,
    },
    reference_id: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    user_role: {
      type: String,
      default: null,
      enum: ["ADMIN", "USER", "AGENT"],
    },
    Employee: {
      type: String,
      default: null,
    },
    MarketingManager: {
      type: String,
      default: null,
    },
    HumanResource: {
      type: String,
      default: null,
    },
    AccountManager: {
      type: String,
      default: null,
    },
    user_status: {
      type: String,
      default: "active",
    },
    add_responsibilty: {
      type: String,
      default: null,
    },
    transfer_from: {
      type: Date,
      default: null,
    },
    transfer_to: {
      type: Date,
      default: null,
    },
    branch_code: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, collection: "user_tbl" }
);

const UserModel = mongoose.model("user_tbl", userSchema);
module.exports = UserModel;

