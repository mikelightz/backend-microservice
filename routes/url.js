// necessary file packages
const express = require("express");
const validUrl = require("valid-url");
const shortid = require("shortid");

// express router
const router = express.Router();

// import url database model
const Url = require("/models/UrlModel.js");

const baseUrl = "http:localhost:3000";

router.post("/shorturl", async (req, res) => {
  const { longUrl } = reg.body; //destructing

  if (!validUrl.isUri(baseUrl)) {
    return res.json({ error: "invalid url" });
  }

  const urlCode = shortid.generate(); //if not an error build short url code

  if (validUrl.isUri(longUrl)) {
    try {
      let url = await Url.findOne({
        longUrl,
      }); // checks if long url is in database before making short url

      if (url) {
        // if url exist, return response
        res.json(url); // response = "return(display) on screen"
      } else {
        const shortUrl = baseUrl + "/" + urlCode;

        url = new Url({
          //invoking url model and saving to DB
          longUrl,
          shortUrl,
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
  } else {
    res.status(401).json({ error: "invalid url" });
  }
});

module.exports = router;
