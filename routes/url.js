// necessary file packages
const express = require("express");
const validUrl = require("valid-url");
const shortid = require("shortid");

// express router
const router = express.Router();

// import url database model
const Url = require("../models/Url");

const baseUrl = "http:localhost:3000";

router.post("/shorturl", async (req, res) => {
  const { longUrl } = req.body; //destructing

  if (validUrl.isUri(longUrl)) {
    return res.status(401).json({ error: "invalid url" });
  }

  if (!validUrl.isUri(baseUrl)) {
    return res.json({ error: "invalid base url" });
  }

  const urlCode = shortid.generate(); //if not an error build short url code

  try {
    let url = await Url.findOne({
      longUrl,
    }); // checks if long url is in database before making short url

    if (url) {
      // if url exist, return response
      res.json(url); // response = "return(display) on screen"
    } else {
      const short_url = baseUrl + "/" + urlCode;

      url = new Url({
        //invoking url model and saving to DB
        original_url,
        short_url,
        urlCode,
        date: new Date(),
      });

      await url.save();
      res.json(url);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
