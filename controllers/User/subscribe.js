const Subscribe = require("../../model/User/Subscribe");
const TryCatch = require("../../middleware/Trycatch");
const axios = require("axios");
const Mail = require("../../utils/sendmail");

const CreateSubscribe = TryCatch(async (req, res, next) => {
  const email = req.body.email;
  // const { email } = req.body;
  const findUser = await Subscribe.findOne({ email });

  if (findUser) {
    return res.status(400).json({
      success: false,
      message: "You have already subscribed",
    });
  }

  const subscribe = await Subscribe.create(email);




  const logoUrl = "https://paliji-admin.vercel.app/static/media/logo.749613bd9100ee0b9f00.png";
  const shopName = "Palji Bakery";
  
  const emailContent = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background-color: #f7f7f7;">
      <div style="text-align: center;">
        <img src="${logoUrl}" alt="${shopName} Logo" style="width: 150px; margin-bottom: 20px;" />
        <h1 style="color: #ff6f61;">Welcome to ${shopName}!</h1>
      </div>
      <div style="padding: 20px; background-color: #ffffff; border-radius: 8px;">
        <p style="font-size: 16px; line-height: 1.5;">
          Dear Subscriber,
        </p>
        <p style="font-size: 16px; line-height: 1.5;">
          Congratulations! You have successfully subscribed to <strong>${shopName}</strong> for product updates and special offers.
        </p>
        <p style="font-size: 16px; line-height: 1.5;">
          Thank you for joining our community. We are excited to keep you updated on our latest products and promotions. Stay tuned for delicious updates!
        </p>
        <p style="font-size: 16px; line-height: 1.5;">
          If you have any questions or need assistance, feel free to contact us at any time.
        </p>
        <p style="font-size: 16px; line-height: 1.5; color: #ff6f61;">
          Happy Baking!<br/>
          The ${shopName} Team
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <p style="font-size: 14px; color: #777;">
          &copy; ${new Date().getFullYear()} ${shopName}. All rights reserved.
        </p>
      </div>
    </div>
  `;

  Mail(
    email,
    "Subscribed Successfully",
    emailContent,
    true

  );

  res.status(201).json({
    success: true,
    message: "congratulations, you have subscribed successfully",
  });
});

const postPhotoToFacebook = async (req, res, next) => {
  const {
    url,
    message,
    published,
    page_id,
    scheduled_publish_time,
    access_token,
  } = req.body;
  const postData = {
    url,
    message,
    published,
    scheduled_publish_time,
    access_token,
    page_id,
  };

  const response = await axios.post(
    `https://graph.facebook.com/v19.0/${page_id}/photos`,
    postData,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (response.status === 200) {
    res.status(200).json({
      success: true,
      message: "Photo posted successfully on Facebook",
    });
  } else {
    res.status(response.status).json({
      success: false,
      message: "Failed to post photo on Facebook",
    });
  }
};

// export
module.exports = {
  postPhotoToFacebook,
  CreateSubscribe,
};
