const mongoose = require("mongoose");

const countrySchema = mongoose.Schema(
  {
    Code: {
      type: String,
      required: true,
    },
    Name: {
      type: String,
      required: true,
    },
    Continent: {
      type: String,
      enum: ['Asia', 'Europe', 'North America', 'Africa', 'Oceania', 'Antarctica', 'South America'],
      default: 'Asia',
    },
    Region: {
      type: String,
      required: true,
    },
    SurfaceArea: {
      type: Number,
      default: 0.00,
    },
    IndepYear: {
      type: Number,
      default: null,
    },
    Population: {
      type: Number,
      default: 0,
    },
    LifeExpectancy: {
      type: Number,
      default: null,
    },
    GNP: {
      type: Number,
      default: null,
    },
    GNPOld: {
      type: Number,
      default: null,
    },
    LocalName: {
      type: String,
      required: true,
    },
    GovernmentForm: {
      type: String,
      required: true,
    },
    HeadOfState: {
      type: String,
      default: null,
    },
    Capital: {
      type: Number,
      default: null,
    },
    Code2: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, collection: "country" }
);

const CountryModel = mongoose.model("country", countrySchema);
module.exports = CountryModel;

