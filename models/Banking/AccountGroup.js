const mongoose = require("mongoose");

const accountGroupSchema = mongoose.Schema(
  {
    account_group_id: {
      type: String,
      required: true,
    },
    account_book_id: {
      type: String,
      default: null,
    },
    account_group_name: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: "active",
    },
  },
  { timestamps: true, collection: "account_group_tbl" }
);

const AccountGroupModel = mongoose.model("account_group_tbl", accountGroupSchema);
module.exports = AccountGroupModel;
