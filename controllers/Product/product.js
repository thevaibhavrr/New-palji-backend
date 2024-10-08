const Product = require("../../model/Product/product");
const Include = require("../../model/Product/include");
const Nutrition = require("../../model/Product/nutrition");
const ProductSize = require("../../model/Product/productsize");


const Trycatch = require("../../middleware/Trycatch");
const ApiFeatures = require("../../utils/apifeature");

const CreateProduct = Trycatch(async (req, res, next) => {
  const { price, discountPercentage, productSizes,productNuturitions } = req.body;
  const { deliverables } = req.body;
  
  let product;
  if (discountPercentage) {
    const discountedPrice = (price - price * (discountPercentage / 100)).toFixed(2);
    product = await Product.create({
      ...req.body,
      PriceAfterDiscount: discountedPrice,
    });
  } else {
    product = await Product.create(req.body);
  }
  if (productSizes && productSizes.length > 0) {
    for (let size of productSizes) {
      const productSize = await ProductSize.create({
        ...size,
        productId: product._id,
      });
      
    }
  }
  // Nutrition
  if (productNuturitions && productNuturitions.length > 0) {
    for (let nutrition of productNuturitions) {
      const productNutrition = await Nutrition.create({
        ...nutrition,
        productId: product._id,
        nutrition : nutrition.name,
        value : nutrition.value
      });
    }
  }
   // Add deliverables
   for (let deliverable of deliverables) {
    await Include.create({
      productId: product._id,
      include: deliverable,
    });
  }

  res.status(201).json({
    success: true,
    product,
  });
});



// get all products
const GetAllProductsForAdmin = Trycatch(async (req, res, next) => {
  const perPageData = req.query.perPage;
  let { minPrice, maxPrice } = req.query;
  let category = req.query.category;
  let IsOutOfStock = req.query.IsOutOfStock;
  let productType = req.query.productType;
  category = category ? category : "";
  IsOutOfStock = IsOutOfStock ? IsOutOfStock : "";

  // result per page
  const resultPerPage = perPageData ? perPageData : 10000;
  //   price
  minPrice = minPrice ? minPrice : 1;
  maxPrice = maxPrice ? maxPrice : 1000000000;
  const features = new ApiFeatures(Product.find(), req.query)
    .search()
    .paginate(resultPerPage)
    // .filterByPriceRange(minPrice, maxPrice)
    .filterByCategory(category)
    .filterByStock(IsOutOfStock);

  features.query.populate("category");

  const Allproducts = await features.query;

  const products = Allproducts.reverse();

  // count total products
  const totalProductsCount = await Product.countDocuments();
  // updateProductType()
  res.status(200).json({
    resultPerPage,
    success: true,
    totalProducts: totalProductsCount,
    products,
  });
});



const GetAllProducts = Trycatch(async (req, res, next) => {
  const perPageData = req.query.perPage;
  let { minPrice, maxPrice } = req.query;
  let category = req.query.category;
  let IsOutOfStock = req.query.IsOutOfStock;
  let productType = req.query.productType;
  category = category ? category : "";
  IsOutOfStock = IsOutOfStock ? IsOutOfStock : "";

  // result per page
  const resultPerPage = perPageData ? perPageData : 10000;
  // price
  minPrice = minPrice ? minPrice : 0;
  maxPrice = maxPrice ? maxPrice : 1000000000;

  const features = new ApiFeatures(Product.find(), req.query)
    .search()
    .filterByPriceRange(minPrice, maxPrice)
    .filterByCategory(category)
    .filterByStock(IsOutOfStock)
    .filterByproductType(productType);

  // Get all matching products first (without pagination)
  const allMatchingProducts = await features.query.clone(); // clone() to prevent modifying the original query

  // Count the total number of matching products
  const totalMatchingProducts = allMatchingProducts.length;

  // Apply pagination
  features.paginate(resultPerPage);

  // Fetch the paginated products
  const paginatedProducts = await features.query;

  // Reverse the order of the products
  const products = paginatedProducts.reverse();

  res.status(200).json({
    resultPerPage,
    success: true,
    totalProducts: totalMatchingProducts, // Return the total number of matching products
    products,
  });
});


// get single product
const GetSingleProduct = Trycatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate("category");
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }
  // send all Include
  const sizes = await ProductSize.find({ productId: product._id });
  const include = await Include.find({ productId: req.params.id })
  const productNuturitions = await Nutrition.find({ productId: req.params.id })
  res.status(200).json({
    success: true,
    include,
    product,
    sizes,
    productNuturitions
  });
});


const UpdateProduct = Trycatch(async (req, res, next) => {
  // Update the product
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  const productSizes = await ProductSize.find({ productId: updatedProduct._id });
  const allSizesOutOfStock = productSizes.every(size => size.IsOutOfStock === "true");
  updatedProduct.IsOutOfStock = allSizesOutOfStock ? "true" : "false";

  // Check if quantity is greater than 0
  // if (updatedProduct.quantity > 0) {
  //   updatedProduct.IsOutOfStock = "false";
  // } else {
  //   updatedProduct.IsOutOfStock = "true";
  // }

  // Save the updated product with IsOutOfStock updated
  const product = await updatedProduct.save();

  res.status(200).json({
    success: true,
    product,
  });
});


// const UpdateProduct = Trycatch(async (req, res, next) => {
//   // Update the product
//   const updatedProduct = await Product.findByIdAndUpdate(
//     req.params.id,
//     req.body,
//     {
//       new: true,
//       runValidators: true,
//       useFindAndModify: false,
//     }
//   );

//   // Check if quantity is greater than 0
//   if (updatedProduct.quantity > 0) {
//     updatedProduct.IsOutOfStock = "false";
//   } else {
//     updatedProduct.IsOutOfStock = "true";
//   }

//   // Save the updated product with IsOutOfStock updated
//   const product = await updatedProduct.save();

//   res.status(200).json({
//     success: true,
//     product,
//   });
// });

const updateProductType = async () => {
  try {
    // Find all products that don't have the productType field
    const productsToUpdate = await Product.find({
      productType: { $exists: false },
    });

    // Update each product with the default value for productType
    const updatedProducts = await Promise.all(
      productsToUpdate.map(async (product) => {
        product.productType = "Domestic"; // Set default value for productType
        return await product.save(); // Save the updated product
      })
    );

    console.log("Products updated successfully:", updatedProducts.length);
  } catch (error) {
    console.error("Error updating products:", error);
  }
};

// delete product
const DeleteProduct = Trycatch(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }
  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// exports
module.exports = {
  CreateProduct,
  GetAllProducts,
  GetSingleProduct,
  UpdateProduct,
  DeleteProduct,
  GetAllProductsForAdmin
};
