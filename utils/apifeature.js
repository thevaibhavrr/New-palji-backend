// class ApiFeatures {
//     constructor(query, queryStr) {
//     (this.query = query), (this.queryStr = queryStr);
//   }

//   //   search
//   search() {
//     const name = this.queryStr.name
//       ? {
//           name: {
//             $regex: this.queryStr.name,
//             $options: "i",
//           },
//         }
//       : {};
//     this.query = this.query.find({ ...name });
//     return this;
//   }
//   // pagiation
//   paginate(perPage) {
//     const page = parseInt(this.queryStr.page) || 1;
//     const limit = parseInt(this.queryStr.limit) || perPage;
//     const skip = (page - 1) * limit;

//     this.query = this.query.limit(limit).skip(skip);
//     return this;
//   }
//   // search products by price range
//   filterByPriceRange(minPrice, maxPrice) {
//     const priceFilter = {
//       PriceAfterDiscount: {
//         $gte: minPrice,
//         $lte: maxPrice,
//       },
//     };

//     this.query = this.query.find(priceFilter);
//     return this;
//   }

  
//   filterByStatus(status) {
//     const statusFilter = {
//         status: status
//     };

//     this.query = this.query.find(statusFilter);
//     return this;
// }
// filterByproductType(productType){

//     const productTypeFilter = {
//       productType : productType
//     }
//      this.query = this.query.find(productTypeFilter);
//        return this;
// }
// filterByCategory(categoryId) {
//   const categoryFilter = categoryId
//     ? { category: categoryId }
//     : {};

//   this.query = this.query.find(categoryFilter);
//   return this;
// }
// // find product by stock
// // filterByStock (stock) {
  
// //   const stockFilter = stock ? { IsOutOfStock: stock } : {};
// //   // const stockFilter = stock ? { IsOutOfStock: false } : {};
// //   this.query = this.query.find(stockFilter);
// //   return this
// // }
// filterByStock(stock) {
//   if (stock === 'true' || stock === true) {
//     this.query = this.query.where('IsOutOfStock').equals(true);
//   } else if (stock === 'false' || stock === false) {
//     this.query = this.query.where('IsOutOfStock').equals(false);
//   }
//   return this;
// }

// }
// module.exports = ApiFeatures;


class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  // Search
  search() {
    const name = this.queryStr.name
      ? {
          name: {
            $regex: this.queryStr.name,
            $options: "i",
          },
        }
      : {};
    this.query = this.query.find({ ...name });
    return this;
  }

  // Pagination
  paginate(perPage) {
    const page = parseInt(this.queryStr.page) || 1;
    const limit = parseInt(this.queryStr.limit) || perPage;
    const skip = (page - 1) * limit;

    this.query = this.query.limit(limit).skip(skip);
    return this;
  }

  // Filter by Price Range
  filterByPriceRange(minPrice, maxPrice) {
    const priceFilter = {
      PriceAfterDiscount: {
        $gte: minPrice,
        $lte: maxPrice,
      },
    };

    this.query = this.query.find(priceFilter);
    return this;
  }

  // Filter by Status
  filterByStatus(status) {
    const statusFilter = {
      status: status
    };

    this.query = this.query.find(statusFilter);
    return this;
  }

  // Filter by Product Type
  filterByproductType(productType) {
    const productTypeFilter = {
      productType: productType
    };
    this.query = this.query.find(productTypeFilter);
    return this;
  }

  // Filter by Category
  filterByCategory(categoryId) {
    const categoryFilter = categoryId
      ? { category: categoryId }
      : {};

    this.query = this.query.find(categoryFilter);
    return this;
  }

  // Filter by Stock
  filterByStock(stock) {
    if (stock === 'true' || stock === true) {
      this.query = this.query.where('IsOutOfStock').equals(true);
    } else if (stock === 'false' || stock === false) {
      this.query = this.query.where('IsOutOfStock').equals(false);
    }
    return this;
  }
}

module.exports = ApiFeatures;
