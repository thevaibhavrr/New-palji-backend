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

// auth
// const session = require("express-session");
// const passport = require("./config/passportConfig");
// const authRoutes = require("./routes/authRoutes");
 
// define app using express
const app = express();

// middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


// auth 
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//   })
// );

// app.use(passport.initialize());
// app.use(passport.session());


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
  SecondOrder,
  // authRoutes
);

// default route
app.get("/", (req, res) => {
  res.send("Hello World!, Server is running");
});

// API Key and Endpoint
const API_KEY = 'AIzaSyC173q3386aM6I6clEXS2ED_F4eEtgcPQw';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

// Route to handle question submissions
app.post('/api/ask', async (req, res) => {
  const { question } = req.body;

  try {
    // Updated payload structure
    const requestBody = {
      contents: [
        {
          parts: [
            { text: question }
          ]
        }
      ]
    };

    // Make a POST request to Gemini API
    const response = await axios.post(GEMINI_ENDPOINT, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Extract the AI-generated response
    const aiResponse = response.data.candidates[0].content;
    res.json({ answer: aiResponse });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});


module.exports = app;
