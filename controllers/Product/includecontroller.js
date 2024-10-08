const Include = require("../../model/Product/include");
const Trycatch = require("../../middleware/Trycatch");

// create include
const CreateInclude = Trycatch(async (req, res, next) => {
  const include = await Include.create(req.body);
  res.status(201).json({
    success: true,
    include,
  });
});

// get all includes
const GetAllIncludes = Trycatch(async (req, res, next) => {
  
  const includes = await Include.find({ productId: req.params.productId });
  const totalIncludes = includes.length;
  res.status(200).json({
    success: true,
    totalIncludes,
    includes,
  });
});

// update include
const UpdateInclude = Trycatch(async (req, res, next) => {
  
  const include = await Include.findByIdAndUpdate(req.params.productId, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    include,
  });
});

// delete include
const DeleteInclude = Trycatch(async (req, res, next) => {
  const include = await Include.findByIdAndDelete(req.params.productId);
  if (!include) {
    return res.status(404).json({
      success: false,
      message: "Include not found",
    });
  }
  res.status(200).json({
    success: true,
    include,
  });
});

// exports
module.exports = {
  CreateInclude,
  GetAllIncludes,
  UpdateInclude,
  DeleteInclude,
};
