const mongoose = require("mongoose");

const cashTransactionSchema = mongoose.Schema(
  {
    cash_transaction_id: {
      type: String,
      required: true,
    },
    transaction_date: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    reference_no: {
      type: String,
      default: null,
    },
    credit: {
      type: Number,
      default: null,
    },
    debit: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      default: "active",
    },
    voucher_no: {
      type: String,
      default: null,
    },
    branch_id: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, collection: "cash_transaction_tbl" }
);

const CashTransactionModel = mongoose.model("cash_transaction_tbl", cashTransactionSchema);
module.exports = CashTransactionModel;
