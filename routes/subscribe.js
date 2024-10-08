const express = require("express");
const Subscribe = express.Router();
const Data = require("../controllers/User/subscribe");

// create subscribe
Subscribe.route("/create-subscribe").post(Data.CreateSubscribe)
Subscribe.route("/facebook-post").post(Data.postPhotoToFacebook)


// exports
module.exports = Subscribe