// index.js
// where your node app starts

// init project
var express = require("express");
var app = express();
var port = process.env.PORT || 3000;
var dotenv = require("dotenv");
dotenv.config();

var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var shortid = require("shortid");
var validUrl = require("valid-url");

mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`Db Connected`);
  })
  .catch((err) => {
    console.log(err.message);
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

app.get("/urlshortener", function (req, res) {
  res.sendFile(__dirname + "/views/urlshortener.html");
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

// URL Shortener App
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(`${process.cwd()}/public`));

const URLSchema = new mongoose.Schema({
  original_url: String,
  urlId: String,
  short_url: String,
});

const Url = mongoose.model("Url", URLSchema);

app.post("/api/shorturl/", async (req, res) => {
  // let client_req_url = req.body.url;
  let { url } = req.body;
  // let baseUrl = "http://localhost:3000";
  let dns = require("node:dns");
  let protocol = /^https?:\/\//i;
  let dnsUrl = url.replace(protocol, "");

  dns.lookup(dnsUrl, async function (err, exists) {
    if (exists) {
      try {
        let newUrl = await Url.findOne({
          original_url: url,
        }); // checks if og url is in database before making short url

        if (newUrl) {
          // if newUrl exist, return response
          res.json(newUrl); // response = "return(display) on screen"
        } else {
          let short_url = __dirname + "/api/shorturl/" + urlId;

          newUrl = new Url({
            original_url: url,
            urlId: urlId,
            short_url: short_url,
          });

          await newUrl.save();
          res.json(newUrl);
        }
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: "server error" });
      }
    } else {
      return res.status(400).json({ error: "invalid url" });
    }
  });
});
//   if (!validUrl.isUri(baseUrl)) {
//     return res.json({ error: "invalid base url" });
//   }

//   let urlId = shortid.generate();

//   console.log(req.body);

//   if (validUrl.isUri(url)) {
//     try {
//       let newUrl = await Url.findOne({
//         original_url: url,
//       }); // checks if og url is in database before making short url

//       if (newUrl) {
//         // if newUrl exist, return response
//         res.json(newUrl); // response = "return(display) on screen"
//       } else {
//         let short_url = baseUrl + "/api/shorturl/" + urlId;

//         newUrl = new Url({
//           original_url: url,
//           urlId: urlId,
//           short_url: short_url,
//         });

//         await newUrl.save();
//         res.json(newUrl);
//       }
//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: "server error" });
//     }
//   } else {
//     return res.status(400).json({ error: "invalid url" });
//   }
// });

app.get("/api/shorturl/:urlId?", async (req, res) => {
  let userGenId = req.params.urlId;

  try {
    let reDirUrl = await Url.findOne({
      urlId: userGenId,
    });

    if (reDirUrl) {
      return res.redirect(reDirUrl.original_url);
    } else {
      return res.status(404).json({ error: "invalid url" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Server Error");
  }
});

// listen for requests :)
var listener = app.listen(port, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
