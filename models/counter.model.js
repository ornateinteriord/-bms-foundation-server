const mongoose = require("mongoose");

const counterSchema = mongoose.Schema(
  {
    counter_id: {
      type: String,
      required: true,
    },
    counter_prefix: {
      type: String,
      default: null,
    },
    counter_count: {
      type: Number,
      default: null,
    },
    counter_name: {
      type: String,
      default: null,
    },
    from_date: {
      type: Date,
      default: null,
    },
    to_date: {
      type: Date,
      default: null,
    },
    auto_reset: {
      type: String,
      default: null,
    },
    company_prefix: {
      type: String,
      default: null,
    },
    branch_prefix: {
      type: String,
      default: null,
    },
    financial_year_prefix: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: "acitve",
    },
  },
  { timestamps: true, collection: "counter_tbl" }
);

const CounterModel = mongoose.model("counter_tbl", counterSchema);
module.exports = CounterModel;

