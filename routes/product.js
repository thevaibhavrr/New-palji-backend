const express = require("express");
const Product = express.Router();
const Data = require("../controllers/Product/product");
const auth = require("../middleware/Auth");
const Include = require("../controllers/Product/includecontroller");
const ProductSize = require("../controllers/Product/Productsize");


// ProductSize
Product.route("/update-productsize/:id").put(auth.IsAuthenticateUser,auth.authorizeRole("admin") ,ProductSize.UpdateProductsize)
Product.route("/delete-productsize/:id").delete(auth.IsAuthenticateUser,auth.authorizeRole("admin") ,ProductSize.DeleteProductsize)


// create product
Product.route("/create-product").post(auth.IsAuthenticateUser,auth.authorizeRole("admin") ,Data.CreateProduct)

// get all products
Product.route("/get-all-products").get(Data.GetAllProducts)

Product.route("/get-all-products-for-admin").get(Data.GetAllProductsForAdmin)

// get single product
Product.route("/get-single-product/:id").get(Data.GetSingleProduct)

// update product
Product.route("/update-product/:id").put(auth.IsAuthenticateUser,auth.authorizeRole("admin") ,Data.UpdateProduct)

// delete product
Product.route("/delete-product/:id").delete(auth.IsAuthenticateUser,auth.authorizeRole("admin") ,Data.DeleteProduct)


// Include
Product.route("/include-product").post(auth.IsAuthenticateUser,auth.authorizeRole("admin") ,Include.CreateInclude)
  
// get all includes
Product.route("/get-all-includes/:productId").get(Include.GetAllIncludes)

// update include
Product.route("/update-include/:productId").put(auth.IsAuthenticateUser,auth.authorizeRole("admin") ,Include.UpdateInclude)

// delete include
Product.route("/delete-include/:productId").delete(auth.IsAuthenticateUser,auth.authorizeRole("admin") ,Include.DeleteInclude)


// exports
module.exports = Product