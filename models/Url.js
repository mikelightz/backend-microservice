const mongoose = require("mongoose");

const URLSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
  urlCode: String,
  date: {
    type: String,
    default: Date.now,
  },
});

module.exports = mongoose.model("Url", URLSchema);
