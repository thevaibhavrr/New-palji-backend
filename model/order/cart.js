// cart.js
const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orderItems: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
      singleProductPrice: {
        type: Number,
      },
      quantity: {
        type: Number,
        required: true,
      },
      totalPrice:{
        type: Number,
      },
      size: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "productsize",
      },
    
    },
  ],

  totalPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  totalPriceWithoutDiscount: {
    type: Number,
    required: true,
    default: 0.0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
   activecart: {
    type: String,
    default: "true",
  },
  coupancode: {
    type: String,
    default : ""
  },
  couapnDiscount: {
    type: Number,
    default : 0
  }

});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
