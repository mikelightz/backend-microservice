const DB_URI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.etlu3sc.mongodb.net/?retryWrites=true&w=majority`;
// index.js
// where your node app starts

// init project
var express = require("express");
var app = express();
var port = process.env.PORT || 3000;
require("dotenv").config();

var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var shortid = require("shortid");
var validUrl = require("valid-url");

mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const URLSchema = mongoose.model(
  "UrlSchema",
  new mongoose.Schema({
    original_url: String,
    suffix: String,
    short_url: String,
  })
);

app.post("/api/shorturl/", async (req, res) => {
  let client_req_url = req.body.url;
  let suffix = shortid.generate();
  // let baseUrl = "http:localhost:3000";

  if (!validUrl.isUri(client_req_url)) {
    console.log(req);
    return res.status(401).json({ error: "invalid url" });
  }

  // if (!validUrl.isUri(baseUrl)) {
  //   return res.json({ error: "invalid base url" });
  // }

  try {
    let newUrl = await URLSchema.findOne({
      original_url: "client_req_url",
    }); // checks if og url is in database before making short url

    if (newUrl) {
      // if url exist, return response
      res.json(newUrl); // response = "return(display) on screen"
    } else {
      newUrl = new URLSchema({
        original_url: client_req_url,
        suffix: suffix,
        short_url: __dirname + "/api/shorturl/" + suffix,
      });

      await newUrl.save();
      res.json(newUrl);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/api/shorturl/:suffix", async (req, res) => {
  let userGenSuffix = req.params.suffix;

  try {
    let reDirUrl = await URLSchema.findOne({
      suffix: userGenSuffix,
    });

    if (reDirUrl) {
      return res.redirect(reDirUrl.original_url);
    } else {
      return res.status(404).json({ error: "invalid url" });
    }
  } catch (err) {
    console.err(err);
    res.status(500).json("Server Error");
  }
});

// listen for requests :)
var listener = app.listen(port, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
