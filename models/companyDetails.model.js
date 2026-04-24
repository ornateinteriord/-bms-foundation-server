const mongoose = require("mongoose");

const companyDetailsSchema = mongoose.Schema(
  {
    company_id: {
      type: String,
      required: true,
    },
    company_name: {
      type: String,
      default: null,
    },
    company_type: {
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
    country: {
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
    email_id1: {
      type: String,
      default: null,
    },
    email_id2: {
      type: String,
      default: null,
    },
    email_id3: {
      type: String,
      default: null,
    },
    website: {
      type: String,
      default: null,
    },
    company_prefix: {
      type: String,
      default: null,
    },
    doe_doi: {
      type: String,
      default: null,
    },
    company_logo: {
      type: Buffer,
      default: null,
    },
    tin_number: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, collection: "company_details_tbl" }
);

const CompanyDetailsModel = mongoose.model("company_details_tbl", companyDetailsSchema);
module.exports = CompanyDetailsModel;

