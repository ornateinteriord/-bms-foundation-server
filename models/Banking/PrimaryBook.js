const mongoose = require("mongoose");

const primaryBookSchema = mongoose.Schema(
  {
    primary_book_id: {
      type: String,
      required: true,
    },
    primary_book_name: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, collection: "primary_book_tbl" }
);

const PrimaryBookModel = mongoose.model("primary_book_tbl", primaryBookSchema);
module.exports = PrimaryBookModel;
