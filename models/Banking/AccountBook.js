const mongoose = require("mongoose");

const accountBookSchema = mongoose.Schema(
  {
    account_book_id: {
      type: String,
      required: true,
    },
    account_book_name: {
      type: String,
      default: null,
    },
    primary_book: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, collection: "account_book_tbl" }
);

const AccountBookModel = mongoose.model("account_book_tbl", accountBookSchema);
module.exports = AccountBookModel;
