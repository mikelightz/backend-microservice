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
var multer = require("multer");
var urlParser = require("url");
var dns = require("dns");

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
const { url } = require("inspector");
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.get("/exercisetracker", function (req, res) {
  res.sendFile(__dirname + "/views/exercisetracker.html");
});

app.get("/filemetadata", function (req, res) {
  res.sendFile(__dirname + "/views/filemetadata.html");
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

//Exercise Tracker App
const UsernameSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
  },
  { versionKey: false }
);

const Users = mongoose.model("Users", UsernameSchema);

const ExerciseSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    userId: { type: String, required: true },
  },
  { versionKey: false }
);

const Exercises = mongoose.model("Exercises", ExerciseSchema);

app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  const userObj = new Users({
    username: username,
  });

  try {
    const user = await userObj.save();
    res.json(user);
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/users", async (req, res) => {
  let users = await Users.find();
  res.send(users);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  let { description, date } = req.body;
  let duration = parseInt(req.body.duration);

  try {
    const user = await Users.findById(id);
    if (!user) {
      res.send("could not find user");
    } else {
      const exerciseObj = new Exercises({
        description,
        duration,
        date: date ? new Date(date) : new Date(),
        userId: user._id,
      });

      const exercise = await exerciseObj.save();
      res.json({
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
        _id: user._id,
      });
    }
  } catch (err) {
    console.log(err);
    res.send("There was an error saving the exercise");
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  let { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await Users.findById(id);

  if (!user) {
    res.send("could not find user");
    return;
  }

  let dateObj = {};
  if (from) {
    dateObj[`$gte`] = new Date(from);
  }
  if (to) {
    dateObj[`$lte`] = new Date(to);
  }
  let filter = { userId: id };
  if (from || to) {
    filter.date = dateObj;
  }

  const exercises = await Exercises.find(filter).limit(+limit ?? 500);

  const exerciseLog = exercises.map((e) => {
    return {
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    };
  });

  console.log(exercises);
  res.json({
    _id: user._id,
    username: user.username,
    count: exercises.length,
    log: exerciseLog,
  });
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

// Timestamp App

app.get("/api/:date", function (req, res) {
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

// URL Shortener App
app.use("/public", express.static(`${process.cwd()}/public`));

const URLSchema = new mongoose.Schema({
  original_url: { type: String, required: true, unique: true },
  short_url: { type: String, required: true, unique: true },
});

let URLModel = mongoose.model("url", URLSchema);

app.post("/api/shorturl", function (req, res) {
  let url = req.body.url;

  //validate url
  try {
    urlObj = new URL(url);
    dns.lookup(urlObj.hostname, (err, address, family) => {
      //if the DNS domain doesn't exist no address returned
      if (!address) {
        res.json({ error: "invalid url" });
      }
      //we have a valid url
      else {
        let original_url = urlObj.href;
        let short_url = shortid.generate();
        resObj = {
          original_url: original_url,
          short_url: short_url,
        };

        //create an entry in the database
        let newURL = new URLModel(resObj);
        newURL.save();
        res.json(resObj);
      }
    });
  } catch {
    res.json({ error: "invalid url" });
  }
});

app.get("/api/shorturl/:short_url", function (req, res) {
  let short_url = req.params.short_url;

  //find the og url from database
  URLModel.findOne({ short_url: short_url }).then((foundURL) => {
    if (foundURL) {
      let original_url = foundURL.original_url;
      res.redirect(original_url);
    } else {
      res.json({ message: "the short_url does not exist}" });
    }
  });
});

// file metadata app
const upload = multer({ dest: "uploads/" });

app.post(
  "/filemetadata/api/fileanalyse",
  upload.single("upfile"),
  (req, res) => {
    res.json({
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
    });
  }
);

// listen for requests :)
var listener = app.listen(port, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
