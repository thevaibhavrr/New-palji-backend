const mongoose = require("mongoose");

const productSizeSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
    },
    nutrition: {
      type: String,
    },
    value: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("nutrition", productSizeSchema);
