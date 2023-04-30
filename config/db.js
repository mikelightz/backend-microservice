const mongoose = require("mongoose");

const DB_URI =
  "mongodb+srv://new-user1:Canon123@cluster0.etlu3sc.mongodb.net/?retryWrites=true&w=majority";

// mongoose.connect(process.env.DB_URI)
mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connection = mongoose.connection;

module.exports = connection;
