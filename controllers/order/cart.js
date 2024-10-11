const Cart = require("../../model/order/cart");
const TryCatch = require("../../middleware/Trycatch");
const Product = require("../../model/Product/product");
const Coupon = require("../../model/coupan/coupan");
const Productsize = require("../../model/Product/productsize");

const addToCart = TryCatch(async (req, res, next) => {
  try {
    const { productId, quantity, selectProductSize } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Product does not exist.",
      });
    }

    // Check if user has an existing cart
    let cart = await Cart.findOne({ userId: req.user.id, activecart: "true" });

    if (!cart) {
      // If no cart exists, create a new one
      cart = new Cart({ userId: req.user.id, orderItems: [] });
    }

    // Check if the cart has orderItems array
    if (!cart.orderItems || !Array.isArray(cart.orderItems)) {
      cart.orderItems = [];
    }

    // Find the product in the cart
    const existingItemIndex = cart.orderItems.findIndex((item) => {
      return (
        item.productId.toString() === productId.toString() &&
        item.size.toString() === selectProductSize.toString()
      );
    });

    if (existingItemIndex !== -1) {
      // If product exists, update the quantity
      cart.orderItems[existingItemIndex].quantity += quantity;
    } else {
      // If product doesn't exist, add it to the cart
      cart.orderItems.push({
        productId,
        quantity,
        size: selectProductSize,
      });
    }

    await cart.save();

    // Calculate total price considering coupons
    const processedOrderItems = await calculateTotalPriceWithCoupons(
      cart.orderItems
    );
    // Calculate total product price
    const totalProductPrice = processedOrderItems.reduce(
      (total, item) => total + item.totalPrice,
      0
    );
    const PriceWithoutDiscount = processedOrderItems.reduce(
      (total, item) => total + item.WithOurDiscount,
      0
    );
    // Update the existing cart with new details
    cart.orderItems = processedOrderItems;
    cart.totalPriceWithoutDiscount = PriceWithoutDiscount;
    cart.totalPrice = totalProductPrice;

    // Save the updated cart to the database
    await cart.save();

    // Send response with order details
    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

async function calculateTotalPriceWithCoupons(orderItems) {
  const processedItems = [];

  for (const orderItem of orderItems) {
    const product = await Product.findById(orderItem.productId);
    const productsize = await Productsize.findById(orderItem.size);

    const itemTotalPrice = orderItem.quantity * productsize.FinalPrice;
    const WithOurDiscount = orderItem.quantity * productsize.price;

    processedItems.push({
      productId: product._id,
      quantity: orderItem.quantity,
      totalPrice: itemTotalPrice,
      singleProductPrice: productsize.FinalPrice,
      size: orderItem.size,
      WithOurDiscount: WithOurDiscount,
    });
  }

  return processedItems;
}

const GetCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id, activecart: "true" })
      .populate({
        path: "orderItems",
        populate: {
          path: "productId",
          select: "name price PriceAfterDiscount discountPercentage thumbnail",
          model: "product",
        },
      })
      .populate({
        path: "orderItems",
        populate: {
          path: "size",
          model: "productsize",
          select: "size sizetype price discountPercentage FinalPrice",
        },
      });

    if (!cart) {
      return res.status(200).json({ message: "Cart is empty" });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const RemoveFromCart = TryCatch(async (req, res) => {
  const { productId, selectProductSize } = req.body;

  const userId = req.user.id;
  try {
    // Find the cart for the logged-in user
    let cart = await Cart.findOne({ userId, activecart: "true" });

    if (!cart) {
      return res.status(400).json({
        success: false,
        message: "Cart not found for the user.",
      });
    }

    const productIndex = cart.orderItems.findIndex((item) => {
      return (
        item.productId.toString() === productId.toString() &&
        item.size.toString() === selectProductSize.toString()
      );
    });

    // Decrease the quantity of the product in the cart
    cart.orderItems[productIndex].quantity -= 1;

    // If quantity becomes zero, remove the product from the cart
    if (cart.orderItems[productIndex].quantity === 0) {
      cart.orderItems.splice(productIndex, 1);
    }

    // Recalculate cart details
    const processedItems = await calculateTotalPriceWithCoupons(
      cart.orderItems
    );

    const totalProductPrice = processedItems.reduce(
      (total, item) => total + item.totalPrice,
      0
    );
    const PriceWithoutDiscount = processedItems.reduce(
      (total, item) => total + item.WithOurDiscount,
      0
    );

    // Update cart details
    cart.orderItems = processedItems;
    cart.totalPriceWithoutDiscount = PriceWithoutDiscount;
    cart.totalPrice = totalProductPrice;

    // Save the updated cart
    await cart.save();

    // Send success response with updated cart
    res.status(200).json({
      success: true,
      message: "Cart updated successfully.",
      cart,
    });
  } catch (error) {
    // Handle errors when updating cart
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Controller function to remove a complete product from the cart
const DeleteProductFromCart = TryCatch(async (req, res) => {
  const { productId, selectProductSize, productQuantity } = req.body;
  const userId = req.user.id;
  try {
    // Find the cart for the logged-in user
    let cart = await Cart.findOne({ userId, activecart: "true" });

    if (!cart) {
      return res.status(400).json({
        success: false,
        message: "Cart not found for the user.",
      });
    }

    const productIndex = cart.orderItems.findIndex((item) => {
      return (
        item.productId.toString() === productId.toString() &&
        item.size.toString() === selectProductSize.toString()
      );
    });

    // Decrease the quantity of the product in the cart
    cart.orderItems[productIndex].quantity -= productQuantity;

    // If quantity becomes zero, remove the product from the cart
    if (cart.orderItems[productIndex].quantity === 0) {
      cart.orderItems.splice(productIndex, 1);
    }

    // Recalculate cart details
    const processedItems = await calculateTotalPriceWithCoupons(
      cart.orderItems
    );

    const totalProductPrice = processedItems.reduce(
      (total, item) => total + item.totalPrice,
      0
    );
    const PriceWithoutDiscount = processedItems.reduce(
      (total, item) => total + item.WithOurDiscount,
      0
    );

    // Update cart details
    cart.orderItems = processedItems;
    cart.totalPriceWithoutDiscount = PriceWithoutDiscount;
    cart.totalPrice = totalProductPrice;

    // Save the updated cart
    await cart.save();

    // Send success response with updated cart
    res.status(200).json({
      success: true,
      message: "Cart updated successfully.",
      cart,
    });
  } catch (error) {
    // Handle errors when updating cart
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// couapn section
const ApplyCoupon = TryCatch(async (req, res) => {
  const { coupon } = req.body;

  const couapnFind = await Coupon.findOne({ Coupancode: coupon });

  if (!couapnFind) {
    return res.status(400).json({
      success: false,
      message: "Coupon not found.",
    });
  }
  const cart = await Cart.findOne({
    userId: req.user.id,
    activecart: "true",
  });
  const couponDiscountPercentage = await couapnFind.discountPercentage;
  const cartTotalPrice = cart.totalPrice;

  // Calculate
  const discountAmount = (cartTotalPrice * couponDiscountPercentage) / 100;
  const priceAfterCouponDiscount = cartTotalPrice - discountAmount;

  // update cart
  cart.totalPrice = priceAfterCouponDiscount;
  cart.coupancode = coupon;
  cart.couapnDiscount = discountAmount;

  await cart.save();

  res.json({
    message: "coupon applied successfully",
    discountAmount,
    priceAfterCouponDiscount,
    cart,
  });
});

const RemoveCoupon = TryCatch(async (req, res) => {
  const cart = await Cart.findOne({
    userId: req.user.id,
    activecart: "true",
  });

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: "Cart not found.",
    });
  }

  // Check if a coupon is applied
  if (!cart.coupancode) {
    return res.status(400).json({
      success: false,
      message: "No coupon applied to remove.",
    });
  }

  const originalTotalPrice = cart.totalPrice + cart.couapnDiscount;

  cart.couapnDiscount = 0;
  cart.coupancode = "";
  cart.totalPrice = originalTotalPrice;

  await cart.save();

  res.json({
    message: "Coupon removed successfully",
    cart,
  });
});

// export
module.exports = {
  addToCart,
  GetCart,
  RemoveFromCart,
  ApplyCoupon,
  RemoveCoupon,
  DeleteProductFromCart,
};
