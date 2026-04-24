const mongoose = require("mongoose");

const smsTrackSchema = mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
    },
    message_type: {
      type: String,
      default: null,
    },
    mobileno: {
      type: String,
      default: null,
    },
    member_id: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      default: "send",
    },
  },
  { timestamps: true, collection: "sms_track_tbl" }
);

const SmsTrackModel = mongoose.model("sms_track_tbl", smsTrackSchema);
module.exports = SmsTrackModel;

