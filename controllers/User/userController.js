const Trycatch = require("../../middleware/Trycatch");
const User = require("../../model/User/users");
const sendToken = require("../../utils/userToken");
const Mail = require("../../utils/sendmail");

// Register User
const RegisterUser = Trycatch(async (req, res, next) => {
  // Check if the email already exists
  const useremail = await User.findOne({ email: req.body.email });
  const usermobile = await User.findOne({ mobileNumber: req.body.mobileNumber });

  if (usermobile) {
    return res.status(400).json({ 
      success: false,
      message: "Mobile number already exists",
    });
  }
  if (useremail) {
    return res.status(400).json({
      success: false,
      message: "User already exists",
    });
  }
   
  // Create the user
  const user = await User.create(req.body);

  const logoUrl = "https://paliji-admin.vercel.app/static/media/logo.749613bd9100ee0b9f00.png";
  const shopName = "Palji Bakery";
  const yourLoginPageUrl = "https://palji-bakeryy.vercel.app/Signup"

  // Email content
  const emailContent = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background-color: #f7f7f7;">
      <div style="text-align: center;">
        <img src="${logoUrl}" alt="${shopName} Logo" style="width: 150px; margin-bottom: 20px;" />
        <h1 style="color: #ff6f61;">Welcome to ${shopName}!</h1>
      </div>
      <div style="padding: 20px; background-color: #ffffff; border-radius: 8px;">
        <p style="font-size: 16px; line-height: 1.5;">
          Dear ${user.name || 'Customer'},
        </p>
        <p style="font-size: 16px; line-height: 1.5;">
          Congratulations! You have successfully registered with <strong>${shopName}</strong>.
        </p>
        <p style="font-size: 16px; line-height: 1.5;">
          You can now log in to your account and start exploring our delicious products and exclusive offers.
        </p>
        <p style="font-size: 16px; line-height: 1.5;">
          Thank you for joining our community. We're excited to have you on board!
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
        <a href="${yourLoginPageUrl}" style="background-color: #ff6f61; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">Log In to Your Account</a>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <p style="font-size: 14px; color: #777;">
          &copy; ${new Date().getFullYear()} ${shopName}. All rights reserved.
        </p>
      </div>
    </div>
  `;

  // Send the email
  Mail(
    user.email,
    "Registered Successfully",
    emailContent, 
    true
  );
  sendToken(user, 201, res);

  // Send the response
  res.status(201).json({
    success: true,
    user,
  });
});


// Login User
const LoginUser = Trycatch(async (req, res, next) => {
  const { email, password } = req.body;
  //   if there is no email and password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email and password",
    });
  }

  //   check if user exists
  const user = await User.findOne({ email }).select("+password");

  //   if user does not exist
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  //   if user exists
  const isMatch = await user.comparePassword(password);
  // if password does not match
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }
  // if all is good then send token
  sendToken(user, 200, res);
});

// my profile
const myProfile = Trycatch(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});

// update user
const updateUser = Trycatch(async (req, res, next) => {
  if (req.body.mobileNumber) {
      // find mobile number
    const mobileNumberCheck = await User.findOne({ mobileNumber: req.body.mobileNumber });
    if (mobileNumberCheck) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already exists",
      });
    }

  }
  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "User updated successfully",
    user,
  });
});

// get all users
const getAllUsers = Trycatch(async (req, res, next) => {
  const users = await User.find();
  const totalUsers = users.length;
  res.status(200).json({
    success: true,
    totalUsers,
    users,
  });
});

// delete user
const deleteUser = Trycatch(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
  await user.remove();
  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

// get single user
const getSingleUser = Trycatch(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
  res.status(200).json({
    success: true,
    user,
  });
});

// forgot password

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};
// otp
var OTPs = {};

// send otp and update password
const ForgotPassword = Trycatch(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  // check user us exist or not
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
  // generate otp
  const OTP = generateOTP();
  OTPs[email] = OTP;

  // send otp
  try {
    await Mail(
      email,
      "Password Reset OTP",
      `Your OTP for resetting the password is: ${OTP}. Please do not share this OTP with anyone.`
    );
    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
});

// check otp
const checkOTP = Trycatch(async (req, res, next) => {
  const { email, OTP } = req.body;
  if (OTPs[email] !== OTP) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP",
    });
  }else{
    // remove OTP
    delete OTPs[email];
  }

  res.status(200).json({
    success: true,
    message: "OTP verified",
  });
})

// reset password with OTP
const resetPasswordWithOTP = Trycatch(async (req, res, next) => {
  const { email,  newPassword } = req.body;
  const user = await User.findOne({ email });
  // if user does not exist
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
  // update password
  user.password = newPassword;
  await user.save();

  

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

// Send Email to All Registered Users
const sendEmailToAllUsers = Trycatch(async (req, res, next) => {
  const {template} = req.body
  // Fetch all registered users
  const users = await User.find();

  // Check if there are any users
  if (users.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No users found",
    });
  }

  let emailsSentCount = 0;

  // Send email to each user
  for (let user of users) {
    await Mail(
      user.email,
      "Test email from vaibhav ",
      "This is testing email from Palji-Bakery E-com.",
     template 
    );
    emailsSentCount++;
  }

  res.status(200).json({
    success: true,
    message: "Email sent to all registered users",
    usersCount: users.length,
    emailsSentCount: emailsSentCount
  });
});

// export all
module.exports = {
  RegisterUser,
  LoginUser,
  myProfile,
  updateUser,
  getAllUsers,
  deleteUser,
  getSingleUser,
  ForgotPassword,
  resetPasswordWithOTP,
  sendEmailToAllUsers,
  checkOTP
};


