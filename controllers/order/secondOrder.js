const SecondorderSchema = require("../../model/order/orders");
const Productsize = require("../../model/Product/productsize");

const TryCatch = require("../../middleware/Trycatch");
const Mail = require("../../utils/sendmail");
const Cart = require("../../model/order/cart");
const Product = require("../../model/Product/product");
const ApiFeatures = require("../../utils/apifeature");
const RazorpayData = require("../order/razorpay/razorpayController");

const CreateSecondOrder = TryCatch(async (req, res, next) => {
  const userId = req.user.id;
  const {
    CartId,
    paymentMethod,
    paymentId,
    paymentorderCratedAt,
    currency,
    paymentDoneAt,
    DeviceType,
  } = req.body;

  // Create the second order
  const secondorder = await SecondorderSchema.create({
    ...req.body,
    userId,
    CartId: CartId,
    // payment details
    isPaid: paymentMethod === "Razorpay",
    paymentId: paymentId || null,
    paymentorderCratedAt: paymentorderCratedAt,
    currency: currency,
    paymentDoneAt,
    DeviceType,
  });

  // Extract order items from the cart
  const cart = await Cart.findById(CartId).populate("orderItems.productId");
  if (!cart) {
    return res.status(404).json({ success: false, message: "Cart not found" });
  }

  // Clear the complete cart
  await Cart.findByIdAndUpdate(CartId, { activecart: "false" });

  // Send mail
  const userEmail = req.user.email;
  const orderDetails = generateOrderDetails(cart);
  const orderTotal = calculateOrderTotal(cart);

  Mail(
    req.user.email,
    "Order Placed Successfully",
    `Congratulations, your order has been placed successfully. Your order details: ${orderDetails} Total amount: ${orderTotal}`,
    (isHTML = true)
  );

  // Update product quantities and check for out of stock
  const updatedProducts = [];
  const lowQuantityProducts = [];
  const outOfStockProducts = [];
  for (const item of cart.orderItems) {
    const product = item.productId;
    const size = item.size;

    const Orderproductsize = await Productsize.findById(size);

    const updatedQuantity = Orderproductsize.quantity - item.quantity;
    const isOutOfStock = updatedQuantity <= 0 ? "true" : "false";

    const updatedProduct = await Productsize.findByIdAndUpdate(
      size,
      { quantity: updatedQuantity, IsOutOfStock: isOutOfStock },
      { new: true }
    );
    if (updatedQuantity < 20 && updatedQuantity > 1) {
      lowQuantityProducts.push(updatedProduct);
    }

    if (updatedQuantity <= 0) {
      outOfStockProducts.push(updatedProduct);
    }
    updatedProducts.push(updatedProduct);
  }

  // Send mail for low quantity products
  if (lowQuantityProducts.length > 0) {
    let lowQuantityMessage =
      "<p>Some products are running low on quantity. Please check your inventory:</p><ul>";
    lowQuantityProducts.forEach((product) => {
      lowQuantityMessage += `<li>${product.name} : <br/> quantity : ${Orderproductsize.quantity} </li> <img loading="lazy" src="${product.thumbnail}" alt="${product.name}" style="max-width: 100px;">`;
    });
    lowQuantityMessage += "</ul>";

    Mail(
      "vaibhavrathorema@gmail.com",
      "Low Product Quantity Alert",
      lowQuantityMessage,
      true
    );
  }

  // Send mail for out of stock products
  // if (outOfStockProducts.length > 0) {
  //   let outOfStockMessage =
  //     "<p>Some products are out of stock. Please update your inventory:</p><ul>";
  //   outOfStockProducts.forEach((product) => {
  //     outOfStockMessage += `<li>${product.name}</li><img loading="lazy" src="${product.thumbnail}" alt="${product.name}" style="max-width: 100px;">`;
  //   });
  //   outOfStockMessage += "</ul>";

  //   Mail(
  //     "vaibhavrathorema@gmail.com",
  //     "Out of Stock Products Alert",
  //     outOfStockMessage,
  //     true
  //   );
  // }

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    secondorder,
    updatedProducts,
    paymentMethod,
    paymentId,
  });
});

// function generateOrderDetails(cart) {
//   const logoUrl =
//     "https://paliji-admin.vercel.app/static/media/logo.749613bd9100ee0b9f00.png";
//   const shopName = "Palji Bakery";
//   const primaryColor = "#ff6f61";
//   const backgroundColor = "#f7f7f7";
//   const textColor = "black";
//   const totalQuantity = cart.orderItems.reduce(
//     (sum, item) => sum + item.quantity,
//     0
//   );
//   const totalDiscount = cart.totalPriceWithoutDiscount - cart.totalPrice;

//   let detailsHtml = `
//     <div style="background-color: ${backgroundColor}; padding: 30px; font-family: Arial, sans-serif; line-height: 1.6;">
//       <!-- Header with Logo and Shop Name -->
//       <div style="text-align: center; margin-bottom: 20px;">
//         <img src="${logoUrl}" alt="${shopName}" style="max-width: 180px; margin-bottom: 15px;">
//         <h1 style="color: ${primaryColor}; font-size: 28px; font-weight: 700; margin: 10px 0;">${shopName}</h1>
//         <p style="color: ${textColor}; font-size: 20px; font-weight: 600;">Congratulations, your order has been placed successfully!</p>
//         <p style="color: #555; font-size: 18px; margin-bottom: 20px;">Your order details are below:</p>
//       </div>

//       <!-- Order Summary -->
//       <h2 style="color: ${primaryColor}; text-align: left; border-bottom: 2px solid ${primaryColor}; padding-bottom: 10px; font-size: 24px; font-weight: 700;">Order Summary</h2>
//       <div style="padding: 20px; border-radius: 10px; background-color: white; border: 1px solid #ccc; margin-bottom: 20px;">
//         ${cart.orderItems
//           .map(
//             (item) => `
//             <div class="order-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee;">
//               <div style="display: flex; align-items: center;">
//                 <img loading="lazy" src="${item.productId.thumbnail}" alt="${item.productId.name}" style="width: 80px; height: 80px; border-radius: 8px; margin-right: 15px; object-fit: cover;">
//                 <div>
//                   <div style="margin: 0; font-size: 18px; font-weight: 700; color: ${textColor};">${item.productId.name}</div>
//                   <div style="color: #555; font-size: 14px; margin: 5px 0;">Quantity: ${item.quantity}</div>
//                   <div style="font-size: 18px; color: ${primaryColor}; font-weight: 600;">₹${item.singleProductPrice}</div>
//                 </div>
//               </div>
//             </div>
//           `
//           )
//           .join("")}
//       </div>

//       <!-- Coupon and Discounts -->
//       ${
//         cart.coupancode
//           ? `
//         <div style="margin: 20px 0; padding: 20px; background-color: white; border-radius: 10px; border: 1px solid #ccc;">
//           <p style="color: ${textColor}; font-size: 18px; font-weight: 600;"><strong>Coupon Code Applied:</strong> ${cart.coupancode}</p>
//           <p style="color: ${textColor}; font-size: 18px; font-weight: 600;"><strong>Coupon Discount:</strong> ₹${cart.couapnDiscount}</p>
//         </div>
//       `
//           : ""
//       }

//       <!-- Total Calculation -->
//       <div style="padding: 20px; background-color: white; border-radius: 10px; border: 1px solid #ccc; margin-top: 20px;">
//         <h3 style="color: ${textColor}; text-align: right; font-size: 20px; font-weight: 700;">Total Quantity: ${totalQuantity}</h3>
//         <h3 style="color: ${textColor}; text-align: right; font-size: 20px; font-weight: 700;">Price Before Discount: ₹${cart.totalPriceWithoutDiscount}</h3>
//         ${
//           totalDiscount > 0
//             ? `<h3 style="color: ${textColor}; text-align: right; font-size: 20px; font-weight: 700;">Total Discount: ₹${totalDiscount}</h3>`
//             : ""
//         }
//         <h3 style="color: ${textColor}; text-align: right; font-size: 20px; font-weight: 700;">Total Price: ₹${cart.totalPrice}</h3>
//       </div>

//       <!-- Thank You Message -->
//       <div style="text-align: center; padding: 30px 0;">
//         <p style="color: ${textColor}; font-size: 18px;">We appreciate your business and hope you enjoy your purchase!</p>
//         <p style="color: ${textColor}; font-size: 18px;">Keep shopping at <strong>${shopName}</strong> for more delicious treats!</p>
//       </div>

//       <!-- Social Media Footer -->
//       <div style="background-color: ${primaryColor}; padding: 15px; text-align: center; border-radius: 10px;">
//         <h4 style="color: white; font-size: 18px; font-weight: 600; margin-bottom: 10px;">Follow Us</h4>
//         <p style="color: white; font-size: 16px;">
//           <a href="https://www.instagram.com/paljibakeryldh?igsh=eXV2bW12cmttdTg%3D" style="color: white; text-decoration: none; transition: color 0.3s;">Instagram</a> | 
//           <a href="https://x.com/paljibakery?lang=en" style="color: white; text-decoration: none; transition: color 0.3s;">Twitter</a> | 
//           <a href="https://www.facebook.com/paljibakery?_rdr" style="color: white; text-decoration: none; transition: color 0.3s;">Facebook</a>
//         </p>
//       </div>
//     </div>
//   `;

//   return detailsHtml;
// }

function generateOrderDetails(cart) {
  const logoUrl =
    "https://paliji-admin.vercel.app/static/media/logo.749613bd9100ee0b9f00.png";
  const shopName = "Palji Bakery";
  const primaryColor = "#ff6f61";
  const backgroundColor = "#f7f7f7";
  const textColor = "#333";
  const totalQuantity = cart.orderItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const totalDiscount = cart.totalPriceWithoutDiscount - cart.totalPrice;

  let detailsHtml = `
    <div style="background-color: ${backgroundColor}; padding: 40px; font-family: Arial, sans-serif; line-height: 1.6; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
      <!-- Header with Logo and Shop Name -->
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${logoUrl}" alt="${shopName}" style="max-width: 180px; margin-bottom: 15px;">
        <h1 style="color: ${primaryColor}; font-size: 32px; font-weight: bold; margin: 10px 0;">${shopName}</h1>
        <p style="color: ${textColor}; font-size: 20px; font-weight: 600;">Congratulations, your order has been placed successfully!</p>
        <p style="color: #555; font-size: 18px; margin-bottom: 20px;">Your order details are below:</p>
      </div>

      <!-- Order Summary -->
      <h2 style="color: ${primaryColor}; text-align: left; border-bottom: 2px solid ${primaryColor}; padding-bottom: 10px; font-size: 28px; font-weight: bold;">Order Summary</h2>
      <div style="padding: 20px; border-radius: 10px; background-color: white; border: 1px solid #ccc; margin-bottom: 30px;">
        ${cart.orderItems
          .map(
            (item) => `
            <div class="order-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee;">
              <div style="display: flex; align-items: center;">
                <img loading="lazy" src="${item.productId.thumbnail}" alt="${item.productId.name}" style="width: 80px; height: 80px; border-radius: 8px; margin-right: 15px; object-fit: cover;">
                <div>
                  <div style="margin: 0; font-size: 18px; font-weight: bold; color: ${textColor};">${item.productId.name}</div>
                  <div style="color: #555; font-size: 14px; margin: 5px 0;">Quantity: ${item.quantity}</div>
                  <div style="font-size: 18px; color: ${primaryColor}; font-weight: 600;">₹${item.singleProductPrice}</div>
                </div>
              </div>
            </div>
          `
          )
          .join("")}
      </div>

      <!-- Coupon and Discounts -->
      ${
        cart.coupancode
          ? `
        <div style="margin: 20px 0; padding: 20px; background-color: white; border-radius: 10px; border: 1px solid #ccc;">
          <p style="color: ${textColor}; font-size: 18px; font-weight: bold;"><strong>Coupon Code Applied:</strong> ${cart.coupancode}</p>
          <p style="color: ${textColor}; font-size: 18px; font-weight: bold;"><strong>Coupon Discount:</strong> ₹${cart.couponDiscount}</p>
        </div>
      `
          : ""
      }

      <!-- Total Calculation -->
     <div style="padding: 20px; background-color: #f9f9f9; border-radius: 10px; border: 2px solid ${primaryColor}; margin-top: 30px;">
  <h3 style="color: ${primaryColor}; text-align: right; font-size: 20px; font-weight: bold;">Total Quantity: <span style="color: ${textColor};">${totalQuantity}</span></h3>
  <h3 style="color: ${primaryColor}; text-align: right; font-size: 20px; font-weight: bold;">Price Before Discount: <span>₹${cart.totalPriceWithoutDiscount}</span></h3>
  ${
    totalDiscount > 0
      ? `<h3 style="color: ${textColor}; text-align: right; font-size: 20px; font-weight: bold;">Total Discount: <span style="color: red;">-₹${totalDiscount}</span></h3>`
      : ""
  }
  <h3 style="color: ${primaryColor}; text-align: right; font-size: 20px; font-weight: bold;">Final Price: <span style="color: ${textColor};">₹${cart.totalPrice}</span></h3>
</div>

      <!-- Thank You Message -->
      <div style="text-align: center; padding: 30px 0;">
        <p style="color: ${textColor}; font-size: 18px;">We appreciate your business and hope you enjoy your purchase!</p>
        <p style="color: ${textColor}; font-size: 18px;">Keep shopping at <strong>${shopName}</strong> for more delicious treats!</p>
      </div>

      <!-- Social Media Footer -->
      <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 10px; margin-top: 30px;">
        <h4 style="color: white; font-size: 20px; font-weight: bold; margin-bottom: 10px;">Follow Us</h4>
        <p style="color: white; font-size: 16px;">
          <a href="https://www.instagram.com/paljibakeryldh?igsh=eXV2bW12cmttdTg%3D" style="color: white; text-decoration: none; transition: color 0.3s;">Instagram</a> | 
          <a href="https://x.com/paljibakery?lang=en" style="color: white; text-decoration: none; transition: color 0.3s;">Twitter</a> | 
          <a href="https://www.facebook.com/paljibakery?_rdr" style="color: white; text-decoration: none; transition: color 0.3s;">Facebook</a>
        </p>
      </div>
    </div>
  `;

  return detailsHtml;
}



function calculateOrderTotal(cart) {
  return cart.orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}

function calculateOrderTotal(cart) {
  let total = 0;
  cart.orderItems.forEach((item) => {
    total += item.totalPrice;
  });
  return total;
}

// get my second order
const GetMySecondOrder = TryCatch(async (req, res, next) => {
  const data = await SecondorderSchema.find({ userId: req.user.id })
    // .populate("CartId")
    .populate({
      path: "CartId",
      populate: {
        path: "orderItems.productId",
        model: "product",
      },
    })
    .populate({
      path: "CartId",
      populate: {
        path: "orderItems.size",
        select: "size sizetype",
      },
    })
    .populate("shippingAddress")
    .populate("billingAddress")
    .populate("userId");

  const secondorders = data.reverse();

  res.status(200).json({
    success: true,
    message: "Orders fetched successfully",
    total: secondorders.length,
    secondorders,
  });
});

// get second order by id
const GetSecondOrderById = TryCatch(async (req, res, next) => {
  const secondorder = await SecondorderSchema.findById(req.params.id)
    .populate("CartId")
    .populate({
      path: "CartId",
      populate: {
        path: "orderItems.productId",
        model: "product",
      },
    })
    .populate({
      path: "CartId",
      populate: {
        path: "orderItems.size",
        select: "size sizetype",
      },
    })
    .populate("shippingAddress")
    .populate("billingAddress")
    .populate("userId");

  res.status(200).json({
    success: true,
    message: "Order fetched successfully vaibhaknknknknk",
    secondorder,
  });
});

// get all orders
const GetAllsecondOrders = TryCatch(async (req, res, next) => {
  const status = req.query.status || "Pending";
  const resultperpage = req.query.resultperpage || 10000;
  // Initialize ApiFeatures with the Order model query and the query string from the request
  const features = new ApiFeatures(SecondorderSchema.find(), req.query)
    // Apply search functionality if 'name' is provided in the query string
    .search()
    .filterByStatus(status)
    // Apply pagination with default limit of 10 items per page
    .paginate(resultperpage);

  // Execute the query with applied features
  const ALlOrders = await features.query
    // Populate necessary fields
    .populate("CartId")
    .populate({
      path: "CartId",
      populate: {
        path: "orderItems.productId",
        model: "product",
      },
    })
    .populate({
      path: "CartId",
      populate: {
        path: "orderItems.size",
        select: "size sizetype",
      },
    })
    .populate("shippingAddress")
    .populate("billingAddress")
    .populate("userId");

  const Orders = ALlOrders.reverse();

  // Send response
  res.status(200).json({
    success: true,
    count: Orders.length,
    Orders,
  });
});

// update order
const UpdateSecondOrder = TryCatch(async (req, res, next) => {
  // req.body.UpdateAt = Date.now();
  const secondorder = await SecondorderSchema.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  // UpdateAt
  res.status(200).json({
    success: true,
    message: "Order updated successfully",
    secondorder,
  });
});

// exports
module.exports = {
  CreateSecondOrder,
  GetMySecondOrder,
  GetSecondOrderById,
  GetAllsecondOrders,
  UpdateSecondOrder,
  // CreateRazorpayOrder: RazorpayData.CreateRazorpayOrder,
  // Getpaymentdetailsbyorderid: RazorpayData.Getpaymentdetailsbyorderid,
};
