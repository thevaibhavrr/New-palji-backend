const mongoose = require("mongoose");
const validator = require("validator");
const jsonWebToken = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Define user schema
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: [true, "Email already exists"],
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  mobileNumber: {
    type: Number,
    required: true,
    unique: [true, "Mobile number already exists"],
  },
  userImage: {
    type: String,
    default:
      "https://media.istockphoto.com/id/1131164548/vector/avatar-5.jpg?s=612x612&w=0&k=20&c=CK49ShLJwDxE4kiroCR42kimTuuhvuo2FH5y_6aSgEo=",
  },
  password: {
    type: String,
    required: true, 
    select: false,
  },
  gender: {
    type: String,
  },
  dateofbirth: {
    type: Date,
  },
  role: {
    type: String,
    default: "user",
  },
  country : {
    type: String,
    default: "India",
  }
});

// Encrypt password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Json web token
userSchema.methods.getJWTToken = function () {
  return jsonWebToken.sign(
    { id: this._id },
    process.env.JWT_SECRET
    //   , {
    //   expiresIn: process.env.JWT_EXPIRE,
    // }
  );
};

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export user model
module.exports = mongoose.model("User", userSchema);
