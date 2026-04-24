const mongoose = require("mongoose");

const agentTransactionSchema = mongoose.Schema(
  {
    agent_transaction_id: {
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
    voucher_no: {
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
      default: null,
    },
    branch_id: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, collection: "agent_transaction_tbl" }
);

const AgentTransactionModel = mongoose.model("agent_transaction_tbl", agentTransactionSchema);
module.exports = AgentTransactionModel;

