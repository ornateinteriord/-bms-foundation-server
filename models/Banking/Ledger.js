const mongoose = require("mongoose");

const ledgerSchema = mongoose.Schema(
  {
    ledger_id: {
      type: String,
      required: true,
    },
    account_book_id: {
      type: String,
      default: null,
    },
    account_group_id: {
      type: String,
      default: null,
    },
    ledger_name: {
      type: String,
      default: null,
    },
    reference_id: {
      type: String,
      default: null,
    },
    opening_balance: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true, collection: "ledger_tbl" }
);

const LedgerModel = mongoose.model("ledger_tbl", ledgerSchema);
module.exports = LedgerModel;
