// index.js
// where your node app starts

// init project
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

var mongo = require("mongodb");
var bodyParser = require("body-parser");

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require("cors");
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/timestamp", function (req, res) {
  res.sendFile(__dirname + "/views/timestamp.html");
});

app.get("/requestheaderparser", function (req, res) {
  res.sendFile(__dirname + "/views/requestheaderparser.html");
});

app.get("/urlshortner", function (req, res) {
  res.sendFile(__dirname + "/views/urlshortner.html");
});
// Home
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.get("/api", function (req, res) {
  var now = new Date();

  res.json({
    unix: now.getTime(),
    utc: now.toUTCString(),
  });
});

// Timestamp App

app.get("/api/:date?", function (req, res) {
  let dateString = req.params.date;
  let passedInValue = new Date(dateString);

  if (parseInt(dateString) > 10000) {
    let unixTime = new Date(parseInt(dateString));
    res.json({
      unix: unixTime.getTime(),
      utc: unixTime.toUTCString(),
    });
  }

  if (passedInValue == "Invalid Date") {
    res.json({ error: "Invalid Date" });
  } else {
    res.json({
      unix: passedInValue.getTime(),
      utc: passedInValue.toUTCString(),
    });
  }
});

// Header Parser App
app.get("/api/whoami", function (req, res) {
  let ipAddress =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || null;

  res.json({
    ipaddress: ipAddress,
    language: req.headers["accept-language"],
    software: req.headers["user-agent"],
  });
});

// URL Shortner App
// Database config
const connection = require("./config/db");
connection.once("open", () => console.log("DB Connected"));
connection.on("error", () => console.log("Error"));

//Routes config
app.use(
  express.json({
    extended: false,
  })
);
app.use("/", require("./routes/redirect"));
app.use("/api", require("./routes/url"));

// listen for requests :)
var listener = app.listen(port, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
