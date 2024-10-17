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


    if (cart.coupancode) {
      const couponFind = await Coupon.findOne({ Coupancode: cart.coupancode });
      if (couponFind) {
        const couponDiscountPercentage = couponFind.discountPercentage;
        const discountAmount = (cart.totalPrice * couponDiscountPercentage) / 100;
        cart.couapnDiscount = discountAmount;
        cart.totalPrice -= discountAmount;
      }
    }

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
    if (cart.orderItems.length === 0) {
      cart.coupancode = "";
      cart.couapnDiscount = 0;
      cart.totalPrice = 0;
      cart.activecart = false;
    }
    if (cart.coupancode) {
      const couponFind = await Coupon.findOne({ Coupancode: cart.coupancode });
      if (couponFind) {
        const couponDiscountPercentage = couponFind.discountPercentage;
        const discountAmount = (cart.totalPrice * couponDiscountPercentage) / 100;
        cart.couapnDiscount = discountAmount;
        cart.totalPrice -= discountAmount;
      }
    }

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


    if (cart.coupancode) {
      const couponFind = await Coupon.findOne({ Coupancode: cart.coupancode });
      if (couponFind) {
        const couponDiscountPercentage = couponFind.discountPercentage;
        const discountAmount = (cart.totalPrice * couponDiscountPercentage) / 100;
        cart.couapnDiscount = discountAmount;
        cart.totalPrice -= discountAmount;
      }
    }

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

const ApplyCoupon = TryCatch(async (req, res) => {
  try {
    const { coupon } = req.body;

    // Find the coupon in the database
    const couponFind = await Coupon.findOne({ Coupancode: coupon });

    // If coupon is not found, return error
    if (!couponFind) {
      return res.status(400).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    // Check if the coupon is within the valid date range
    const currentDate = new Date();
    const startDate = new Date(couponFind.startDate);
    const endDate = new Date(couponFind.endDate);

    if (currentDate < startDate || currentDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "Coupon is expired or not valid at this time.",
      });
    }

    // Find the active cart for the user
    const cart = await Cart.findOne({
      userId: req.user.id,
      activecart: true,
    });

    if (!cart) {
      return res.status(400).json({
        success: false,
        message: "No active cart found.",
      });
    }

    const cartTotalPrice = cart.totalPrice;

    // Handle coupon types
    if (couponFind.coupanfor === "minimumOrderValue") {
      const minimumOrderValue = couponFind.minimumOrderValue;
      if (cartTotalPrice < minimumOrderValue) {
        return res.status(400).json({
          success: false,
          message: `This coupon requires a minimum order value of ${minimumOrderValue}.`,
        });
      }
    }

    // Calculate discount
    const couponDiscountPercentage = couponFind.discountPercentage;
    const discountAmount = (cartTotalPrice * couponDiscountPercentage) / 100;
    const priceAfterCouponDiscount = cartTotalPrice - discountAmount;

    // Update the cart with the discounted price
    cart.totalPrice = priceAfterCouponDiscount;
    cart.coupancode = coupon;
    cart.couapnDiscount = discountAmount;

    await cart.save();

    // Respond with the updated cart and discount details
    return res.json({
      success: true,
      message: "Coupon applied successfully.",
      discountAmount,
      priceAfterCouponDiscount,
      cart,
    });
  } catch (error) {
    // Handle unexpected errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while applying the coupon.",
    });
  }
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
