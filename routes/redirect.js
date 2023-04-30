const express = require("express");

const router = express.Router();

const Url = require("/models/UrlModel.js");

router.get("/shorturl/<short_url>", async (req, res) => {
  try {
    const url = await Url.findOne({
      urlCode: req.params.code,
    });

    if (url) {
      return res.redirect(url.longUrl);
    } else {
      return res.status(404).json({ error: "invalid url" });
    }
  } catch (err) {
    console.err(err);
    res.status(500).json("Server Error");
  }
});

module.exports = router;