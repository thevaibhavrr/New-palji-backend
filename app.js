const express = require("express");
const cors = require("cors");
const User = require("./routes/user");
const Product = require("./routes/product");
const Category = require("./routes/category");
const Address = require("./routes/address");
// const Order = require("./routes/order");
const Admin = require("./routes/admin");
const Coupan = require("./routes/Coupan");
const Wishlist = require("./routes/Wishlist");
const Message = require("./routes/usermessage");
const Subscribe = require("./routes/subscribe");
const Cart = require("./routes/cart");
const SecondOrder = require("./routes/SecondOrder");
const cookieParser = require("cookie-parser");
const axios = require("axios");
// define app using express
const app = express();

// middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// use routes
app.use(
  "/api",
  User,
  Product,
  Category,
  Address,
  // Order,
  Admin,
  Wishlist,
  Coupan,
  Message,
  Subscribe,
  Cart,
  SecondOrder
);

// default route
app.get("/", (req, res) => {
  res.send("Hello World!, Server is running");
});

// const data = [
//   {
//     message: "Hello World! 11:13:16  sec ",
//     time: 1713941415,
//     firstName:"1",
//     lastName:"1.1",
//     email:"firstemail@gmail.com",
//     mobileNumber:"11111111",
//     password:"11111"
//   },
//   {
//       message: "Hello World! 2  10:55:50 ",
//       time: 1713941475,
//       firstName:"2",
//       lastName:"2.2",
//       email:"secondemail@gmail.com",
//       mobileNumber:"22222222",
//       password:"22222"
//   },
//   {
//       message: "Hello World! 3 10:56:15 ",
//       time: 1713941535,
//       firstName:"3",
//       lastName:"3.3",
//       email:"thirdemail@gmail.com",
//       mobileNumber:"33333333",
//       password:"33333"
//   },
// ];
// function scheduleMessages() {
//   data.forEach(({ message, time, firstName, lastName, email, mobileNumber, password }) => {
//     const delay = time * 1000 - Date.now();
//     if (delay > 0) {
//       setTimeout(() => {
//         const signuptesting = async () => {
//           try {
//              await axios.post("https://pajiweb.onrender.com/api/register-user", {
//               firstName: firstName,
//               lastName: lastName,
//               password: password,
//               email: email,
//               mobileNumber: mobileNumber,
//             });
//           } catch (error) {
//             console.log("Error during signup:", error);
//           }
//         };

//         signuptesting();
//       }, delay);
//     }
//   });
// }

// scheduleMessages();

// exporting app
module.exports = app;
